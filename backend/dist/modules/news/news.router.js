import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
export const newsRouter = Router();
function mediaUrl(path) {
    if (!path)
        return null;
    const base = process.env.ASSETS_PUBLIC_URL || process.env.S3_PUBLIC_BASE_URL || "";
    return base ? `${base}/${path}` : path;
}
newsRouter.get("/", async (req, res, next) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const pageSize = Math.min(30, Math.max(1, Number(req.query.pageSize || 12)));
        const [items, total] = await Promise.all([
            prisma.newsPost.findMany({
                where: { publishedAt: { not: null } },
                orderBy: { publishedAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: { heroMedia: true },
            }),
            prisma.newsPost.count({ where: { publishedAt: { not: null } } }),
        ]);
        res.json({
            page,
            pageSize,
            total,
            items: items.map((n) => ({
                id: n.id,
                slug: n.slug,
                title: n.title,
                excerpt: n.excerpt,
                publishedAt: n.publishedAt,
                isFeatured: n.isFeatured,
                heroUrl: mediaUrl(n.heroMedia?.path),
            })),
        });
    }
    catch (e) {
        next(e);
    }
});
newsRouter.get("/:slug", async (req, res, next) => {
    try {
        const slug = req.params.slug;
        const post = await prisma.newsPost.findUnique({ where: { slug }, include: { heroMedia: true } });
        if (!post || !post.publishedAt)
            throw Object.assign(new Error("Not found"), { status: 404 });
        res.json({
            id: post.id,
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            contentHtml: post.contentHtml,
            publishedAt: post.publishedAt,
            heroUrl: mediaUrl(post.heroMedia?.path),
        });
    }
    catch (e) {
        next(e);
    }
});
