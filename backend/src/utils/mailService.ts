// backend/src/utils/mailService.ts
// strict relay client (smtp required per request) + Mombasa United Shop templates

const DEFAULT_TIMEOUT_MS = 50_000;
import { cfg } from "../config/env.js";
export const logger = {
  info: (...args: unknown[]) => console.info("[mail] [info]", ...args),
  warn: (...args: unknown[]) => console.warn("[mail] [warn]", ...args),
  error: (...args: unknown[]) => console.error("[mail] [error]", ...args),
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") console.debug("[mail] [debug]", ...args);
  },
};

const {
  RELAY_URL = "",
  RELAY_SECRET = "",
  APP_NAME = "Mombasa United FC",
  NODE_ENV = "development",
  SHOP_PUBLIC_URL = "https://mombasaunited.com",
  SHOP_EMAIL_FROM = "no-reply@mombasaunited.com",
  SHOP_EMAIL_FROM_NAME = "Mombasa United Shop",
  SHOP_EMAIL_REPLY_TO = "support@mombasaunited.com",
  SHOP_EMAIL_BCC = "", // optional: orders@... for internal copy
} = process.env;

if (!RELAY_URL) logger.warn("RELAY_URL not configured — mail relay unavailable.");
if (!RELAY_SECRET) logger.warn("RELAY_SECRET not configured — relay will reject requests.");

export type SmtpBlock = {
  host: string;
  port?: number;
  username: string;
  password: string;
  ssl?: boolean;
  starttls?: boolean;
  debug?: boolean;
};

export type SendMailParams = {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from: string; // REQUIRED
  fromName?: string;
  replyTo?: string;
  envelopeFrom?: string;
  smtp: SmtpBlock; // REQUIRED per call
};

export type SendMailOptions = {
  timeoutMs?: number;
  ensureSendPath?: boolean;
  throwOnError?: boolean;
};

export type RelayResult = {
  ok: boolean;
  envelope_from?: string;
  accepted_recipients?: string[];
  failed_recipients?: Record<string, [number, string]>;
  used?: { host: string; port: number; ssl: boolean; starttls: boolean };
  detail?: string;
};

export type SentInfo = {
  accepted: string[];
  rejected: string[];
  messageId?: string;
  response?: string;
  rawRelay?: RelayResult;
};

export async function sendMail(params: SendMailParams, opts: SendMailOptions = {}): Promise<SentInfo | undefined> {
  const { to, cc, bcc, subject, html, text, from, fromName, replyTo, envelopeFrom, smtp } = params;

  if (!RELAY_URL) throw new Error("RELAY_URL missing");
  if (!smtp?.host || !smtp?.username || !smtp?.password) throw new Error("smtp.host/username/password are required");
  if (!from || !subject || (!html && !text))
    throw new Error("sendMail requires 'from', 'subject', and one of 'html' or 'text'");

  const toList = Array.isArray(to) ? to : [to];
  if (!toList.length) throw new Error("'to' is required");

  const ccList = cc ? (Array.isArray(cc) ? cc : [cc]) : [];
  const bccList = bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [];

  const payload: Record<string, unknown> = {
    smtp: {
      host: smtp.host,
      port: smtp.port ?? 587,
      username: smtp.username,
      password: smtp.password,
      ssl: !!smtp.ssl,
      starttls: smtp.starttls ?? (smtp.port ? smtp.port === 587 : true),
      debug: !!smtp.debug && NODE_ENV !== "production",
    },
    to: toList,
    cc: ccList,
    bcc: bccList,
    subject,
    html,
    text,
    from_email: from,
    from_name: fromName,
    reply_to: replyTo,
    envelope_from: envelopeFrom,
  };

  const target = computeRelayTarget(RELAY_URL, opts.ensureSendPath ?? true);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const throwOnError = !!opts.throwOnError;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    logger.debug("Posting to mail relay", { relay: target, to: toList, smtpHost: smtp.host });

    const res = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-secret": RELAY_SECRET,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const rawText = await res.text().catch(() => "");
    let bodyJson: RelayResult | Record<string, any> = {};
    try {
      bodyJson = rawText ? JSON.parse(rawText) : {};
    } catch {
      /* ignore */
    }

    if (!res.ok) {
      const errMsg = `Relay responded ${res.status}: ${truncate(rawText, 400)}`;
      logger.error("Mail relay error:", errMsg);
      if (throwOnError) throw new Error(errMsg);
      return undefined;
    }

    const relay = bodyJson as RelayResult;
    const accepted = Array.isArray(relay.accepted_recipients) ? relay.accepted_recipients : toList;
    const rejected = relay.failed_recipients ? Object.keys(relay.failed_recipients) : [];

    const info: SentInfo = {
      accepted,
      rejected,
      messageId: `relay-${Date.now()}`,
      response: `Relay ${res.status}`,
      rawRelay: relay,
    };

    logger.info("Email queued via relay", {
      to: toList,
      accepted: info.accepted,
      rejected: info.rejected,
      envelope_from: relay.envelope_from,
    });

    return info;
  } catch (err: any) {
    logger.error("Failed sending via mail relay:", err?.message ?? err);
    if (throwOnError) throw err;
    return undefined;
  }
}

/* ---------------- Mombasa United Email Templates ---------------- */

export function buildEmailShell(title: string, content: string): string {
  // Brand colors (from your site shell)
  const primary = "#1a56db"; // Royal Blue
  const gold = "#d4a017";
  const navy = "#f5f7fa";
  const muted = "#64748b";
  const bg = "#f8fafc";
  const card = "#ffffff";  
  const border = "#e2e8f0";

  // Use a shop logo/image that exists on your domain
  const logoUrl = `${SHOP_PUBLIC_URL.replace(/\/$/, "")}/club-media/logos/club.svg`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background-color:${bg}; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${bg};">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background-color:${card}; border-radius:12px; border:1px solid ${border}; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${primary} 0%, ${navy} 100%); padding:28px 32px; text-align:center;">
              <div style="color:white; font-weight:800; letter-spacing:.12em; font-size:12px;">OFFICIAL SHOP</div>
              <div style="height:10px;"></div>
              <img src="${logoUrl}" alt="${escapeHtml(APP_NAME)}" width="160" style="display:block; margin:0 auto; border-radius:10px; border:2px solid rgba(255,255,255,.12);" />
              <div style="height:12px;"></div>
              <div style="color:rgba(255,255,255,.85); font-size:13px;">${escapeHtml(APP_NAME)}</div>
              <div style="margin-top:8px; color:${gold}; font-weight:800; font-size:12px; letter-spacing:.08em;">PAYMENT CONFIRMATION</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding:22px 28px 14px; border-bottom:1px solid ${border};">
              <h1 style="margin:0; font-size:20px; font-weight:800; color:${navy}; line-height:1.3;">
                ${escapeHtml(title)}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:22px 28px 28px; color:${navy}; font-size:15px; line-height:1.7;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${bg}; padding:18px 28px; border-top:1px solid ${border}; text-align:center;">
              <p style="margin:0; font-size:12px; color:${muted};">
                © ${new Date().getFullYear()} ${escapeHtml(APP_NAME)} • Official Shop
              </p>
              <p style="margin:8px 0 0; font-size:12px; color:${muted};">
                Need help? Reply to this email or contact support.
              </p>
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
          <tr>
            <td style="padding:18px 28px; text-align:center;">
              <p style="margin:0; font-size:11px; color:${muted};">
                This is an automated email. If you didn’t place this order, please ignore it.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailButton(text: string, url: string): string {
  const primary = "#1a56db";
  const navy = "#0a1628";
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0;">
    <tr>
      <td style="background:linear-gradient(135deg, ${primary} 0%, ${navy} 100%); border-radius:10px;">
        <a href="${escapeHtml(url)}" target="_blank" style="display:inline-block; padding:14px 26px; color:#ffffff; text-decoration:none; font-weight:800; font-size:14px; letter-spacing:.06em;">
          ${escapeHtml(text)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function emailInfoBox(content: string): string {
  const primary = "#1a56db";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:14px 0;">
    <tr>
      <td style="background-color:#eff6ff; border-left:4px solid ${primary}; padding:14px 16px; border-radius:0 10px 10px 0;">
        <div style="margin:0; font-size:14px; color:#0a1628; line-height:1.6;">
          ${content}
        </div>
      </td>
    </tr>
  </table>`;
}

/** Build paid receipt email HTML (uses Order + metadata JSON you stored) */
export function buildShopPaidReceiptEmail(args: {
  orderId: string;
  currency: string;
  total: number;
  items: Array<{ title: string; qty: number; lineTotal: number; group?: string | null; size?: string | null }>;
  meta: any; // customer/billing/delivery/mpesa
}): { subject: string; html: string } {
  const { orderId, currency, total, items, meta } = args;

  const shortId = orderId.slice(-6).toUpperCase();
  const customerName = meta?.customer?.fullName || "Customer";
  const customerEmail = meta?.customer?.email || "";

  const mpesa = meta?.mpesa || {};
  const receipt = mpesa?.receipt ? `<b>M-Pesa Receipt:</b> ${escapeHtml(mpesa.receipt)}<br/>` : "";
  const paidPhone = mpesa?.phone ? `<b>Paid From:</b> ${escapeHtml(String(mpesa.phone))}<br/>` : "";

  const itemsRows = items
    .map((it) => {
      const g = it.group ? ` ${escapeHtml(it.group)}` : "";
      const s = it.size ? ` · Size ${escapeHtml(it.size)}` : "";
      return `<tr>
        <td style="padding:10px 0; border-bottom:1px solid #e2e8f0;">
          <div style="font-weight:800;">${escapeHtml(it.title)}</div>
          <div style="color:#64748b; font-size:12px;">${g}${s}</div>
        </td>
        <td style="padding:10px 0; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:800;">${it.qty}</td>
        <td style="padding:10px 0; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:800;">${it.lineTotal} ${escapeHtml(currency)}</td>
      </tr>`;
    })
    .join("");

  const billing = meta?.billingAddress || {};
  const delivery = meta?.delivery || {};

  const content = `
    <p>Hi <b>${escapeHtml(customerName)}</b>,</p>
    ${emailInfoBox(`Your payment has been received successfully. Order <b>#${escapeHtml(shortId)}</b> is now confirmed.`)}

    <p style="margin:0 0 10px;"><b>Order ID:</b> ${escapeHtml(orderId)}</p>
    <p style="margin:0 0 10px;"><b>Total:</b> ${total} ${escapeHtml(currency)}</p>
    <p style="margin:0 0 14px;">
      ${receipt}${paidPhone}
      <b>Email:</b> ${escapeHtml(customerEmail)}
    </p>

    <h3 style="margin:18px 0 8px; font-size:14px; letter-spacing:.08em; text-transform:uppercase;">Items</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <thead>
        <tr>
          <th align="left" style="padding:8px 0; color:#64748b; font-size:12px; letter-spacing:.08em; text-transform:uppercase;">Product</th>
          <th align="center" style="padding:8px 0; color:#64748b; font-size:12px; letter-spacing:.08em; text-transform:uppercase;">Qty</th>
          <th align="right" style="padding:8px 0; color:#64748b; font-size:12px; letter-spacing:.08em; text-transform:uppercase;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <h3 style="margin:18px 0 8px; font-size:14px; letter-spacing:.08em; text-transform:uppercase;">Billing Address</h3>
    <div style="color:#0a1628;">
      ${escapeHtml(billing.line1 || "")}<br/>
      ${billing.line2 ? `${escapeHtml(billing.line2)}<br/>` : ""}
      ${escapeHtml(billing.city || "")}
    </div>

    <h3 style="margin:18px 0 8px; font-size:14px; letter-spacing:.08em; text-transform:uppercase;">Delivery</h3>
    <div><b>Location:</b> ${escapeHtml(delivery.location || "")}</div>
    ${delivery.notes ? `<div style="margin-top:6px;"><b>Notes:</b> ${escapeHtml(delivery.notes)}</div>` : ""}

    ${emailButton("Visit Store", `${SHOP_PUBLIC_URL.replace(/\/$/, "")}/shop`)}
  `;

  return {
    subject: `Mombasa United Shop — Payment Received (Order #${shortId})`,
    html: buildEmailShell("Payment received ✓", content),
  };
}

/* ---------- helpers ---------- */
function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(s: string, n: number): string {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n) + "…";
}

function computeRelayTarget(base: string, ensureSendPath: boolean): string {
  try {
    const u = new URL(base);
    if (ensureSendPath && (u.pathname === "/" || u.pathname === "")) u.pathname = "/send";
    return u.toString();
  } catch {
    return base;
  }
}

// Convenience defaults for this app (so you don’t repeat these everywhere)
export function getShopMailDefaults() {
  return {
    from: SHOP_EMAIL_FROM,
    fromName: SHOP_EMAIL_FROM_NAME,
    replyTo: SHOP_EMAIL_REPLY_TO,
    bcc: SHOP_EMAIL_BCC ? [SHOP_EMAIL_BCC] : [],
  };
}

export function getSmtpFromenv(): SmtpBlock {
  return {
    host: String(cfg.SMTP_HOST || process.env.SMTP_HOST || ""),
    port: Number(cfg.SMTP_PORT || process.env.SMTP_PORT || 587),
    username: String(cfg.SMTP_USER || process.env.SMTP_USER || ""),
    password: String(cfg.SMTP_PASS || process.env.SMTP_PASS || ""),
    ssl: !!(cfg.SMTP_SSL || process.env.SMTP_SSL === "true"),
    starttls: cfg.SMTP_STARTTLS ?? (process.env.SMTP_STARTTLS === "true"),
  };
}
