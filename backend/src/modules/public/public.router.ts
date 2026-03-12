import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";

export const publicRouter = Router();

const NAIROBI_OFFSET_HOURS = 3;
const NAIROBI_OFFSET_MS = NAIROBI_OFFSET_HOURS * 60 * 60 * 1000;
const NAIROBI_OFFSET_SUFFIX = "+03:00";

type Nullable<T> = T | null | undefined;

type MediaLike = {
  path?: string | null;
  publicUrl?: string | null;
  url?: string | null;
} & Record<string, unknown>;

type SponsorInput = {
  name?: string | null;
  website?: string | null;
  url?: string | null;
  tier?: string | null;
  logo?: Nullable<MediaLike>;
};

type SocialInput = {
  platform?: string | null;
  url?: string | null;
};

type SettingsInput = {
  clubName?: string | null;
  ticketsUrl?: string | null;
  membershipUrl?: string | null;
  shopUrl?: string | null;
  partnerName?: string | null;
  headerLogo?: Nullable<MediaLike>;
  partnerLogo?: Nullable<MediaLike>;
};

type TicketEventLike = {
  id: string;
};

type MatchInput = {
  id: string;
  kickoffAt?: Date | string | null;
  competition?: string | null;
  season?: string | null;
  venue?: string | null;
  status?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  isHome?: boolean | null;
  opponent?: string | null;
  ticketEvent?: Nullable<TicketEventLike>;
  opponentLogo?: Nullable<MediaLike>;
};

type LeagueTableRow = {
  position: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  logoUrl: string | null;
};

type MappedSettings = {
  clubName: string | null;
  ticketsUrl: string | null;
  membershipUrl: string | null;
  shopUrl: string | null;
  headerLogo: { url: string | null } | null;
  partnerLogo: { url: string | null } | null;
  partnerName: string | null;
};

type MappedMatch = {
  id: string;
  kickoff: string | null;
  competitionName: string | null;
  season: string | null;
  venue: string | null;
  status: string | null;
  homeScore: number | null;
  awayScore: number | null;
  isHome: boolean;
  opponent: string | null;
  opponentLogoUrl: string | null;
  homeTeamName: string;
  awayTeamName: string;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
  ticketEventId: string | null;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * DB stores naive Nairobi wall time like:
 *   2025-12-02 12:00:00
 *
 * Prisma/JS reads it as a Date object.
 * We preserve the same clock fields and explicitly attach +03:00.
 */
function dbNaiveDateToNairobiIso(value: Nullable<Date | string>): string | null {
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
 * DB kickoffAt is stored as naive Nairobi wall time.
 * So DB comparisons must use a "naive Nairobi now".
 */
function nowForNaiveNairobiDb(): Date {
  return new Date(Date.now() + NAIROBI_OFFSET_MS);
}

function withMediaUrl<T extends MediaLike>(asset: Nullable<T>): (T & { url: string }) | null {
  if (!asset) return null;

  const base =
    process.env.ASSETS_PUBLIC_URL ||
    process.env.PUBLIC_MEDIA_BASE_URL ||
    process.env.S3_PUBLIC_BASE_URL ||
    "";

  const path = typeof asset.path === "string" ? asset.path : "";
  return {
    ...asset,
    url: base && path ? `${base}/${path}` : path,
  };
}

function mediaUrl(path: Nullable<string>): string | null {
  if (!path) return null;
  const base = process.env.ASSETS_PUBLIC_URL || process.env.S3_PUBLIC_BASE_URL || "";
  return base ? `${base}/${path}` : path;
}

function opponentLogoUrl(asset: Nullable<MediaLike>): string | null {
  if (!asset) return null;
  if (typeof asset.publicUrl === "string" && asset.publicUrl.trim()) {
    return asset.publicUrl.trim();
  }
  if (typeof asset.url === "string" && asset.url.trim()) {
    return asset.url.trim();
  }
  return mediaUrl(asset.path ?? null);
}

function mapSponsors(items: Nullable<readonly SponsorInput[]>): Array<{
  name: string | null;
  url: string | null;
  tier: string | null;
  logoUrl: string | null;
}> {
  return (items ?? []).map((s) => ({
    name: s.name ?? null,
    url: s.website ?? s.url ?? null,
    tier: s.tier ?? null,
    logoUrl: mediaUrl(s.logo?.path ?? null),
  }));
}

function mapSocials(items: Nullable<readonly SocialInput[]>): Array<{
  platform: string | null;
  url: string | null;
}> {
  return (items ?? []).map((x) => ({
    platform: x.platform ?? null,
    url: x.url ?? null,
  }));
}

function mapSettings(s: Nullable<SettingsInput>): MappedSettings | null {
  if (!s) return null;

  return {
    clubName: s.clubName ?? null,
    ticketsUrl: s.ticketsUrl ?? null,
    membershipUrl: s.membershipUrl ?? null,
    shopUrl: s.shopUrl ?? null,
    headerLogo: s.headerLogo ? { url: mediaUrl(s.headerLogo.path ?? null) } : null,
    partnerLogo: s.partnerLogo ? { url: mediaUrl(s.partnerLogo.path ?? null) } : null,
    partnerName: s.partnerName ?? null,
  };
}

function mapMatch(m: MatchInput, clubName: string, clubLogoUrl: string | null): MappedMatch {
  const isHome = Boolean(m.isHome);
  const opponent = m.opponent || "Opponent";
  const oppLogoUrl = opponentLogoUrl(m.opponentLogo);

  const homeTeamName = isHome ? clubName : opponent;
  const awayTeamName = isHome ? opponent : clubName;

  const homeTeamLogo = isHome ? clubLogoUrl : null;
  const awayTeamLogo = isHome ? null : clubLogoUrl;

  return {
    id: m.id,
    kickoff: dbNaiveDateToNairobiIso(m.kickoffAt ?? null),
    competitionName: m.competition ?? null,
    season: m.season ?? null,
    venue: m.venue ?? null,
    status: m.status ?? null,
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    isHome,
    opponent,
    opponentLogoUrl: oppLogoUrl,
    homeTeamName,
    awayTeamName,
    homeTeamLogo,
    awayTeamLogo,
    ticketEventId: m.ticketEvent?.id ?? null,
  };
}

publicRouter.get("/home", async (_req: Request, res: Response, next: NextFunction) => {
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

    const nextMatch =
      nextMatchRaw != null
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

publicRouter.get("/faqs", async (_req: Request, res: Response, next: NextFunction) => {
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

publicRouter.get("/fixtures", async (req: Request, res: Response, next: NextFunction) => {
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
        include: {
          ticketEvent: true,
          opponentLogo: true,
        },
      }),
      prisma.match.findMany({
        where: {
          ...seasonWhere,
          status: "FT",
        },
        orderBy: { kickoffAt: "desc" },
        take: 120,
        include: {
          ticketEvent: true,
          opponentLogo: true,
        },
      }),
    ]);

    let leagueTable: LeagueTableRow[] = [];
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
          logoUrl: r.logoUrl ?? null,
        }));
      }
    } catch {
      leagueTable = [];
    }

    const LIVE_STATUSES = ["LIVE", "IN_PROGRESS"];
    const FINISHED_STATUSES = ["FT", "FULL_TIME", "COMPLETED"];
    const INACTIVE_STATUSES = ["POSTPONED", "CANCELLED", "CANCELED", "ABANDONED", "SUSPENDED"];

    const liveSince = new Date(dbNow.getTime() - 24 * 60 * 60 * 1000);

    const liveMatch = await prisma.match.findFirst({
      where: {
        ...seasonWhere,
        kickoffAt: { gte: liveSince, lte: dbNow },
        status: { in: LIVE_STATUSES as any },
      },
      orderBy: { kickoffAt: "desc" },
      include: {
        ticketEvent: true,
        opponentLogo: true,
      },
    });

    const INFER_LIVE_MINUTES = 135;
    const inferSince = new Date(dbNow.getTime() - INFER_LIVE_MINUTES * 60 * 1000);

    const inferredLiveMatch =
      liveMatch ||
      (await prisma.match.findFirst({
        where: {
          ...seasonWhere,
          kickoffAt: { gte: inferSince, lte: dbNow },
          status: { notIn: [...FINISHED_STATUSES, ...INACTIVE_STATUSES] as any },
        },
        orderBy: { kickoffAt: "desc" },
        include: {
          ticketEvent: true,
          opponentLogo: true,
        },
      }));

    const matchdayRaw = inferredLiveMatch || upcoming[0] || null;

    const upcomingFixtures = upcoming.map((m) => mapMatch(m, clubName, clubLogoUrl));
    const pastResults = results.map((m) => mapMatch(m, clubName, clubLogoUrl));

    const next = upcomingFixtures[0] || null;

    const countdownSeconds =
      next?.kickoff != null
        ? Math.max(0, Math.floor((new Date(next.kickoff).getTime() - Date.now()) / 1000))
        : null;

    const matchdayFixture = matchdayRaw ? mapMatch(matchdayRaw, clubName, clubLogoUrl) : null;

    console.log("[fixtures] dbNow:", dbNow.toISOString());
    console.log("[fixtures] liveMatch:", liveMatch?.id, liveMatch?.kickoffAt, liveMatch?.status);
    console.log(
      "[fixtures] inferredLive:",
      inferredLiveMatch?.id,
      inferredLiveMatch?.kickoffAt,
      inferredLiveMatch?.status
    );
    console.log("[fixtures] matchdayRaw:", matchdayRaw?.id, matchdayRaw?.kickoffAt, matchdayRaw?.status);

    res.json({
      settings,
      socials: mapSocials(socialsRaw),
      sponsors: mapSponsors(sponsorsRaw),
      upcomingFixtures,
      results: pastResults,
      leagueTable,
      nextFixture: next,
      matchdayFixture,
      countdownSeconds,
    });
  } catch (e) {
    next(e);
  }
});

// ===============================
// PUBLIC ADS
// GET /public/ads?placement=HEADER_TOP
// ===============================
publicRouter.get("/ads", async (req, res, next) => {
  try {
    const placement = typeof req.query.placement === "string" ? req.query.placement.trim() : "";

    const now = new Date();

    const where: any = {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    };

    if (placement) where.placement = placement;

    const ads = await prisma.adBanner.findMany({
      where,
      orderBy: [{ placement: "asc" }, { sort: "asc" }, { createdAt: "desc" }],
      include: { media: true },
      take: 50,
    });

    const publicMediaBase =
      process.env.S3_PUBLIC_BASE_URL ||
      process.env.PUBLIC_MEDIA_BASE_URL ||
      "http://localhost:4000/media";

    function mediaUrl(asset: any | null) {
      if (!asset?.path) return null;
      const p = String(asset.path).trim();
      if (!p) return null;
      if (p.startsWith("http://") || p.startsWith("https://")) return p;
      return `${publicMediaBase.replace(/\/+$/g, "")}/${p.replace(/^\/+/g, "")}`;
    }

    const items = ads.map((a) => ({
      id: a.id,
      title: a.title,
      placement: a.placement,
      href: a.href || null,
      ctaLabel: a.ctaLabel || null,
      imageUrl: mediaUrl(a.media),
      startsAt: a.startsAt ? a.startsAt.toISOString() : null,
      endsAt: a.endsAt ? a.endsAt.toISOString() : null,
      sort: a.sort,
    }));

    const grouped = items.reduce((acc: any, it: any) => {
      acc[it.placement] = acc[it.placement] || [];
      acc[it.placement].push(it);
      return acc;
    }, {});

    res.json({ items, grouped });
  } catch (e) {
    next(e);
  }
});