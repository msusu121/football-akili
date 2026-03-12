import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma.js";
import {
  sendAppEmail,
  buildVerifyEmail,
  buildPasswordResetEmail,
} from "./mail.service.js";

const VERIFY_TOKEN_TTL_MIN = Number(process.env.VERIFY_TOKEN_TTL_MIN || 60);
const RESET_TOKEN_TTL_MIN = Number(process.env.RESET_TOKEN_TTL_MIN || 60);

function futureDateFromMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60_000);
}

export async function issueVerifyEmail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) return;
  if (user.emailVerifiedAt) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = futureDateFromMinutes(VERIFY_TOKEN_TTL_MIN);

  await prisma.$transaction([
    prisma.emailVerifyToken.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    }),
    prisma.emailVerifyToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    }),
  ]);

  const built = buildVerifyEmail({
    name: user.name,
    email: user.email,
    token,
  });

  await sendAppEmail({
    to: user.email,
    subject: built.subject,
    html: built.html,
    text: built.text,
  });
}

export async function verifyEmail(token: string) {
  const cleanToken = String(token || "").trim();
  if (!cleanToken) throw new Error("Invalid or expired token");

  const rec = await prisma.emailVerifyToken.findUnique({
    where: { token: cleanToken },
  });

  if (!rec || rec.used || rec.expiresAt < new Date()) {
    throw new Error("Invalid or expired token");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: rec.userId },
      data: {
        emailVerifiedAt: new Date(),
      },
    }),
    prisma.emailVerifyToken.updateMany({
      where: {
        userId: rec.userId,
        used: false,
      },
      data: {
        used: true,
      },
    }),
  ]);

  return true;
}

export async function resendVerifyEmail(email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("email is required");

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      emailVerifiedAt: true,
    },
  });

  if (!user) return;
  if (user.emailVerifiedAt) return;

  await issueVerifyEmail(user.id);
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) throw new Error("email is required");

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  // do not leak existence
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = futureDateFromMinutes(RESET_TOKEN_TTL_MIN);

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        used: false,
      },
      data: {
        used: true,
      },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    }),
  ]);

  const built = buildPasswordResetEmail({
    email: user.email,
    name: user.name,
    token,
  });

  await sendAppEmail({
    to: user.email,
    subject: built.subject,
    html: built.html,
    text: built.text,
  });
}

export async function confirmPasswordReset(token: string, newPassword: string) {
  const cleanToken = String(token || "").trim();
  const cleanPassword = String(newPassword || "");

  if (!cleanToken) throw new Error("Invalid or expired token");
  if (cleanPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const rec = await prisma.passwordResetToken.findUnique({
    where: { token: cleanToken },
  });

  if (!rec || rec.used || rec.expiresAt < new Date()) {
    throw new Error("Invalid or expired token");
  }

  const passwordHash = await bcrypt.hash(cleanPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: rec.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.updateMany({
      where: {
        userId: rec.userId,
        used: false,
      },
      data: {
        used: true,
      },
    }),
  ]);

  return true;
}