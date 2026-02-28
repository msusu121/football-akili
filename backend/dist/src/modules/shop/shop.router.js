import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireActiveMembership } from "../middleware/requireMembership.js";
export const shopRouter = Router();
function mediaUrl(path) {
    if (!path)
        return null;
    const base = process.env.ASSETS_PUBLIC_URL || process.env.S3_PUBLIC_BASE_URL || "";
    return base ? `${base}/${path}` : path;
}
// Members-only shop access (as requested)
shopRouter.get("/products", requireAuth, requireActiveMembership, async (_req, res, next) => {
    try {
        const products = await prisma.product.findMany({
            where: { isActive: true },
            orderBy: { createdAt: "desc" },
            include: { heroMedia: true },
        });
        res.json({
            items: products.map((p) => ({
                id: p.id,
                slug: p.slug,
                title: p.title,
                price: p.price,
                currency: p.currency,
                heroUrl: mediaUrl(p.heroMedia?.path),
            })),
        });
    }
    catch (e) {
        next(e);
    }
});
shopRouter.get("/products/:slug", requireAuth, requireActiveMembership, async (req, res, next) => {
    try {
        const p = await prisma.product.findUnique({ where: { slug: req.params.slug }, include: { heroMedia: true } });
        if (!p || !p.isActive)
            throw Object.assign(new Error("Not found"), { status: 404 });
        res.json({
            id: p.id,
            slug: p.slug,
            title: p.title,
            description: p.description,
            price: p.price,
            currency: p.currency,
            heroUrl: mediaUrl(p.heroMedia?.path),
        });
    }
    catch (e) {
        next(e);
    }
});
shopRouter.get("/orders/me", requireAuth, requireActiveMembership, async (req, res, next) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.user.id, type: "SHOP" },
            orderBy: { createdAt: "desc" },
            include: { items: { include: { product: true } } },
            take: 50,
        });
        res.json({ items: orders });
    }
    catch (e) {
        next(e);
    }
});
