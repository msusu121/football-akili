import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const adminTicketsRouter = Router();

function requireCmsRole(req: any, res: any, next: any) {
  const role = req.user?.role;
  if (!role || !["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"].includes(role)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

adminTicketsRouter.use(requireAuth, requireCmsRole);

const TicketTierInputSchema = z.object({
  name: z.string().min(1),
  price: z.number().int().min(0),
  capacity: z.number().int().min(1),
});

const TicketEventInputSchema = z.object({
  matchId: z.string().min(1),
  title: z.string().min(2),
  salesOpenAt: z.string().min(1),
  salesCloseAt: z.string().min(1),
  currency: z.string().min(3).max(10).default("KES"),
  isActive: z.boolean().default(true),
  tiers: z.array(TicketTierInputSchema).min(1),
});

function asDate(v: string, label: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) {
    throw Object.assign(new Error(`${label} is invalid`), { status: 400 });
  }
  return d;
}

adminTicketsRouter.get("/", async (_req, res, next) => {
  try {
    const items = await prisma.ticketEvent.findMany({
      include: {
        match: true,
        tiers: { orderBy: { price: "desc" } },
      },
      orderBy: {
        salesOpenAt: "asc",
      },
    });

    const matches = await prisma.match.findMany({
      where: {
        kickoffAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        kickoffAt: "asc",
      },
      select: {
        id: true,
        competition: true,
        season: true,
        kickoffAt: true,
        venue: true,
        isHome: true,
        opponent: true,
        status: true,
        ticketEvent: {
          select: { id: true },
        },
      },
    });

    res.json({ items, matches });
  } catch (e) {
    next(e);
  }
});

adminTicketsRouter.post("/", async (req, res, next) => {
  try {
    const body = TicketEventInputSchema.parse(req.body);

    const match = await prisma.match.findUnique({
      where: { id: body.matchId },
    });
    if (!match) throw Object.assign(new Error("Match not found"), { status: 404 });

    const existing = await prisma.ticketEvent.findUnique({
      where: { matchId: body.matchId },
    });
    if (existing) {
      throw Object.assign(new Error("Ticket event already exists for this match"), { status: 409 });
    }

    const salesOpenAt = asDate(body.salesOpenAt, "salesOpenAt");
    const salesCloseAt = asDate(body.salesCloseAt, "salesCloseAt");

    if (salesOpenAt >= salesCloseAt) {
      throw Object.assign(new Error("Sales open must be before sales close"), { status: 400 });
    }

    const item = await prisma.ticketEvent.create({
      data: {
        matchId: body.matchId,
        title: body.title,
        salesOpenAt,
        salesCloseAt,
        currency: body.currency,
        isActive: body.isActive,
        tiers: {
          create: body.tiers.map((t) => ({
            name: t.name,
            price: t.price,
            capacity: t.capacity,
          })),
        },
      },
      include: {
        match: true,
        tiers: { orderBy: { price: "desc" } },
      },
    });

    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminTicketsRouter.put("/:id", async (req, res, next) => {
  try {
    const body = TicketEventInputSchema.parse(req.body);

    const existing = await prisma.ticketEvent.findUnique({
      where: { id: req.params.id },
      include: {
        tiers: true,
        tickets: { select: { id: true } },
      },
    });

    if (!existing) throw Object.assign(new Error("Ticket event not found"), { status: 404 });

    const salesOpenAt = asDate(body.salesOpenAt, "salesOpenAt");
    const salesCloseAt = asDate(body.salesCloseAt, "salesCloseAt");

    if (salesOpenAt >= salesCloseAt) {
      throw Object.assign(new Error("Sales open must be before sales close"), { status: 400 });
    }

    const hasSales =
      existing.tickets.length > 0 || existing.tiers.some((t) => t.sold > 0);

    await prisma.$transaction(async (tx) => {
      await tx.ticketEvent.update({
        where: { id: req.params.id },
        data: {
          matchId: body.matchId,
          title: body.title,
          salesOpenAt,
          salesCloseAt,
          currency: body.currency,
          isActive: body.isActive,
        },
      });

      // Only replace tiers if no tickets/sales yet
      if (!hasSales) {
        await tx.ticketTier.deleteMany({
          where: { eventId: req.params.id },
        });

        await tx.ticketTier.createMany({
          data: body.tiers.map((t) => ({
            eventId: req.params.id,
            name: t.name,
            price: t.price,
            capacity: t.capacity,
          })),
        });
      }
    });

    const item = await prisma.ticketEvent.findUnique({
      where: { id: req.params.id },
      include: {
        match: true,
        tiers: { orderBy: { price: "desc" } },
      },
    });

    res.json({ item, tiersLocked: hasSales });
  } catch (e) {
    next(e);
  }
});

adminTicketsRouter.delete("/:id", async (req, res, next) => {
  try {
    const existing = await prisma.ticketEvent.findUnique({
      where: { id: req.params.id },
      include: {
        tickets: { select: { id: true } },
      },
    });

    if (!existing) throw Object.assign(new Error("Ticket event not found"), { status: 404 });

    if (existing.tickets.length > 0) {
      throw Object.assign(
        new Error("Cannot delete ticket event with existing tickets"),
        { status: 409 }
      );
    }

    await prisma.ticketTier.deleteMany({
      where: { eventId: req.params.id },
    });

    await prisma.ticketEvent.delete({
      where: { id: req.params.id },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});