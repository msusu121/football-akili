import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const paymentsRouter = Router();

// NOTE: This is a production-ready contract with a DEV mock-confirm endpoint.
// Swap mock confirm with real M-Pesa/Card webhooks later.

const MembershipCheckoutSchema = z.object({
  months: z.number().int().min(1).max(24).default(1),
});

paymentsRouter.post("/membership/checkout", requireAuth, async (req, res, next) => {
  try {
    const body = MembershipCheckoutSchema.parse(req.body);
    const monthly = Number(process.env.MEMBERSHIP_PRICE || 500);
    const total = monthly * body.months;
    const currency = process.env.CURRENCY || "KES";

    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        type: "MEMBERSHIP",
        currency,
        total,
        metadata: JSON.stringify({ months: body.months, monthly }),
      },
    });

    const tx = await prisma.paymentTransaction.create({
      data: {
        provider: "MANUAL",
        amount: total,
        currency,
        status: "PENDING",
        orderId: order.id,
        userId: req.user!.id,
      },
    });

    res.json({
      orderId: order.id,
      transactionId: tx.id,
      amount: total,
      currency,
      message: "DEV mode: call /payments/mock/confirm to simulate payment success.",
    });
  } catch (e) {
    next(e);
  }
});

const ShopCheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().min(1).max(20),
      })
    )
    .min(1),
});

paymentsRouter.post("/shop/checkout", requireAuth, async (req, res, next) => {
  try {
    const body = ShopCheckoutSchema.parse(req.body);
    const currency = process.env.CURRENCY || "KES";

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map((i) => i.productId) }, isActive: true },
    });
    const priceMap = new Map(products.map((p) => [p.id, p.price]));
    const missing = body.items.find((i) => !priceMap.has(i.productId));
    if (missing) throw Object.assign(new Error("Some products not found"), { status: 400 });

    const total = body.items.reduce((sum, i) => sum + (priceMap.get(i.productId) || 0) * i.qty, 0);

    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        type: "SHOP",
        currency,
        total,
        items: {
          create: body.items.map((i) => ({
            productId: i.productId,
            qty: i.qty,
            unitPrice: priceMap.get(i.productId) || 0,
            lineTotal: (priceMap.get(i.productId) || 0) * i.qty,
          })),
        },
      },
      include: { items: true },
    });

    const tx = await prisma.paymentTransaction.create({
      data: {
        provider: "MANUAL",
        amount: total,
        currency,
        status: "PENDING",
        orderId: order.id,
        userId: req.user!.id,
      },
    });

    res.json({
      orderId: order.id,
      transactionId: tx.id,
      amount: total,
      currency,
      message: "DEV mode: call /payments/mock/confirm to simulate payment success.",
    });
  } catch (e) {
    next(e);
  }
});

const TicketCheckoutSchema = z.object({
  eventId: z.string().min(1),
  tierId: z.string().min(1),
  qty: z.number().int().min(1).max(20),
});

paymentsRouter.post("/tickets/checkout", requireAuth, async (req, res, next) => {
  try {
    const body = TicketCheckoutSchema.parse(req.body);
    const event = await prisma.ticketEvent.findUnique({
      where: { id: body.eventId },
      include: { tiers: true },
    });
    if (!event || !event.isActive) throw Object.assign(new Error("Event not found"), { status: 404 });

    const now = new Date();
    if (now < event.salesOpenAt || now > event.salesCloseAt)
      throw Object.assign(new Error("Ticket sales closed"), { status: 400 });

    const tier = event.tiers.find((t) => t.id === body.tierId);
    if (!tier) throw Object.assign(new Error("Tier not found"), { status: 404 });

    // Capacity guard (optimistic)
    if (tier.sold + body.qty > tier.capacity) throw Object.assign(new Error("Sold out"), { status: 409 });

    const total = tier.price * body.qty;
    const code = `T-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    const ticket = await prisma.ticket.create({
      data: {
        userId: req.user!.id,
        eventId: event.id,
        tierId: tier.id,
        quantity: body.qty,
        total,
        status: "RESERVED",
        code,
      },
    });

    await prisma.ticketTier.update({
      where: { id: tier.id },
      data: { sold: { increment: body.qty } },
    });

    // Create a pseudo order for tickets (simplifies payments reporting)
    const order = await prisma.order.create({
      data: {
        userId: req.user!.id,
        type: "TICKETS",
        currency: event.currency,
        total,
        metadata: JSON.stringify({ ticketId: ticket.id, eventId: event.id, tierId: tier.id, qty: body.qty }),
      },
    });

    const tx = await prisma.paymentTransaction.create({
      data: {
        provider: "MANUAL",
        amount: total,
        currency: event.currency,
        status: "PENDING",
        orderId: order.id,
        ticketId: ticket.id,
        userId: req.user!.id,
      },
    });

    res.json({
      ticketId: ticket.id,
      orderId: order.id,
      transactionId: tx.id,
      amount: total,
      currency: event.currency,
      message: "DEV mode: call /payments/mock/confirm to simulate payment success and generate QR.",
    });
  } catch (e) {
    next(e);
  }
});

const MockConfirmSchema = z.object({
  transactionId: z.string().min(1),
});

paymentsRouter.post("/mock/confirm", requireAuth, async (req, res, next) => {
  try {
    const body = MockConfirmSchema.parse(req.body);
    const tx = await prisma.paymentTransaction.findUnique({ where: { id: body.transactionId } });
    if (!tx || tx.userId !== req.user!.id) throw Object.assign(new Error("Not found"), { status: 404 });
    if (tx.status === "SUCCESS") return res.json({ ok: true, already: true });

    await prisma.paymentTransaction.update({ where: { id: tx.id }, data: { status: "SUCCESS" } });

    // Apply effects
    if (tx.orderId) {
      const order = await prisma.order.findUnique({ where: { id: tx.orderId } });
      if (order) {
        if (order.type === "MEMBERSHIP") {
          const meta = safeJson(order.metadata);
          const months = Number(meta?.months || 1);
          const now = new Date();
          const base = await prisma.user.findUnique({ where: { id: req.user!.id } });
          const start = base?.membershipUntil && base.membershipUntil > now ? base.membershipUntil : now;
          const until = new Date(start);
          until.setMonth(until.getMonth() + months);
          await prisma.user.update({
            where: { id: req.user!.id },
            data: { membership: "ACTIVE", membershipUntil: until },
          });
          await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
        } else {
          await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });
        }
      }
    }

    if (tx.ticketId) {
      const ticket = await prisma.ticket.findUnique({ where: { id: tx.ticketId } });
      if (ticket && ticket.status !== "PAID") {
        const qr = await QRCode.toDataURL(
          JSON.stringify({ code: ticket.code, ticketId: ticket.id }),
          { margin: 1, width: 320 }
        );
        await prisma.ticket.update({ where: { id: ticket.id }, data: { status: "PAID", qrDataUrl: qr } });
      }
    }

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

function safeJson(raw?: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
