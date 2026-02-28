import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
export const ticketsRouter = Router();
function mediaUrl(path) {
    if (!path)
        return null;
    const base = process.env.ASSETS_PUBLIC_URL || process.env.S3_PUBLIC_BASE_URL || "";
    return base ? `${base}/${path}` : path;
}
// Featured events (like tickets subdomain "Featured Events")
ticketsRouter.get("/events/featured", async (_req, res, next) => {
    try {
        const now = new Date();
        const events = await prisma.ticketEvent.findMany({
            where: { isActive: true, salesCloseAt: { gt: now } },
            orderBy: [{ salesOpenAt: "asc" }],
            include: {
                match: true,
                tiers: { orderBy: { price: "desc" } },
            },
            take: 12,
        });
        res.json({
            items: events.map((e) => ({
                id: e.id,
                title: e.title,
                currency: e.currency,
                salesOpenAt: e.salesOpenAt,
                salesCloseAt: e.salesCloseAt,
                match: e.match,
                tiers: e.tiers,
            })),
        });
    }
    catch (e) {
        next(e);
    }
});
ticketsRouter.get("/events/:id", async (req, res, next) => {
    try {
        const e = await prisma.ticketEvent.findUnique({
            where: { id: req.params.id },
            include: { match: true, tiers: { orderBy: { price: "desc" } } },
        });
        if (!e || !e.isActive)
            throw Object.assign(new Error("Not found"), { status: 404 });
        res.json({ event: e });
    }
    catch (e) {
        next(e);
    }
});
// My tickets
ticketsRouter.get("/me", requireAuth, async (req, res, next) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                event: { include: { match: true } },
                tier: true,
            },
            take: 50,
        });
        res.json({
            items: tickets.map((t) => ({
                id: t.id,
                status: t.status,
                quantity: t.quantity,
                total: t.total,
                code: t.code,
                qrDataUrl: t.qrDataUrl,
                event: t.event,
                tier: t.tier,
            })),
        });
    }
    catch (e) {
        next(e);
    }
});
