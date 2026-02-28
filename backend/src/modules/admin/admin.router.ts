import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/requireAuth.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireRole(["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"]));

// -------------------- Overview --------------------
adminRouter.get("/overview", async (_req, res, next) => {
  try {
    const [news, matches, team, sponsors, products, media, tickets] = await Promise.all([
      prisma.newsPost.count(),
      prisma.match.count(),
      prisma.teamMember.count(),
      prisma.sponsor.count(),
      prisma.product.count(),
      prisma.mediaAsset.count(),
      prisma.ticketEvent.count(),
    ]);
    res.json({ counts: { news, matches, team, sponsors, products, media, tickets } });
  } catch (e) {
    next(e);
  }
});

// -------------------- Media Library --------------------
const MediaCreateSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "DOC"]),
  title: z.string().optional(),
  path: z.string().min(1),
  mimeType: z.string().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  bytes: z.number().int().optional(),
});

adminRouter.get("/media", async (req, res, next) => {
  try {
    const q = (req.query.q as string | undefined) || "";
    const items = await prisma.mediaAsset.findMany({
      where: q
        ? {
            OR: [{ title: { contains: q } }, { path: { contains: q } }],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/media", async (req, res, next) => {
  try {
    const body = MediaCreateSchema.parse(req.body);
    const item = await prisma.mediaAsset.create({ data: body });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

// -------------------- News --------------------
const NewsUpsertSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  excerpt: z.string().min(2),
  contentHtml: z.string().min(1),
  isFeatured: z.boolean().optional(),
  heroMediaId: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

adminRouter.get("/news", async (_req, res, next) => {
  try {
    const items = await prisma.newsPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { heroMedia: true },
      take: 200,
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/news", async (req, res, next) => {
  try {
    const body = NewsUpsertSchema.parse(req.body);
    const item = await prisma.newsPost.create({
      data: {
        ...body,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : null,
      },
    });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/news/:id", async (req, res, next) => {
  try {
    const body = NewsUpsertSchema.partial().parse(req.body);
    const item = await prisma.newsPost.update({
      where: { id: req.params.id },
      data: {
        ...body,
        ...(body.publishedAt !== undefined
          ? { publishedAt: body.publishedAt ? new Date(body.publishedAt) : null }
          : {}),
      },
    });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/news/:id", async (req, res, next) => {
  try {
    await prisma.newsPost.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// -------------------- Matches & Ticket Events --------------------
const MatchUpsertSchema = z.object({
  competition: z.string().min(2),
  matchType: z.enum(["LEAGUE", "CUP", "FRIENDLY"]).optional(),
  season: z.string().min(3),
  kickoffAt: z.coerce.date(),
  venue: z.string().optional().nullable(),
  isHome: z.boolean(),
  opponent: z.string().min(2),
  homeScore: z.number().int().nullable().optional(),
  awayScore: z.number().int().nullable().optional(),
  status: z.string().optional(),
});

adminRouter.get("/matches", async (_req, res, next) => {
  try {
    const items = await prisma.match.findMany({ orderBy: { kickoffAt: "desc" }, include: { ticketEvent: true }, take: 300 });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/matches", async (req, res, next) => {
  try {
    const body = MatchUpsertSchema.parse(req.body);
    const item = await prisma.match.create({
      data: {
        ...body,
        kickoffAt: body.kickoffAt,
      },
    });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/matches/:id", async (req, res, next) => {
  try {
    const body = MatchUpsertSchema.partial().parse(req.body);
    const item = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        ...body,
        ...(body.kickoffAt ? { kickoffAt: body.kickoffAt } : {}),
      },
    });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/matches/:id", async (req, res, next) => {
  try {
    await prisma.match.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const TicketEventSchema = z.object({
  matchId: z.string().min(1),
  title: z.string().min(2),
  salesOpenAt: z.string().datetime(),
  salesCloseAt: z.string().datetime(),
  currency: z.string().min(3).default("KES"),
  isActive: z.boolean().optional(),
  tiers: z.array(z.object({ name: z.string().min(1), price: z.number().int().min(0), capacity: z.number().int().min(1) })).min(1),
});

adminRouter.post("/ticket-events", async (req, res, next) => {
  try {
    const body = TicketEventSchema.parse(req.body);
    const event = await prisma.ticketEvent.create({
      data: {
        matchId: body.matchId,
        title: body.title,
        currency: body.currency,
        salesOpenAt: new Date(body.salesOpenAt),
        salesCloseAt: new Date(body.salesCloseAt),
        isActive: body.isActive ?? true,
        tiers: { create: body.tiers },
      },
      include: { tiers: true, match: true },
    });
    res.json({ event });
  } catch (e) {
    next(e);
  }
});

// -------------------- Team / Staff --------------------
const TeamUpsertSchema = z.object({
  slug: z.string().min(2),
  fullName: z.string().min(2),
  jerseyNo: z.string().optional().nullable(),
  position: z.string().min(1),
  team: z.string().min(1),
  bioHtml: z.string().optional().nullable(),
  funFact: z.string().optional().nullable(),
  portraitId: z.string().optional().nullable(),
  isStaff: z.boolean().optional(),
});

adminRouter.get("/team", async (_req, res, next) => {
  try {
    const items = await prisma.teamMember.findMany({ orderBy: [{ isStaff: "asc" }, { team: "asc" }, { position: "asc" }], take: 400 });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/team", async (req, res, next) => {
  try {
    const body = TeamUpsertSchema.parse(req.body);
    const item = await prisma.teamMember.create({ data: { ...body, isStaff: body.isStaff ?? false } });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/team/:id", async (req, res, next) => {
  try {
    const body = TeamUpsertSchema.partial().parse(req.body);
    const item = await prisma.teamMember.update({ where: { id: req.params.id }, data: body });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/team/:id", async (req, res, next) => {
  try {
    await prisma.teamMember.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// -------------------- Sponsors --------------------
const SponsorSchema = z.object({
  name: z.string().min(1),
  tier: z.string().min(1),
  website: z.string().url().optional().nullable(),
  logoId: z.string().optional().nullable(),
  sort: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

adminRouter.get("/sponsors", async (_req, res, next) => {
  try {
    const items = await prisma.sponsor.findMany({ orderBy: [{ tier: "asc" }, { sort: "asc" }], include: { logo: true } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/sponsors", async (req, res, next) => {
  try {
    const body = SponsorSchema.parse(req.body);
    const item = await prisma.sponsor.create({ data: { ...body, sort: body.sort ?? 0, isActive: body.isActive ?? true } });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/sponsors/:id", async (req, res, next) => {
  try {
    const body = SponsorSchema.partial().parse(req.body);
    const item = await prisma.sponsor.update({ where: { id: req.params.id }, data: body });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/sponsors/:id", async (req, res, next) => {
  try {
    await prisma.sponsor.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// -------------------- Products --------------------
const ProductSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0),
  currency: z.string().min(3).optional(),
  isActive: z.boolean().optional(),
  heroMediaId: z.string().optional().nullable(),
});

adminRouter.get("/products", async (_req, res, next) => {
  try {
    const items = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, include: { heroMedia: true }, take: 300 });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/products", async (req, res, next) => {
  try {
    const body = ProductSchema.parse(req.body);
    const item = await prisma.product.create({ data: { ...body, currency: body.currency || "KES", isActive: body.isActive ?? true } });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/products/:id", async (req, res, next) => {
  try {
    const body = ProductSchema.partial().parse(req.body);
    const item = await prisma.product.update({ where: { id: req.params.id }, data: body });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/products/:id", async (req, res, next) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// -------------------- Settings / FAQs / Highlights --------------------
adminRouter.get("/settings", async (_req, res, next) => {
  try {
    const settings = await prisma.siteSetting.findUnique({ where: { id: "global" } });
    res.json({ settings });
  } catch (e) {
    next(e);
  }
});

const SettingsSchema = z.object({
  clubName: z.string().min(2).optional(),
  tagline: z.string().optional().nullable(),
  foundedYear: z.number().int().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  stadium: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  heroTitle: z.string().optional().nullable(),
  heroSubtitle: z.string().optional().nullable(),
  heroMediaId: z.string().optional().nullable(),
});

adminRouter.put("/settings", async (req, res, next) => {
  try {
    const body = SettingsSchema.parse(req.body);
    const settings = await prisma.siteSetting.upsert({
      where: { id: "global" },
      update: body,
      create: { id: "global", clubName: body.clubName || "Your Club", ...body },
    });
    res.json({ settings });
  } catch (e) {
    next(e);
  }
});

const FAQSchema = z.object({
  question: z.string().min(2),
  answerHtml: z.string().min(1),
  sort: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

adminRouter.get("/faqs", async (_req, res, next) => {
  try {
    const items = await prisma.fAQ.findMany({ orderBy: { sort: "asc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/faqs", async (req, res, next) => {
  try {
    const body = FAQSchema.parse(req.body);
    const item = await prisma.fAQ.create({ data: { ...body, sort: body.sort ?? 0, isActive: body.isActive ?? true } });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/faqs/:id", async (req, res, next) => {
  try {
    const body = FAQSchema.partial().parse(req.body);
    const item = await prisma.fAQ.update({ where: { id: req.params.id }, data: body });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/faqs/:id", async (req, res, next) => {
  try {
    await prisma.fAQ.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

const HighlightSchema = z.object({
  title: z.string().min(2),
  // For uploaded videos this will be a public URL like http://localhost:4000/media/...
  // Accept both absolute and relative paths.
  videoUrl: z.string().min(1),
  durationSec: z.number().int().optional().nullable(),
  publishedAt: z.coerce.date().optional().nullable(),
  thumbnailId: z.string().optional().nullable(),
  sort: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

adminRouter.get("/highlights", async (_req, res, next) => {
  try {
    const items = await prisma.highlight.findMany({ orderBy: [{ sort: "asc" }, { createdAt: "desc" }], include: { thumbnail: true } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

adminRouter.post("/highlights", async (req, res, next) => {
  try {
    const body = HighlightSchema.parse(req.body);
    const item = await prisma.highlight.create({ data: { ...body, sort: body.sort ?? 0, isActive: body.isActive ?? true } });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.put("/highlights/:id", async (req, res, next) => {
  try {
    const body = HighlightSchema.partial().parse(req.body);
    const item = await prisma.highlight.update({ where: { id: req.params.id }, data: body });
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

adminRouter.delete("/highlights/:id", async (req, res, next) => {
  try {
    await prisma.highlight.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
