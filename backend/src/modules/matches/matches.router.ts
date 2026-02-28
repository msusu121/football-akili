import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const matchesRouter = Router();

matchesRouter.get("/upcoming", async (req, res, next) => {
  try {
    const take = Math.min(50, Math.max(1, Number(req.query.take || 10)));
    const items = await prisma.match.findMany({
      where: { kickoffAt: { gt: new Date() } },
      orderBy: { kickoffAt: "asc" },
      take,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

matchesRouter.get("/results", async (req, res, next) => {
  try {
    const take = Math.min(50, Math.max(1, Number(req.query.take || 10)));
    const items = await prisma.match.findMany({
      where: { status: "FT" },
      orderBy: { kickoffAt: "desc" },
      take,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

matchesRouter.get("/", async (req, res, next) => {
  try {
    const season = (req.query.season as string | undefined) || undefined;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const items = await prisma.match.findMany({
      where: {
        ...(season ? { season } : {}),
        ...(from || to ? { kickoffAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      },
      orderBy: { kickoffAt: "asc" },
    });

    res.json({ items });
  } catch (e) {
    next(e);
  }
});
