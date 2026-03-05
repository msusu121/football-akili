import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import QRCode from "qrcode";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth";
import { stkPush , normalizePhone } from "../../lib/mpesa";
import { logger } from "../../utils/mailService";
import { sendMail, buildShopPaidReceiptEmail, getShopMailDefaults, getSmtpFromenv} from "../../utils/mailService";


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

// ✅ Guest checkout schema (NO requireAuth)
const ShopCheckoutStkSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8), // mpesa prompt

  billingAddress: z.object({
    line1: z.string().min(2),
    line2: z.string().optional().nullable(),
    city: z.string().min(2),
  }),

  delivery: z.object({
    location: z.string().min(2),
    notes: z.string().optional().nullable(),
  }),

  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        qty: z.number().int().min(1).max(20),
      })
    )
    .min(1),
});

paymentsRouter.post("/shop/checkout/stk", async (req, res, next) => {
  try {
    const body = ShopCheckoutStkSchema.parse(req.body);

    const currency = process.env.CURRENCY || "KES";
    const phone = normalizePhone(body.phone);

    // ✅ Load + validate variants (and product match)
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: body.items.map((i) => i.variantId) }, isActive: true },
      include: { product: true },
    });

    const vMap = new Map(variants.map((v) => [v.id, v]));

    for (const i of body.items) {
      const v = vMap.get(i.variantId);
      if (!v) throw Object.assign(new Error("Some variants not found"), { status: 400 });
      if (!v.product?.isActive) throw Object.assign(new Error("Some products not found"), { status: 400 });
      if (v.productId !== i.productId) throw Object.assign(new Error("Variant mismatch"), { status: 400 });
      if (typeof v.stock === "number" && v.stock <= 0)
        throw Object.assign(new Error("Some variants are out of stock"), { status: 409 });
    }

    // ✅ Total uses variant override or product base
    const total = body.items.reduce((sum, i) => {
      const v = vMap.get(i.variantId)!;
      const unit = v.price ?? v.product.price;
      return sum + unit * i.qty;
    }, 0);

    if (total <= 0) throw Object.assign(new Error("Invalid total"), { status: 400 });

    // ✅ Save customer + billing + delivery in Order.metadata
    const orderMeta = {
      customer: { fullName: body.fullName, email: body.email, phone: body.phone },
      billingAddress: body.billingAddress,
      delivery: body.delivery,
      receiptEmailSent: false,
    };

    // ✅ Create order (guest: userId null)
    const order = await prisma.order.create({
      data: {
        userId: null,
        type: "SHOP",
        currency,
        total,
        metadata: JSON.stringify(orderMeta),
        items: {
          create: body.items.map((i) => {
            const v = vMap.get(i.variantId)!;
            const unit = v.price ?? v.product.price;
            return {
              productId: i.productId,
              variantId: i.variantId,
              group: v.group,
              size: v.size,
              qty: i.qty,
              unitPrice: unit,
              lineTotal: unit * i.qty,
            };
          }),
        },
      },
      include: { items: { include: { product: true } } },
    });

    // ✅ Create tx (guest: userId null)
    const tx = await prisma.paymentTransaction.create({
      data: {
        provider: "MPESA",
        amount: total,
        currency,
        status: "PENDING",
        orderId: order.id,
        userId: null,
      },
    });

    const secret = process.env.MPESA_CALLBACK_SECRET || "";
    const base = process.env.PUBLIC_BASE_URL!;
    const callbackUrl = `${base}/api/payments/mpesa/callback/stk${secret ? `?s=${encodeURIComponent(secret)}` : ""}`;

    const accountRef = `SHOP-${order.id.slice(-10)}`;

    const stk = await stkPush({
      amount: total,
      phone,
      accountReference: accountRef,
      transactionDesc: `Shop order ${order.id}`,
      callbackUrl,
    });

    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { reference: stk.CheckoutRequestID },
    });

    res.json({
      orderId: order.id,
      transactionId: tx.id,
      checkoutRequestId: stk.CheckoutRequestID,
      merchantRequestId: stk.MerchantRequestID,
      amount: total,
      currency,
      customerMessage: stk.CustomerMessage,
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



paymentsRouter.post("/mpesa/callback/stk", async (req, res) => {
  try {
    // Optional shared-secret check
    const expected = process.env.MPESA_CALLBACK_SECRET;
    if (expected && req.query.s !== expected) return res.status(401).json({ ok: false });

    // Daraja callback shape
    const cb = req.body?.Body?.stkCallback;
    const checkoutRequestId = cb?.CheckoutRequestID as string | undefined;
    const resultCode = cb?.ResultCode as number | undefined;

    if (!checkoutRequestId) return res.json({ ok: true }); // nothing to do

    const tx = await prisma.paymentTransaction.findFirst({
      where: { reference: checkoutRequestId },
    });

    // If we don't recognize it, still 200 (Mpesa retries otherwise)
    if (!tx) return res.json({ ok: true });

    // Idempotent: if already final, ignore
    if (tx.status === "SUCCESS" || tx.status === "FAILED") return res.json({ ok: true });

    const isSuccess = Number(resultCode) === 0;

    // Parse callback metadata if success
    const metaItems = cb?.CallbackMetadata?.Item || [];
    const meta = new Map<string, any>();
    for (const it of metaItems) {
      if (it?.Name) meta.set(it.Name, it.Value);
    }

    // Mark tx final
    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { status: isSuccess ? "SUCCESS" : "FAILED" },
    });

    // Apply effects on order/ticket/membership
    if (tx.orderId) {
      const order = await prisma.order.findUnique({ where: { id: tx.orderId } });

      if (order) {
        if (isSuccess) {
          // ✅ mark order paid
          await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });

          // Enrich order.metadata with mpesa receipt:
          const mpesaReceipt = meta.get("MpesaReceiptNumber");
          const paidPhone = meta.get("PhoneNumber");
          const amount = meta.get("Amount");

          const raw = safeJson(order.metadata) || {};
          const nextMeta = {
            ...raw,
            mpesa: {
              receipt: mpesaReceipt,
              phone: paidPhone,
              amount,
              checkoutRequestId,
            },
          };

          await prisma.order.update({
            where: { id: order.id },
            data: { metadata: JSON.stringify(nextMeta) },
          });

          // ✅ EMAIL RECEIPT (SHOP orders) — idempotent
          // IMPORTANT: fetch full order w/ items+product after metadata update
          const orderFull = await prisma.order.findUnique({
            where: { id: order.id },
            include: { items: { include: { product: true } } },
          });

          if (orderFull) {
            const meta0 = safeJson(orderFull.metadata) || {};
            const email = meta0?.customer?.email;

            // ✅ idempotent: don't send twice
            if (email && meta0.receiptEmailSent !== true && orderFull.type === "SHOP") {
              const { subject, html } = buildShopPaidReceiptEmail({
                orderId: orderFull.id,
                currency: orderFull.currency,
                total: orderFull.total,
                items: orderFull.items.map((it) => ({
                  title: it.product?.title || "Item",
                  qty: it.qty,
                  lineTotal: it.lineTotal,
                  group: (it as any).group,
                  size: (it as any).size,
                })),
                meta: meta0,
              });

              const defaults = getShopMailDefaults();

              const info = await sendMail(
                {
                  to: email,
                  subject,
                  html,
                  from: defaults.from,
                  fromName: defaults.fromName,
                  replyTo: defaults.replyTo,
                  bcc: defaults.bcc,
                  smtp: getSmtpFromenv(),
                },
                { throwOnError: false }
              );

              meta0.receiptEmailSent = !!info?.accepted?.length;
              meta0.receiptEmailSentAt = new Date().toISOString();
              if (!meta0.receiptEmailSent) meta0.receiptEmailError = "Relay did not accept recipient";

              await prisma.order.update({
                where: { id: orderFull.id },
                data: { metadata: JSON.stringify(meta0) },
              });

              logger.info("Receipt email attempt", { orderId: orderFull.id, to: email, sent: meta0.receiptEmailSent });
            }
          }

          // OPTIONAL: membership effects if this callback is used for membership orders too
          if (order.type === "MEMBERSHIP") {
            const metaM = safeJson(order.metadata) || {};
            const months = Number(metaM?.months || 1);
            const now = new Date();

            if (order.userId) {
              const baseUser = await prisma.user.findUnique({ where: { id: order.userId } });
              const start =
                baseUser?.membershipUntil && baseUser.membershipUntil > now ? baseUser.membershipUntil : now;

              const until = new Date(start);
              until.setMonth(until.getMonth() + months);

              await prisma.user.update({
                where: { id: order.userId },
                data: { membership: "ACTIVE", membershipUntil: until },
              });
            }
          }

          // OPTIONAL: ticket effects if this callback is used for ticket orders too
          if (order.type === "TICKETS") {
            const metaT = safeJson(order.metadata) || {};
            const ticketId = metaT?.ticketId;

            if (ticketId) {
              const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
              if (ticket && ticket.status !== "PAID") {
                const qr = await QRCode.toDataURL(
                  JSON.stringify({ code: ticket.code, ticketId: ticket.id }),
                  { margin: 1, width: 320 }
                );
                await prisma.ticket.update({
                  where: { id: ticket.id },
                  data: { status: "PAID", qrDataUrl: qr },
                });
              }
            }
          }
        } else {
          // On failure: cancel
          await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
        }
      }
    }

    return res.json({ ok: true });
  } catch (err: any) {
    // Always 200 to stop Mpesa retries; log for you to inspect
    logger.error("mpesa callback handler failed", err?.message ?? err);
    return res.json({ ok: true });
  }
});

paymentsRouter.get("/tx/status/:checkoutRequestId", async (req, res, next) => {
  try {
    const checkoutRequestId = z.string().min(1).parse(req.params.checkoutRequestId);
    const tx = await prisma.paymentTransaction.findFirst({ where: { reference: checkoutRequestId } });
    if (!tx) return res.status(404).json({ status: "NOT_FOUND" });
    res.json({ status: tx.status, orderId: tx.orderId });
  } catch (e) {
    next(e);
  }
});