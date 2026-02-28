import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
export const teamRouter = Router();
function mediaUrl(path) {
    if (!path)
        return null;
    const base = process.env.ASSETS_PUBLIC_URL || process.env.S3_PUBLIC_BASE_URL || "";
    return base ? `${base}/${path}` : path;
}
teamRouter.get("/", async (req, res, next) => {
    try {
        const team = req.query.team || undefined;
        const isStaff = req.query.isStaff ? req.query.isStaff === "true" : undefined;
        const members = await prisma.teamMember.findMany({
            where: {
                ...(team ? { team } : {}),
                ...(typeof isStaff === "boolean" ? { isStaff } : {}),
            },
            orderBy: [{ isStaff: "asc" }, { position: "asc" }, { jerseyNo: "asc" }],
            include: { portrait: true },
        });
        const grouped = members.reduce((acc, m) => {
            const key = m.isStaff ? "Staff" : m.position;
            acc[key] = acc[key] || [];
            acc[key].push({
                id: m.id,
                slug: m.slug,
                fullName: m.fullName,
                jerseyNo: m.jerseyNo,
                position: m.position,
                team: m.team,
                isStaff: m.isStaff,
                portraitUrl: mediaUrl(m.portrait?.path),
            });
            return acc;
        }, {});
        res.json({ team, isStaff, grouped });
    }
    catch (e) {
        next(e);
    }
});
teamRouter.get("/:slug", async (req, res, next) => {
    try {
        const member = await prisma.teamMember.findUnique({ where: { slug: req.params.slug }, include: { portrait: true } });
        if (!member)
            throw Object.assign(new Error("Not found"), { status: 404 });
        res.json({
            id: member.id,
            slug: member.slug,
            fullName: member.fullName,
            jerseyNo: member.jerseyNo,
            position: member.position,
            team: member.team,
            bioHtml: member.bioHtml,
            funFact: member.funFact,
            isStaff: member.isStaff,
            portraitUrl: mediaUrl(member.portrait?.path),
        });
    }
    catch (e) {
        next(e);
    }
});
