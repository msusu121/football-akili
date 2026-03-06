import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const publicRouter = Router();

const NAIROBI_OFFSET_HOURS = 3;
const NAIROBI_OFFSET_MS = NAIROBI_OFFSET_HOURS * 60 * 60 * 1000;
const NAIROBI_OFFSET_SUFFIX = "+03:00";

function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Your DB is currently being treated like "naive Nairobi wall time".
 *
 * Example of what is happening now:
 * - DB stores: 2026-03-07 15:00:00   (no timezone)
 * - Prisma/JS reads it as a Date
 * - toISOString() turns it into something with Z
 * - frontend reads that as UTC and displays +3h ahead in Kenya
 *
 * This function fixes that by preserving the same clock fields
 * and attaching +03:00 explicitly.
 *
 * Example:
 *   DB Date object representing "2026-03-07 15:00:00"
 *   -> "2026-03-07T15:00:00+03:00"
 */
function dbNaiveDateToNairobiIso(value) {
  if (!value) return null;

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const yyyy = d.getUTCFullYear();
  const mm = pad2(d.getUTCMonth() + 1);
  const dd = pad2(d.getUTCDate());
  const hh = pad2(d.getUTCHours());
  const mi = pad2(d.getUTCMinutes());
  const ss = pad2(d.getUTCSeconds());

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${NAIROBI_OFFSET_SUFFIX}`;
}

/**
 * Because your DB kickoffAt is stored as timezone-less Nairobi wall time,
 * comparisons must use the same convention.
 *
 * Real Nairobi time now:
 *   2026-03-06 14:00 EAT
 * Absolute UTC now:
 *   2026-03-06 11:00Z
 *
 * But DB naive value for 14:00 Nairobi behaves like:
 *   2026-03-06 14:00:00 (read as if it were UTC-ish)
 *
 * So for DB comparisons we shift "now" by +3 hours.
 */
function nowForNaiveNairobiDb() {
  return new Date(Date.now() + NAIROBI_OFFSET_MS);
}

function withMediaUrl(asset) {
  if (!asset) return null;
  const base =
    process.env.ASSETS_PUBLIC_URL ||
    process.env.PUBLIC_MEDIA_BASE_URL ||
    process.env.S3_PUBLIC_BASE_URL ||
    "";
  return { ...asset, url: base ? `${base}/${asset.path}` : asset.path };
}

function mediaUrl(path) {
  if (!path) return null;
  const base = process.env.ASSETS_PUBLIC_URL || process.env.S3_PUBLIC_BASE_URL || "";
  return base ? `${base}/${path}` : path;
}

function mapSponsors(items) {
  return (items || []).map((s) => ({
    name: s.name,
    url: s.website || s.url || null,
    tier: s.tier,
    logoUrl: mediaUrl(s.logo?.path),
  }));
}

function mapSocials(items) {
  return (items || []).map((x) => ({
    platform: x.platform,
    url: x.url,
  }));
}

function mapSettings(s) {
  if (!s) return null;

  return {
    clubName: s.clubName,
    ticketsUrl: s.ticketsUrl,
    membershipUrl: s.membershipUrl,
    shopUrl: s.shopUrl,
    headerLogo: s.headerLogo ? { url: mediaUrl(s.headerLogo.path) } : null,
    partnerLogo: s.partnerLogo ? { url: mediaUrl(s.partnerLogo.path) } : null,
    partnerName: s.partnerName || null,
  };
}

function mapMatch(m, clubName, clubLogoUrl) {
  const isHome = !!m.isHome;

  const homeTeamName = isHome ? clubName : m.opponent;
  const awayTeamName = isHome ? m.opponent : clubName;

  const homeTeamLogo = isHome ? clubLogoUrl : null;
  const awayTeamLogo = isHome ? null : clubLogoUrl;

  return {
    id: m.id,
    kickoff: dbNaiveDateToNairobiIso(m.kickoffAt),
    competitionName: m.competition,
    season: m.season,
    venue: m.venue || null,

    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,

    homeTeamName,
    awayTeamName,
    homeTeamLogo,
    awayTeamLogo,

    ticketEventId: m.ticketEvent?.id || null,
  };
}

publicRouter.get("/home", async (_req, res, next) => {
  try {
    const dbNow = nowForNaiveNairobiDb();

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

    const socials = await prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: { sort: "asc" },
    });

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

    const nextMatchRaw = await prisma.match.findFirst({
      where: { kickoffAt: { gt: dbNow } },
      orderBy: { kickoffAt: "asc" },
    });

    const nextMatch = nextMatchRaw
      ? {
          ...nextMatchRaw,
          kickoffAt: dbNaiveDateToNairobiIso(nextMatchRaw.kickoffAt),
        }
      : null;

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

      latestNews: latestNews.map((n) => ({
        ...n,
        heroMedia: withMediaUrl(n.heroMedia),
      })),

      nextMatch,

      sponsors: sponsors.map((s) => ({
        ...s,
        logo: withMediaUrl(s.logo),
      })),

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
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/faqs", async (_req, res, next) => {
  try {
    const items = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { sort: "asc" },
    });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/fixtures", async (req, res, next) => {
  try {
    const season = typeof req.query.season === "string" ? req.query.season.trim() : "";
    const seasonWhere = season ? { season } : {};

    const [settingsRaw, socialsRaw, sponsorsRaw] = await Promise.all([
      prisma.siteSetting.findUnique({
        where: { id: "global" },
        include: { headerLogo: true, partnerLogo: true },
      }),
      prisma.socialLink.findMany({
        where: { isActive: true },
        orderBy: { sort: "asc" },
      }),
      prisma.sponsor.findMany({
        where: { isActive: true },
        orderBy: { sort: "asc" },
        include: { logo: true },
      }),
    ]);

    const settings = mapSettings(settingsRaw);
    const clubName = settings?.clubName || "Mombasa United";
    const clubLogoUrl = settings?.headerLogo?.url || null;

    const dbNow = nowForNaiveNairobiDb();

    const [upcoming, results] = await Promise.all([
      prisma.match.findMany({
        where: {
          ...seasonWhere,
          kickoffAt: { gte: dbNow },
          status: { not: "FT" },
        },
        orderBy: { kickoffAt: "asc" },
        take: 120,
        include: { ticketEvent: true },
      }),
      prisma.match.findMany({
        where: {
          ...seasonWhere,
          status: "FT",
        },
        orderBy: { kickoffAt: "desc" },
        take: 120,
        include: { ticketEvent: true },
      }),
    ]);

    let leagueTable = [];

    try {
      const snap = await prisma.leagueTableSnapshot.findFirst({
        where: { ...(season ? { season } : {}) },
        orderBy: { asOfDate: "desc" },
        include: { rows: { orderBy: { position: "asc" } } },
      });

      if (snap?.rows?.length) {
        leagueTable = snap.rows.map((r) => ({
          position: r.position,
          teamName: r.teamName,
          played: r.played,
          won: r.won,
          drawn: r.drawn,
          lost: r.lost,
          goalsFor: r.goalsFor,
          goalsAgainst: r.goalsAgainst,
          goalDifference: r.goalDifference,
          points: r.points,
          logoUrl: r.logoUrl || null,
        }));
      }
    } catch {
      // keep empty until installed
    }

    const upcomingFixtures = upcoming.map((m) => mapMatch(m, clubName, clubLogoUrl));
    const pastResults = results.map((m) => mapMatch(m, clubName, clubLogoUrl));

    const next = upcomingFixtures[0] || null;
    const countdownSeconds = next?.kickoff
      ? Math.max(0, Math.floor((new Date(next.kickoff).getTime() - Date.now()) / 1000))
      : null;

    res.json({
      settings,
      socials: mapSocials(socialsRaw),
      sponsors: mapSponsors(sponsorsRaw),

      upcomingFixtures,
      results: pastResults,
      leagueTable,

      nextFixture: next,
      countdownSeconds,
    });
  } catch (e) {
    next(e);
  }
});