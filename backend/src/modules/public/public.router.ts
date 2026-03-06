import { Router } from "express";
import { prisma } from "../../lib/prisma.js";

export const publicRouter = Router();

function withMediaUrl(asset: any) {
  if (!asset) return null;
  const base =
    process.env.ASSETS_PUBLIC_URL ||
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
  } catch (e) {
    next(e);
  }
});

publicRouter.get("/faqs", async (_req, res, next) => {
  try {
    const items = await prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { sort: "asc" } });
    res.json({ items });
  } catch (e) {
    next(e);
  }
});




function mediaUrl(path?: string | null) {
  if (!path) return null;
  const base = process.env.ASSETS_PUBLIC_URL || process.env.S3_PUBLIC_BASE_URL || "";
  return base ? `${base}/${path}` : path;
}

function mapSponsors(items: any[]) {
  return (items || []).map((s) => ({
    name: s.name,
    url: s.website || s.url || null,
    tier: s.tier,
    logoUrl: mediaUrl(s.logo?.path),
  }));
}

function mapSocials(items: any[]) {
  return (items || []).map((x) => ({
    platform: x.platform,
    url: x.url,
  }));
}

function mapSettings(s: any) {
  if (!s) return null;
  return {
    clubName: s.clubName,
    ticketsUrl: s.ticketsUrl,
    membershipUrl: s.membershipUrl,
    shopUrl: s.shopUrl,

    // preserve your existing logo fields shape
    headerLogo: s.headerLogo ? { url: mediaUrl(s.headerLogo.path) } : null,
    partnerLogo: s.partnerLogo ? { url: mediaUrl(s.partnerLogo.path) } : null,
    partnerName: s.partnerName || null,
  };
}

function mapMatch(m: any, clubName: string, clubLogoUrl?: string | null) {
  const isHome = !!m.isHome;

  const homeTeamName = isHome ? clubName : m.opponent;
  const awayTeamName = isHome ? m.opponent : clubName;

  const homeTeamLogo = isHome ? clubLogoUrl : null;
  const awayTeamLogo = isHome ? null : clubLogoUrl;

  return {
    id: m.id,
    kickoff: m.kickoffAt?.toISOString?.() ?? m.kickoffAt,
    competitionName: m.competition,
    season: m.season,
    venue: m.venue || null,

    status: m.status, // SCHEDULED | FT | etc
    homeScore: m.homeScore,
    awayScore: m.awayScore,

    homeTeamName,
    awayTeamName,
    homeTeamLogo,
    awayTeamLogo,

    // your UI uses ticketsUrl from settings, but we still return linkage
    ticketEventId: m.ticketEvent?.id || null,
  };
}

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

    const now = new Date();

    const [upcoming, results] = await Promise.all([
      prisma.match.findMany({
        where: {
          ...seasonWhere,
          kickoffAt: { gte: now },
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

    // ✅ League table (DB if you add models below)
    let leagueTable: any[] = [];
    try {
      const snap = await prisma.leagueTableSnapshot.findFirst({
        where: { ...(season ? { season } : {}) },
        orderBy: { asOfDate: "desc" },
        include: { rows: { orderBy: { position: "asc" } } },
      });

      if (snap?.rows?.length) {
        leagueTable = snap.rows.map((r: any) => ({
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
      // table models not installed yet → keep empty
    }

    // ─────────────────────────────────────────────────────────────
    // ✅ MATCHDAY FIXTURE (persistent): LIVE → inferred-live → next
    // ─────────────────────────────────────────────────────────────
    const LIVE_STATUSES = ["LIVE", "IN_PROGRESS"];
    const FINISHED_STATUSES = ["FT", "FULL_TIME", "COMPLETED"];
    const INACTIVE_STATUSES = ["POSTPONED", "CANCELLED", "CANCELED", "ABANDONED", "SUSPENDED"];

    // 1) Prefer explicit LIVE status (avoid showing old match forever: cap to last 24h)
    const liveSince = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const liveMatch = await prisma.match.findFirst({
      where: {
        ...seasonWhere,
        kickoffAt: { gte: liveSince, lte: now },
        status: { in: LIVE_STATUSES },
      },
      orderBy: { kickoffAt: "desc" },
      include: { ticketEvent: true },
    });

    // 2) If no LIVE status provided, infer in-progress by time window
    //    (kickoff happened recently, and not finished/postponed/cancelled)
    const INFER_LIVE_MINUTES = 210; // 3h30m (safe for stoppage/halftime delays)
    const inferSince = new Date(now.getTime() - INFER_LIVE_MINUTES * 60 * 1000);

    const inferredLiveMatch =
      liveMatch ||
      (await prisma.match.findFirst({
        where: {
          ...seasonWhere,
          kickoffAt: { gte: inferSince, lte: now },
          status: {
            notIn: [...FINISHED_STATUSES, ...INACTIVE_STATUSES],
          },
        },
        orderBy: { kickoffAt: "desc" },
        include: { ticketEvent: true },
      }));

    // 3) Else fallback to next upcoming
    const matchdayRaw = inferredLiveMatch || upcoming[0] || null;

    const upcomingFixtures = upcoming.map((m) => mapMatch(m, clubName, clubLogoUrl));
    const pastResults = results.map((m) => mapMatch(m, clubName, clubLogoUrl));

    const next = upcomingFixtures[0] || null;

    const countdownSeconds =
      next?.kickoff
        ? Math.max(0, Math.floor((new Date(next.kickoff).getTime() - now.getTime()) / 1000))
        : null;

    // Map the matchday fixture into the exact frontend shape (kickoff/homeTeamName/etc)
    const matchdayFixture = matchdayRaw ? mapMatch(matchdayRaw, clubName, clubLogoUrl) : null;

    res.json({
      settings,
      socials: mapSocials(socialsRaw),
      sponsors: mapSponsors(sponsorsRaw),

      upcomingFixtures,
      results: pastResults,
      leagueTable,

      nextFixture: next,
      matchdayFixture, // ✅ NEW: always present during LIVE or near kickoff
      countdownSeconds,
    });
  } catch (e) {
    next(e);
  }
});