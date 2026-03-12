import { sendMail, type SmtpBlock } from "../utils/mailService.js";

const APP_NAME = process.env.APP_NAME || "Mombasa United FC";
const WEB_URL = (process.env.WEB_URL || "").replace(/\/+$/, "");
const API_PUBLIC_URL = (process.env.API_PUBLIC_URL || "").replace(/\/+$/, "");

const FROM_EMAIL = process.env.FROM_EMAIL || "no-reply@mombasaunited.com";
const FROM_NAME = process.env.FROM_NAME || APP_NAME;
const ENVELOPE_FROM = process.env.ENVELOPE_FROM || FROM_EMAIL;
const LOGO_URL = process.env.LOGO_URL || "";

const BRAND = {
  primary: "#0B5FFF",
  primaryHover: "#0947c4",
  background: "#f5f8ff",
  card: "#ffffff",
  text: "#0f172a",
  muted: "#64748b",
  border: "#d9e4ff",
  success: "#16a34a",
  warning: "#f59e0b",
  destructive: "#dc2626",
  accent: "#f4c542",
};

function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function defaultSmtp(): SmtpBlock {
  return {
    host: String(process.env.SMTP_HOST || ""),
    port: Number(process.env.SMTP_PORT || 587),
    username: String(process.env.SMTP_USER || ""),
    password: String(process.env.SMTP_PASS || ""),
    ssl: String(process.env.SMTP_SSL || "false") === "true",
    starttls:
      process.env.SMTP_STARTTLS != null
        ? String(process.env.SMTP_STARTTLS) === "true"
        : true,
    debug: String(process.env.SMTP_DEBUG || "false") === "true",
  };
}

function buildProfessionalShell(title: string, content: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<style>
  body { margin:0; padding:0; background:${BRAND.background}; }
  table { border-collapse:collapse; }
  img { border:0; display:block; }
  a { color:${BRAND.primary}; text-decoration:none; }
  a:hover { text-decoration:underline; }
  @media only screen and (max-width: 600px) {
    .email-container { width:100% !important; padding:16px !important; }
    .content-card { padding:24px 20px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table role="presentation" width="100%">
  <tr>
    <td align="center" style="padding:40px 20px;">
      <table role="presentation" class="email-container" width="600" style="max-width:600px;width:100%;">
        <tr>
          <td align="center" style="padding-bottom:24px;">
            ${
              LOGO_URL
                ? `<img src="${esc(LOGO_URL)}" alt="${esc(APP_NAME)}" height="56" style="height:56px;width:auto;" />`
                : `<div style="background:${BRAND.primary};border-radius:10px;padding:12px 18px;display:inline-block;">
                    <span style="font-size:20px;font-weight:800;color:#fff;">${esc(APP_NAME)}</span>
                  </div>`
            }
          </td>
        </tr>
        <tr>
          <td>
            <table role="presentation" class="content-card" width="100%"
              style="background:${BRAND.card};border-radius:14px;border:1px solid ${BRAND.border};box-shadow:0 4px 10px rgba(0,0,0,0.06);">
              <tr>
                <td style="padding:32px 40px;">
                  ${content}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 0;text-align:center;">
            <p style="margin:0 0 8px;font-size:12px;color:${BRAND.muted};">© ${new Date().getFullYear()} ${esc(
              APP_NAME
            )}. All rights reserved.</p>
            <p style="margin:0;font-size:12px;color:${BRAND.muted};">Automated message — do not reply.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function brandButton(href: string, label: string) {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
    <tr>
      <td style="border-radius:10px;background:${BRAND.primary};border:2px solid ${BRAND.primary};">
        <a href="${esc(href)}" target="_blank"
          style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">
          ${esc(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;" />`;
}

export async function sendAppEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  smtp?: SmtpBlock;
}) {
  const smtp = input.smtp ?? defaultSmtp();

  return sendMail(
    {
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      from: FROM_EMAIL,
      fromName: FROM_NAME,
      replyTo: input.replyTo,
      envelopeFrom: ENVELOPE_FROM,
      smtp,
    },
    { throwOnError: false }
  );
}

export function buildVerifyEmail(args: {
  name?: string | null;
  email: string;
  token: string;
}) {
  const verifyUrl = API_PUBLIC_URL
    ? `${API_PUBLIC_URL}/auth/verify-email?token=${encodeURIComponent(args.token)}`
    : WEB_URL
    ? `${WEB_URL}/auth/verify-email?token=${encodeURIComponent(args.token)}`
    : `verify-email?token=${encodeURIComponent(args.token)}`;

  const greeting = args.name || args.email.split("@")[0];

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND.text};">Verify your email</h1>
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND.muted};">One step to activate your Mombasa United account</p>
    <p style="margin:0 0 12px;font-size:15px;color:${BRAND.text};line-height:1.6;">Hi <strong>${esc(
      greeting
    )}</strong>,</p>
    <p style="margin:0;font-size:15px;color:${BRAND.text};line-height:1.6;">
      Please verify your email address to complete setup for <strong>${esc(APP_NAME)}</strong>.
    </p>
    ${brandButton(verifyUrl, "Verify Email")}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.5;">If the button doesn’t work, use this link:</p>
    <p style="margin:8px 0 0;font-size:12px;color:${BRAND.primary};word-break:break-all;">${esc(verifyUrl)}</p>
  `;

  return {
    subject: `Verify your email for ${APP_NAME}`,
    html: buildProfessionalShell("Verify Email", content),
    text: `Hi ${greeting},\n\nVerify your email here:\n${verifyUrl}`,
  };
}

export function buildPasswordResetEmail(args: {
  email: string;
  token: string;
  name?: string | null;
}) {
  const resetUrl = WEB_URL
    ? `${WEB_URL}/login?token=${encodeURIComponent(args.token)}`
    : `login?token=${encodeURIComponent(args.token)}`;

  const greeting = args.name || args.email.split("@")[0];

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:${BRAND.text};">Reset your password</h1>
    <p style="margin:0 0 20px;font-size:15px;color:${BRAND.muted};">We received a reset request</p>
    <p style="margin:0 0 12px;font-size:15px;color:${BRAND.text};line-height:1.6;">Hi <strong>${esc(
      greeting
    )}</strong>,</p>
    <p style="margin:0;font-size:15px;color:${BRAND.text};line-height:1.6;">
      Click below to set a new password for your <strong>${esc(APP_NAME)}</strong> account.
    </p>
    ${brandButton(resetUrl, "Reset Password")}
    ${divider()}
    <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.5;">If the button doesn’t work, use this link:</p>
    <p style="margin:8px 0 0;font-size:12px;color:${BRAND.primary};word-break:break-all;">${esc(resetUrl)}</p>
  `;

  return {
    subject: `Reset your ${APP_NAME} password`,
    html: buildProfessionalShell("Reset Password", content),
    text: `Hi ${greeting},\n\nReset your password here:\n${resetUrl}`,
  };
}