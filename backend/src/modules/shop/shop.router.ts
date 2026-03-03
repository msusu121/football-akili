import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";


export const shopRouter = Router();

function mediaUrl(path?: string | null) {
  if (!path) return null;
  const base = process.env.ASSETS_PUBLIC_URL || process.env.S3_PUBLIC_BASE_URL || "";
  return base ? `${base}/${path}` : path;
}
/**
 * ✅ PUBLIC: List products (no auth, no membership)
 */
// shopRouter.get("/products", ...)

shopRouter.get("/products", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const kitType = typeof req.query.kitType === "string" ? req.query.kitType.trim() : "";

    const where: any = { isActive: true };

    if (category) where.category = category;        // "KIT" | "MERCH" ...
    if (kitType) where.kitType = kitType;          // "HOME" | "AWAY" | "THIRD"
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { slug: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        heroMedia: true,
        variants: { where: { isActive: true } },
      },
    });

    res.json({
      items: products.map((p) => {
        const prices = [p.price, ...p.variants.map((v) => (v.price ?? p.price))];
        const fromPrice = Math.min(...prices);

        const groups = Array.from(new Set(p.variants.map((v) => v.group)));
        const variantCount = p.variants.length;

        // ✅ “defaultVariant” lets frontend add instantly if ONE SIZE
        const defaultVariant =
          variantCount === 1
            ? {
                id: p.variants[0].id,
                group: p.variants[0].group,
                size: p.variants[0].size,
                price: p.variants[0].price,
              }
            : null;

        return {
          id: p.id,
          slug: p.slug,
          title: p.title,
          currency: p.currency,
          heroUrl: mediaUrl(p.heroMedia?.path),

          category: p.category,      // ✅
          kitType: p.kitType,        // ✅
          fromPrice,
          groups,                    // ["ADULT","KIDS"]
          variantCount,
          defaultVariant,            // ✅
        };
      }),
    });
  } catch (e) {
    next(e);
  }
});


/**
 * ✅ PUBLIC: Single product (no auth, no membership)
 */
shopRouter.get("/products/:slug", async (req, res, next) => {
  try {
    const p = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        heroMedia: true,
        variants: { where: { isActive: true }, orderBy: [{ group: "asc" }, { size: "asc" }] },
      },
    });

    if (!p || !p.isActive) throw Object.assign(new Error("Not found"), { status: 404 });

    res.json({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      price: p.price,
      currency: p.currency,
      heroUrl: mediaUrl(p.heroMedia?.path),
      variants: p.variants.map((v) => ({
        id: v.id,
        group: v.group, // ADULT | KIDS
        size: v.size,
        price: v.price,       // null means use product.price
        currency: v.currency, // usually KES
        stock: v.stock,
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * ✅ Auth-only (no membership): user’s own orders (still must be logged in)
 */
shopRouter.get("/orders/me", requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id, type: "SHOP" },
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: true } } },
      take: 50,
    });
    res.json({ items: orders });
  } catch (e) {
    next(e);
  }
});