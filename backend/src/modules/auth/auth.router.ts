import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { signToken } from "../../lib/auth.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw Object.assign(new Error("Email already in use"), { status: 409 });

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: { email: body.email, passwordHash, name: body.name },
      select: { id: true, email: true, name: true, role: true, membership: true, membershipUntil: true },
    });

    const token = signToken({ sub: user.id, role: user.role });
    res.json({ token, user });
  } catch (e) {
    next(e);
  }
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw Object.assign(new Error("Invalid credentials"), { status: 401 });

    const token = signToken({ sub: user.id, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        membership: user.membership,
        membershipUntil: user.membershipUntil,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true, membership: true, membershipUntil: true },
    });
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
