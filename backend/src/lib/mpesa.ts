// backend/src/lib/mpesa.ts
// ✅ Sandbox/Live aware STK Push helper + token caching + strict phone normalization
// - Uses MPESA_ENV=sandbox|production OR MPESA_BASE_URL override
// - Default TransactionType: CustomerBuyGoodsOnline (Till)
// - Logs Daraja error bodies (safe) for quick debugging

import axios from "axios";

type StkPushArgs = {
  amount: number;
  phone: string; // MUST be 2547XXXXXXXX (normalizePhone enforces this)
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string; // MUST be https:// and publicly reachable
};

type StkPushResp = {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
};

/** Prefer MPESA_BASE_URL if set; else use MPESA_ENV to choose sandbox/live */
export function mpesaBaseUrl(): string {
  const explicit = (process.env.MPESA_BASE_URL || "").trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const env = (process.env.MPESA_ENV || "sandbox").toLowerCase();
  if (env === "production" || env === "live") return "https://api.safaricom.co.ke";
  return "https://sandbox.safaricom.co.ke";
}

function nowTimestamp() {
  // YYYYMMDDHHMMSS
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

function base64(s: string) {
  return Buffer.from(s).toString("base64");
}

function redactPayload(p: any) {
  const copy = { ...p };
  if (copy.Password) copy.Password = "***";
  return copy;
}

/**
 * Normalize Kenya MSISDN:
 * - 07XXXXXXXX  -> 2547XXXXXXXX
 * - 7XXXXXXXX   -> 2547XXXXXXXX
 * - 2547XXXXXXXX (12 digits) kept
 */
export function normalizePhone(input: string): string {
  const raw = String(input || "").trim();
  const digits = raw.replace(/[^\d]/g, "");

  if (digits.startsWith("07") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 9) return "254" + digits;
  if (digits.startsWith("2547") && digits.length === 12) return digits;

  throw Object.assign(
    new Error("Invalid phone format. Use 07XXXXXXXX or 2547XXXXXXXX."),
    { status: 400 }
  );
}

/**
 * STK Push (M-Pesa Express)
 * - PAYBILL: TransactionType = CustomerPayBillOnline
 * - TILL:    TransactionType = CustomerBuyGoodsOnline :contentReference[oaicite:1]{index=1}
 */

export async function stkPush(args: StkPushArgs): Promise<StkPushResp> {
  console.log("[mpesa][stkpush] initiating", {
    baseUrl: mpesaBaseUrl(),
    amount: args.amount,    phone: args.phone,
    accountReference: args.accountReference,
    transactionDesc: args.transactionDesc,
  });

  const endpoint = `${mpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`;

  const shortcode = (process.env.MPESA_EXPRESS_SHORTCODE || process.env.MPESA_SHORTCODE || "").trim();
  const passkey = (process.env.MPESA_EXPRESS_PASSKEY || process.env.MPESA_PASSKEY || "").trim();

  // Default to TILL unless overridden
  const transactionType = (process.env.MPESA_TRANSACTION_TYPE || "CustomerBuyGoodsOnline").trim();

  if (!shortcode || !passkey) throw new Error("MPESA_SHORTCODE/MPESA_PASSKEY missing");
  if (!args.callbackUrl?.startsWith("https://")) {
    throw new Error("CallBackURL must be HTTPS and publicly reachable");
  }

  const phone = normalizePhone(args.phone);

  const amount = Math.round(Number(args.amount));
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid amount");

  const timestamp = nowTimestamp();
  const password = base64(`${shortcode}${passkey}${timestamp}`);

  // keep short to avoid field limits
  const accountRef = String(args.accountReference || "").slice(0, 12);
  const desc = String(args.transactionDesc || "").slice(0, 60);

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: transactionType,
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: args.callbackUrl,
    AccountReference: accountRef,
    TransactionDesc: desc,
  };

  const token = await getMpesaAccessToken();

  const resp = await axios.post(endpoint, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    timeout: 25_000,
    validateStatus: () => true,
  });

  const data = resp.data;

  if (resp.status < 200 || resp.status >= 300) {
    console.error("[mpesa][stkpush] HTTP error", {
      baseUrl: mpesaBaseUrl(),
      status: resp.status,
      response: data,
      request: redactPayload(payload),
    });

    const err = new Error(
      data?.errorMessage || data?.ResponseDescription || `STK Push failed (${resp.status})`
    );
    (err as any).httpStatus = resp.status;
    (err as any).mpesa = data;
    (err as any).request = redactPayload(payload);
    throw err;
  }

  console.log("[mpesa][stkpush] success", { 
    baseUrl: mpesaBaseUrl(),
    response: data,
    request: redactPayload(payload),
  });   

  return data as StkPushResp;
}

/* ---------------- OAuth token (cached) ---------------- */

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getMpesaAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 10_000) return cachedToken.token;

  const key = (process.env.MPESA_CONSUMER_KEY || "").trim();
  const secret = (process.env.MPESA_CONSUMER_SECRET || "").trim();
  if (!key || !secret) throw new Error("Missing MPESA_CONSUMER_KEY/MPESA_CONSUMER_SECRET");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const url = `${mpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`;

  const resp = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
    timeout: 20_000,
    validateStatus: () => true,
  });

  if (resp.status < 200 || resp.status >= 300) {
    console.error("[mpesa][token] HTTP error", {
      baseUrl: mpesaBaseUrl(),
      status: resp.status,
      data: resp.data,
    });
    throw new Error(resp.data?.errorMessage || `Token request failed (${resp.status})`);
  }

  const token = resp.data?.access_token as string | undefined;
  const expiresIn = Number(resp.data?.expires_in || 3599);

  if (!token) throw new Error("Token response missing access_token");

  // safe log: only prefix
  console.log("[mpesa][token] ok", {
    baseUrl: mpesaBaseUrl(),
    tokenPrefix: token.slice(0, 10),
    expiresIn,
  });

  cachedToken = { token, expiresAt: now + expiresIn * 1000 };
  return token;
}

