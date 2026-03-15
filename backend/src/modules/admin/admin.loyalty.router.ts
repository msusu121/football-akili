import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const adminLoyaltyRouter = Router();

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"]);

function requireAdmin(req: any, res: any, next: any) {
  const role = req.user?.role;
  if (!role || !ADMIN_ROLES.has(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

adminLoyaltyRouter.use(requireAuth);
adminLoyaltyRouter.use(requireAdmin);

const MembershipStatusSchema = z.enum(["NONE", "PENDING", "ACTIVE", "EXPIRED"]);
const MembershipTierSchema = z.enum([
  "BASIC",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "DIAMOND",
]);
const PaidMembershipTierSchema = z.enum(["SILVER", "GOLD", "PLATINUM", "DIAMOND"]);

const RewardSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  pointsCost: z.number().int().min(1),
  sort: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const UpdateMemberSchema = z.object({
  name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  membership: MembershipStatusSchema,
  membershipTier: MembershipTierSchema,
  memberNumber: z.string().optional().nullable(),
  memberSince: z.string().optional().nullable(),
  membershipUntil: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  jerseySize: z.string().optional().nullable(),
  nextOfKin: z.string().optional().nullable(),
});

const AdjustPointsSchema = z.object({
  points: z.number().int().refine((v) => v !== 0, "Points must not be zero"),
  description: z.string().optional().nullable(),
});

function safeJson(raw?: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function parseDateOrNull(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function makeMemberNumber() {
  const year = new Date().getFullYear();
  return `MU-${year}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

function makeQrToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function pointsForTier(tier: z.infer<typeof PaidMembershipTierSchema>) {
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

async function activateMembershipOrderByAdmin(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order || order.type !== "MEMBERSHIP" || !order.userId) return;

  const meta = safeJson(order.metadata) || {};
  const tier = PaidMembershipTierSchema.parse(meta.tier);

  const fullName = String(meta.fullName || "");
  const email = String(meta.email || "");
  const phone = String(meta.phone || "");
  const city = meta.city ? String(meta.city) : null;
  const jerseySize = meta.jerseySize ? String(meta.jerseySize) : null;
  const nextOfKin = meta.nextOfKin ? String(meta.nextOfKin) : null;

  const plan = await prisma.membershipPlan.findUnique({
    where: { tier },
  });

  if (!plan) {
    throw Object.assign(new Error("Membership plan not found"), { status: 404 });
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: order.userId },
  });

  if (!existingUser) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  const now = new Date();
  const start =
    existingUser.membershipUntil && existingUser.membershipUntil > now
      ? existingUser.membershipUntil
      : now;

  const until = new Date(start.getTime() + (plan.durationDays || 365) * 24 * 60 * 60 * 1000);
  const memberNumber = existingUser.memberNumber || makeMemberNumber();

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: order.userId! },
      data: {
        name: fullName || existingUser.name || "",
        email: email || existingUser.email,
        membership: "ACTIVE",
        membershipTier: tier,
        memberNumber,
        memberSince: existingUser.memberSince || now,
        membershipUntil: until,
      },
    });

    await tx.membershipProfile.upsert({
      where: { userId: order.userId! },
      update: {
        phone,
        city,
        jerseySize,
        nextOfKin,
      },
      create: {
        userId: order.userId!,
        phone,
        city,
        jerseySize,
        nextOfKin,
        qrToken: makeQrToken(),
      },
    });

    const alreadyAwarded = await tx.loyaltyEntry.findFirst({
      where: {
        userId: order.userId!,
        type: "MEMBERSHIP_SIGNUP",
        referenceType: "ORDER",
        referenceId: order.id,
      },
    });

    if (!alreadyAwarded) {
      await addPoints(tx, {
        userId: order.userId!,
        points: pointsForTier(tier),
        type: "MEMBERSHIP_SIGNUP",
        description: `${tier} membership activated`,
        referenceType: "ORDER",
        referenceId: order.id,
      });
    }
  });
}

adminLoyaltyRouter.get("/", async (_req, res, next) => {
  try {
    const [members, rewards, plans, membershipOrders] = await Promise.all([
      prisma.user.findMany({
        where: {
          OR: [
            { membership: { not: "NONE" } },
            { memberNumber: { not: null } },
            { membershipTier: { in: ["SILVER", "GOLD", "PLATINUM", "DIAMOND"] } },
          ],
        },
        include: {
          profile: true,
          loyaltyWallet: true,
          loyaltyEntries: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
        orderBy: { createdAt: "desc" },
        take: 300,
      }),
      prisma.loyaltyReward.findMany({
        orderBy: [{ sort: "asc" }, { pointsCost: "asc" }],
      }),
      prisma.membershipPlan.findMany({
        where: { tier: { in: ["SILVER", "GOLD", "PLATINUM", "DIAMOND"] } },
        orderBy: [{ sort: "asc" }, { price: "asc" }],
      }),
      prisma.order.findMany({
        where: { type: "MEMBERSHIP" },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 150,
      }),
    ]);

    const orderIds = membershipOrders.map((o) => o.id);
    const txs = orderIds.length
      ? await prisma.paymentTransaction.findMany({
          where: { orderId: { in: orderIds } },
          orderBy: { createdAt: "desc" },
        })
      : [];

    const txMap = new Map<string, any[]>();
    for (const tx of txs) {
      const key = tx.orderId || "";
      if (!txMap.has(key)) txMap.set(key, []);
      txMap.get(key)!.push(tx);
    }

    const membershipPayments = membershipOrders.map((order) => {
      const tx = (txMap.get(order.id) || [])[0] || null;
      const meta = safeJson(order.metadata) || {};
      const mpesa = meta.mpesa || {};

      return {
        orderId: order.id,
        orderStatus: order.status,
        orderTotal: order.total,
        currency: order.currency,
        orderCreatedAt: order.createdAt,

        transactionId: tx?.id || null,
        reference: tx?.reference || null,
        provider: tx?.provider || null,
        transactionStatus: tx?.status || null,
        transactionCreatedAt: tx?.createdAt || null,
        amount: tx?.amount ?? order.total,

        member: order.user
          ? {
              id: order.user.id,
              name: order.user.name,
              email: order.user.email,
              membership: order.user.membership,
              membershipTier: order.user.membershipTier,
              memberNumber: order.user.memberNumber,
              membershipUntil: order.user.membershipUntil,
              phone: order.user.profile?.phone || meta.phone || null,
            }
          : null,

        checkoutRequestId: mpesa.checkoutRequestId || tx?.reference || null,
        mpesaReceipt: mpesa.receipt || null,
        paidPhone: mpesa.phone || meta.phone || null,
        requestedTier: meta.tier || null,
      };
    });

    res.json({
      counts: {
        members: members.length,
        activeMembers: members.filter((m) => m.membership === "ACTIVE").length,
        rewards: rewards.length,
        pendingMembershipPayments: membershipPayments.filter(
          (p) => p.transactionStatus === "PENDING" || p.orderStatus === "PENDING"
        ).length,
      },
      members,
      rewards,
      plans,
      membershipPayments,
    });
  } catch (e) {
    next(e);
  }
});

adminLoyaltyRouter.put("/members/:id", async (req, res, next) => {
  try {
    const body = UpdateMemberSchema.parse(req.body);
    const userId = req.params.id;

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!existing) {
      throw Object.assign(new Error("Member not found"), { status: 404 });
    }

    const nextMemberNumber =
      body.membership === "ACTIVE"
        ? body.memberNumber || existing.memberNumber || makeMemberNumber()
        : body.memberNumber ?? existing.memberNumber ?? null;

    await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name ?? existing.name,
        email: body.email ?? existing.email,
        membership: body.membership,
        membershipTier: body.membershipTier,
        memberNumber: nextMemberNumber,
        memberSince:
          body.memberSince !== undefined
            ? parseDateOrNull(body.memberSince)
            : existing.memberSince,
        membershipUntil:
          body.membershipUntil !== undefined
            ? parseDateOrNull(body.membershipUntil)
            : existing.membershipUntil,
      },
    });

    await prisma.membershipProfile.upsert({
      where: { userId },
      update: {
        phone: body.phone ?? undefined,
        city: body.city ?? undefined,
        jerseySize: body.jerseySize ?? undefined,
        nextOfKin: body.nextOfKin ?? undefined,
      },
      create: {
        userId,
        phone: body.phone || existing.profile?.phone || "N/A",
        city: body.city || existing.profile?.city || null,
        jerseySize: body.jerseySize || existing.profile?.jerseySize || null,
        nextOfKin: body.nextOfKin || existing.profile?.nextOfKin || null,
        qrToken: existing.profile?.qrToken || makeQrToken(),
      },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

adminLoyaltyRouter.post("/members/:id/points", async (req, res, next) => {
  try {
    const body = AdjustPointsSchema.parse(req.body);
    const userId = req.params.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Object.assign(new Error("Member not found"), { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await addPoints(tx, {
        userId,
        points: body.points,
        type: "MANUAL_ADJUSTMENT",
        description: body.description || "Admin adjustment",
        referenceType: "ADMIN",
        referenceId: userId,
      });
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

adminLoyaltyRouter.post("/rewards", async (req, res, next) => {
  try {
    const body = RewardSchema.parse(req.body);
    const item = await prisma.loyaltyReward.create({
      data: {
        title: body.title,
        description: body.description || null,
        pointsCost: body.pointsCost,
        sort: body.sort,
        isActive: body.isActive,
      },
    });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminLoyaltyRouter.put("/rewards/:id", async (req, res, next) => {
  try {
    const body = RewardSchema.parse(req.body);
    const item = await prisma.loyaltyReward.update({
      where: { id: req.params.id },
      data: {
        title: body.title,
        description: body.description || null,
        pointsCost: body.pointsCost,
        sort: body.sort,
        isActive: body.isActive,
      },
    });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminLoyaltyRouter.delete("/rewards/:id", async (req, res, next) => {
  try {
    await prisma.loyaltyReward.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

adminLoyaltyRouter.post("/payments/:transactionId/mark-paid", async (req, res, next) => {
  try {
    const txRow = await prisma.paymentTransaction.findUnique({
      where: { id: req.params.transactionId },
    });

    if (!txRow || !txRow.orderId) {
      throw Object.assign(new Error("Membership payment not found"), { status: 404 });
    }

    const order = await prisma.order.findUnique({
      where: { id: txRow.orderId },
    });

    if (!order || order.type !== "MEMBERSHIP") {
      throw Object.assign(new Error("Membership order not found"), { status: 404 });
    }

    if (txRow.status !== "SUCCESS") {
      const raw = safeJson(order.metadata) || {};
      const nextMeta = {
        ...raw,
        mpesa: {
          ...(raw.mpesa || {}),
          manualApproved: true,
          manualApprovedAt: new Date().toISOString(),
        },
      };

      await prisma.paymentTransaction.update({
        where: { id: txRow.id },
        data: { status: "SUCCESS" },
      });

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          metadata: JSON.stringify(nextMeta),
        },
      });
    }

    await activateMembershipOrderByAdmin(order.id);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});