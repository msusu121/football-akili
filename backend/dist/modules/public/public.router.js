import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
export const publicRouter = Router();
function withMediaUrl(asset) {
    if (!asset)
        return null;
    const base = process.env.ASSETS_PUBLIC_URL ||
        process.env.PUBLIC_MEDIA_BASE_URL ||
        process.env.S3_PUBLIC_BASE_URL ||
        "";
    return { ...asset, url: base ? `${base}/${asset.path}` : asset.path };
}
publicRouter.get("/home", async (_req, res, next) => {
    try {
        const settings = await prisma.siteSetting.findUnique({
            where: { id: "global" },
            include: {
                heroMedia: true,
                headerLogo: true,
                partnerLogo: true,
                homeShopImage: true,
                homeMembershipImage: true,
            },
        });
        const featured = await prisma.newsPost.findFirst({
            where: { isFeatured: true, publishedAt: { not: null } },
            orderBy: { publishedAt: "desc" },
            include: { heroMedia: true },
        });
        const latestNews = await prisma.newsPost.findMany({
            where: { publishedAt: { not: null } },
            orderBy: { publishedAt: "desc" },
            take: 5,
            include: { heroMedia: true },
        });
        const sponsors = await prisma.sponsor.findMany({
            where: { isActive: true },
            orderBy: [{ tier: "asc" }, { sort: "asc" }],
            include: { logo: true },
        });
        const socials = await prisma.socialLink.findMany({ where: { isActive: true }, orderBy: { sort: "asc" } });
        const highlights = await prisma.highlight.findMany({
            where: { isActive: true },
            orderBy: [{ sort: "asc" }, { createdAt: "desc" }],
            include: { thumbnail: true },
            take: 6,
        });
        const kits = await prisma.product.findMany({
            where: { isActive: true, category: "KIT" },
            orderBy: { createdAt: "desc" },
            take: 6,
            include: { heroMedia: true },
        });
        // Upcoming match teaser
        const nextMatch = await prisma.match.findFirst({
            where: { kickoffAt: { gt: new Date() } },
            orderBy: { kickoffAt: "asc" },
        });
        res.json({
            settings: settings
                ? {
                    ...settings,
                    heroMedia: withMediaUrl(settings.heroMedia),
                    headerLogo: withMediaUrl(settings.headerLogo),
                    partnerLogo: withMediaUrl(settings.partnerLogo),
                    homeShopImage: withMediaUrl(settings.homeShopImage),
                    homeMembershipImage: withMediaUrl(settings.homeMembershipImage),
                }
                : null,
            featured: featured
                ? {
                    ...featured,
                    heroMedia: withMediaUrl(featured.heroMedia),
                }
                : null,
            latestNews: latestNews.map((n) => ({ ...n, heroMedia: withMediaUrl(n.heroMedia) })),
            nextMatch,
            sponsors: sponsors.map((s) => ({ ...s, logo: withMediaUrl(s.logo) })),
            socials,
            highlights: highlights.map((h) => ({
                id: h.id,
                title: h.title,
                videoUrl: h.videoUrl,
                durationSec: h.durationSec,
                publishedAt: h.publishedAt,
                thumbnail: withMediaUrl(h.thumbnail),
            })),
            kits: kits.map((p) => ({
                id: p.id,
                slug: p.slug,
                title: p.title,
                price: p.price,
                currency: p.currency,
                category: p.category,
                kitType: p.kitType,
                heroMedia: withMediaUrl(p.heroMedia),
            })),
        });
    }
    catch (e) {
        next(e);
    }
});
publicRouter.get("/faqs", async (_req, res, next) => {
    try {
        const items = await prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { sort: "asc" } });
        res.json({ items });
    }
    catch (e) {
        next(e);
    }
});
