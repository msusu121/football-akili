import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const membershipRouter = Router();

const TierSchema = z.enum(["SILVER", "GOLD", "PLATINUM", "DIAMOND"]);

const RegisterSchema = z.object({
  tier: TierSchema,
  fullName: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  city: z.string().optional().nullable(),
  jerseySize: z.string().optional().nullable(),
  nextOfKin: z.string().optional().nullable(),
});

const ConfirmSchema = z.object({
  transactionId: z.string().min(1),
});

const RedeemSchema = z.object({
  rewardId: z.string().min(1),
});

function parseBenefits(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeMemberNumber() {
  const year = new Date().getFullYear();
  return `MU-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function makeQrToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function pointsForTier(tier: "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND") {
  return {
    SILVER: 250,
    GOLD: 600,
    PLATINUM: 1400,
    DIAMOND: 3000,
  }[tier];
}

async function ensureWallet(tx: any, userId: string) {
  return tx.loyaltyWallet.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

async function addPoints(
  tx: any,
  args: {
    userId: string;
    points: number;
    type:
      | "MEMBERSHIP_SIGNUP"
      | "MERCH_PURCHASE"
      | "MATCH_CHECKIN"
      | "EVENT_ATTENDANCE"
      | "REFERRAL_BONUS"
      | "REDEMPTION"
      | "MANUAL_ADJUSTMENT";
    description?: string;
    referenceType?: string;
    referenceId?: string;
  }
) {
  await ensureWallet(tx, args.userId);

  await tx.loyaltyEntry.create({
    data: {
      userId: args.userId,
      type: args.type,
      points: args.points,
      description: args.description || null,
      referenceType: args.referenceType || null,
      referenceId: args.referenceId || null,
    },
  });

  const walletData: any = {
    balancePoints: { increment: args.points },
  };

  if (args.points > 0) {
    walletData.lifetimeEarned = { increment: args.points };
  }

  if (args.points < 0) {
    walletData.lifetimeRedeemed = { increment: Math.abs(args.points) };
  }

  await tx.loyaltyWallet.update({
    where: { userId: args.userId },
    data: walletData,
  });
}

async function activateMembership(
  tx: any,
  args: {
    userId: string;
    tier: "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
    phone: string;
    fullName: string;
    email: string;
    city?: string | null;
    jerseySize?: string | null;
    nextOfKin?: string | null;
    orderId?: string | null;
    transactionId?: string | null;
  }
) {
  const plan = await tx.membershipPlan.findUnique({
    where: { tier: args.tier },
  });

  if (!plan) {
    throw Object.assign(new Error("Membership plan not found"), { status: 404 });
  }

  const existingUser = await tx.user.findUnique({
    where: { id: args.userId },
  });

  if (!existingUser) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  const now = new Date();
  const until = new Date(now.getTime() + (plan.durationDays || 365) * 24 * 60 * 60 * 1000);
  const memberNumber = existingUser.memberNumber || makeMemberNumber();

  await tx.user.update({
    where: { id: args.userId },
    data: {
      name: args.fullName,
      email: args.email,
      membership: "ACTIVE",
      membershipTier: args.tier,
      memberNumber,
      memberSince: now,
      membershipUntil: until,
    },
  });

  await tx.membershipProfile.upsert({
    where: { userId: args.userId },
    update: {
      phone: args.phone,
      city: args.city || null,
      jerseySize: args.jerseySize || null,
      nextOfKin: args.nextOfKin || null,
    },
    create: {
      userId: args.userId,
      phone: args.phone,
      city: args.city || null,
      jerseySize: args.jerseySize || null,
      nextOfKin: args.nextOfKin || null,
      qrToken: makeQrToken(),
    },
  });

  await addPoints(tx, {
    userId: args.userId,
    points: pointsForTier(args.tier),
    type: "MEMBERSHIP_SIGNUP",
    description: `${args.tier} membership activated`,
    referenceType: "MEMBERSHIP",
    referenceId: args.orderId || args.transactionId || undefined,
  });

  return {
    tier: args.tier,
    memberNumber,
    validUntil: until,
  };
}

membershipRouter.get("/plans", async (_req, res, next) => {
  try {
    const items = await prisma.membershipPlan.findMany({
      where: {
        isActive: true,
        tier: { in: ["SILVER", "GOLD", "PLATINUM", "DIAMOND"] },
      },
      orderBy: [{ sort: "asc" }, { price: "asc" }],
    });

    res.json({
      items: items.map((p) => ({
        ...p,
        benefits: parseBenefits(p.benefits),
      })),
    });
  } catch (e) {
    next(e);
  }
});

membershipRouter.post("/register", requireAuth, async (req, res, next) => {
  try {
    const body = RegisterSchema.parse(req.body);
    const userId = (req as any).user.id as string;

    const plan = await prisma.membershipPlan.findUnique({
      where: { tier: body.tier },
    });

    if (!plan || !plan.isActive) {
      throw Object.assign(new Error("Membership plan not available"), { status: 404 });
    }

    if (plan.price <= 0) {
      const result = await prisma.$transaction(async (tx) =>
        activateMembership(tx, {
          userId,
          tier: body.tier,
          phone: body.phone,
          fullName: body.fullName,
          email: body.email,
          city: body.city,
          jerseySize: body.jerseySize,
          nextOfKin: body.nextOfKin,
        })
      );

      return res.json({
        status: "ACTIVATED",
        tier: result.tier,
        memberNumber: result.memberNumber,
        validUntil: result.validUntil,
        message: "Membership activated successfully",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          name: body.fullName,
          email: body.email,
          membership: "PENDING",
          membershipTier: body.tier,
        },
      });

      await tx.membershipProfile.upsert({
        where: { userId },
        update: {
          phone: body.phone,
          city: body.city || null,
          jerseySize: body.jerseySize || null,
          nextOfKin: body.nextOfKin || null,
        },
        create: {
          userId,
          phone: body.phone,
          city: body.city || null,
          jerseySize: body.jerseySize || null,
          nextOfKin: body.nextOfKin || null,
          qrToken: makeQrToken(),
        },
      });

      const order = await tx.order.create({
        data: {
          userId,
          type: "MEMBERSHIP",
          status: "PENDING",
          currency: plan.currency,
          total: plan.price,
          metadata: JSON.stringify({
            tier: body.tier,
            fullName: body.fullName,
            phone: body.phone,
            email: body.email,
            city: body.city || null,
            jerseySize: body.jerseySize || null,
            nextOfKin: body.nextOfKin || null,
          }),
        },
      });

      const transaction = await tx.paymentTransaction.create({
        data: {
          provider: "MPESA",
          reference: `MEM-${Date.now()}`,
          amount: plan.price,
          currency: plan.currency,
          status: "PENDING",
          orderId: order.id,
          userId,
        },
      });

      return { order, transaction };
    });

    res.json({
      status: "PENDING_PAYMENT",
      tier: body.tier,
      orderId: result.order.id,
      transactionId: result.transaction.id,
      amount: result.transaction.amount,
      currency: result.transaction.currency,
      message: "Payment initiated. Confirm when payment succeeds.",
    });
  } catch (e) {
    next(e);
  }
});

membershipRouter.post("/confirm", requireAuth, async (req, res, next) => {
  try {
    const body = ConfirmSchema.parse(req.body);
    const userId = (req as any).user.id as string;

    const txRow = await prisma.paymentTransaction.findUnique({
      where: { id: body.transactionId },
    });

    if (!txRow || txRow.userId !== userId) {
      throw Object.assign(new Error("Transaction not found"), { status: 404 });
    }

    if (txRow.status === "SUCCESS") {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      return res.json({
        status: "ACTIVATED",
        tier: user?.membershipTier,
        memberNumber: user?.memberNumber,
        message: "Membership already active",
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: txRow.orderId || "" },
    });

    if (!order) {
      throw Object.assign(new Error("Membership order not found"), { status: 404 });
    }

    const metadata = order.metadata ? JSON.parse(order.metadata) : {};
    const tier = TierSchema.parse(metadata.tier);

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser?.email && !metadata.email) {
      throw Object.assign(new Error("User email missing"), { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: txRow.id },
        data: { status: "SUCCESS" },
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAID" },
      });

      return activateMembership(tx, {
        userId,
        tier,
        phone: metadata.phone,
        fullName: metadata.fullName,
        email: metadata.email || currentUser!.email,
        city: metadata.city,
        jerseySize: metadata.jerseySize,
        nextOfKin: metadata.nextOfKin,
        orderId: order.id,
        transactionId: txRow.id,
      });
    });

    res.json({
      status: "ACTIVATED",
      tier: result.tier,
      memberNumber: result.memberNumber,
      validUntil: result.validUntil,
      message: "Membership activated after payment confirmation",
    });
  } catch (e) {
    next(e);
  }
});

membershipRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        loyaltyWallet: true,
        loyaltyEntries: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) throw Object.assign(new Error("User not found"), { status: 404 });

    const rewards = await prisma.loyaltyReward.findMany({
      where: { isActive: true },
      orderBy: [{ sort: "asc" }, { pointsCost: "asc" }],
    });

    res.json({
      member: {
        id: user.id,
        name: user.name,
        email: user.email,
        membership: user.membership,
        membershipTier: user.membershipTier,
        memberNumber: user.memberNumber,
        memberSince: user.memberSince,
        membershipUntil: user.membershipUntil,
        profile: user.profile,
        wallet: user.loyaltyWallet,
        entries: user.loyaltyEntries,
        rewards,
      },
    });
  } catch (e) {
    next(e);
  }
});

membershipRouter.post("/redeem", requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user.id as string;
    const body = RedeemSchema.parse(req.body);

    const reward = await prisma.loyaltyReward.findUnique({
      where: { id: body.rewardId },
    });

    if (!reward || !reward.isActive) {
      throw Object.assign(new Error("Reward not found"), { status: 404 });
    }

    const wallet = await prisma.loyaltyWallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balancePoints < reward.pointsCost) {
      throw Object.assign(new Error("Insufficient points"), { status: 400 });
    }

    const redemption = await prisma.$transaction(async (tx) => {
      const row = await tx.rewardRedemption.create({
        data: {
          userId,
          rewardId: reward.id,
          pointsCost: reward.pointsCost,
          status: "APPROVED",
        },
      });

      await addPoints(tx, {
        userId,
        points: -reward.pointsCost,
        type: "REDEMPTION",
        description: `Redeemed reward: ${reward.title}`,
        referenceType: "REWARD",
        referenceId: reward.id,
      });

      return row;
    });

    res.json({
      ok: true,
      redemption,
      message: "Reward redeemed successfully",
    });
  } catch (e) {
    next(e);
  }
});