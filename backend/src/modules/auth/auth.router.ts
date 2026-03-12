import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { signToken } from "../../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  issueVerifyEmail,
  resendVerifyEmail,
  requestPasswordReset,
  confirmPasswordReset,
  verifyEmail,
} from "../../lib/auth.service.js";

export const authRouter = Router();

const REQUIRE_EMAIL_VERIFY =
  String(process.env.AUTH_REQUIRE_EMAIL_VERIFY || "false").toLowerCase() === "true";

const WEB_URL = String(process.env.WEB_URL || "").replace(/\/+$/, "");

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function wantsJson(req: any) {
  const accept = String(req.headers?.accept || "");
  return accept.includes("application/json") || req.xhr;
}

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  membership: true,
  membershipUntil: true,
  membershipTier: true,
  memberNumber: true,
  memberSince: true,
  emailVerifiedAt: true,
} as const;

function serializeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    membership: user.membership,
    membershipUntil: user.membershipUntil,
    membershipTier: user.membershipTier,
    memberNumber: user.memberNumber,
    memberSince: user.memberSince,
    emailVerifiedAt: user.emailVerifiedAt ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* Schemas                                                                    */
/* -------------------------------------------------------------------------- */

const RegisterSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
  name: z.string().trim().min(2).optional(),
});

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const ForgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const ResetPasswordSchema = z
  .object({
    token: z.string().trim().min(10),
    password: z.string().min(8).optional(),
    newPassword: z.string().min(8).optional(),
  })
  .refine((data) => !!(data.password || data.newPassword), {
    message: "Password is required",
    path: ["password"],
  });

const ResendVerifySchema = z.object({
  email: z.string().trim().email(),
});

/* -------------------------------------------------------------------------- */
/* Existing routes, upgraded cleanly                                          */
/* -------------------------------------------------------------------------- */

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const email = normalizeEmail(body.email);
    const name = body.name?.trim() || email.split("@")[0];

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: "FAN",
      },
      select: publicUserSelect,
    });

    let verificationQueued = false;
    try {
      await issueVerifyEmail(user.id);
      verificationQueued = true;
    } catch (e: any) {
      console.warn("[auth/register] issueVerifyEmail failed:", e?.message || e);
    }

    const token = signToken({ sub: user.id, role: user.role });

    return res.status(201).json({
      token,
      user: serializeUser(user),
      verification: {
        required: REQUIRE_EMAIL_VERIFY,
        emailQueued: verificationQueued,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    const email = normalizeEmail(body.email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        ...publicUserSelect,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (REQUIRE_EMAIL_VERIFY && !user.emailVerifiedAt) {
      await resendVerifyEmail(user.email).catch(() => {});
      return res.status(403).json({
        message: "Email not verified. A fresh verification link has been sent.",
      });
    }

    const token = signToken({ sub: user.id, role: user.role });

    return res.json({
      token,
      user: serializeUser(user),
    });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: publicUserSelect,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: serializeUser(user) });
  } catch (e) {
    next(e);
  }
});

/* -------------------------------------------------------------------------- */
/* New routes                                                                  */
/* -------------------------------------------------------------------------- */

authRouter.post("/forgot-password", async (req, res, next) => {
  try {
    const body = ForgotPasswordSchema.parse(req.body);
    await requestPasswordReset(normalizeEmail(body.email));

    return res.json({
      message: "If the email exists, a reset link was sent.",
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/reset-password", async (req, res, next) => {
  try {
    const body = ResetPasswordSchema.parse(req.body);
    const newPassword = body.newPassword || body.password!;

    await confirmPasswordReset(body.token, newPassword);

    return res.json({
      message: "Password reset successful",
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post("/resend-verify-email", async (req, res, next) => {
  try {
    const body = ResendVerifySchema.parse(req.body);
    await resendVerifyEmail(normalizeEmail(body.email));

    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/verify-email", async (req, res) => {
  const token = String(req.query.token || "").trim();

  if (!token) {
    if (!wantsJson(req) && WEB_URL) {
      return res.redirect(`${WEB_URL}/login?verified=0&reason=missing-token`);
    }
    return res.status(400).json({ message: "token is required" });
  }

  try {
    await verifyEmail(token);

    if (!wantsJson(req) && WEB_URL) {
      return res.redirect(`${WEB_URL}/login?verified=1`);
    }

    return res.json({
      ok: true,
      message: "Email verified successfully",
    });
  } catch (e: any) {
    if (!wantsJson(req) && WEB_URL) {
      return res.redirect(`${WEB_URL}/login?verified=0&reason=invalid-or-expired`);
    }

    return res.status(400).json({
      message: e?.message || "Invalid or expired token",
    });
  }
});