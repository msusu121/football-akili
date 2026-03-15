import { Router, type Request, type Response, type NextFunction } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const ticketsRouter = Router();

const NAIROBI_OFFSET_HOURS = 3;
const NAIROBI_OFFSET_MS = NAIROBI_OFFSET_HOURS * 60 * 60 * 1000;
const NAIROBI_OFFSET_SUFFIX = "+03:00";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * DB stores naive Nairobi wall time like:
 *   2026-03-15 15:00:00
 * We preserve the same clock fields and explicitly attach +03:00.
 */
function dbNaiveDateToNairobiIso(value?: Date | string | null): string | null {
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

function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  const base =
    process.env.ASSETS_PUBLIC_URL ||
    process.env.PUBLIC_MEDIA_BASE_URL ||
    process.env.S3_PUBLIC_BASE_URL ||
    "";
  return base ? `${base.replace(/\/+$/g, "")}/${String(path).replace(/^\/+/g, "")}` : path;
}

function opponentLogoUrl(asset?: { path?: string | null; publicUrl?: string | null; url?: string | null } | null) {
  if (!asset) return null;
  if (asset.publicUrl && String(asset.publicUrl).trim()) return String(asset.publicUrl).trim();
  if (asset.url && String(asset.url).trim()) return String(asset.url).trim();
  return mediaUrl(asset.path ?? null);
}

function mapPublicMatch(
  match: any,
  clubName: string,
  clubLogoUrl: string | null
) {
  const isHome = Boolean(match?.isHome);
  const opponent = match?.opponent || "Opponent";
  const oppLogoUrl = opponentLogoUrl(match?.opponentLogo);

  const kickoffIso = dbNaiveDateToNairobiIso(match?.kickoffAt ?? null);

  const homeTeamName = isHome ? clubName : opponent;
  const awayTeamName = isHome ? opponent : clubName;

  const homeTeamLogo = isHome ? clubLogoUrl : oppLogoUrl;
  const awayTeamLogo = isHome ? oppLogoUrl : clubLogoUrl;

  return {
    id: match.id,
    kickoff: kickoffIso,
    date: kickoffIso,
    scheduledAt: kickoffIso,
    competitionName: match.competition ?? null,
    league: match.competition ?? null,
    season: match.season ?? null,
    venue: match.venue ?? null,
    status: match.status ?? null,
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    isHome,
    opponent,
    opponentLogoUrl: oppLogoUrl,
    homeTeamName,
    awayTeamName,
    homeTeamLogo,
    awayTeamLogo,
    ticketEventId: match.ticketEvent?.id ?? null,
    ticketUrl: match.ticketEvent?.id ? `/tickets/${match.ticketEvent.id}` : null,
    hasTickets: !!match.ticketEvent?.id,
  };
}

function mapTicketTier(t: any) {
  return {
    id: t.id,
    name: t.name,
    price: t.price,
    capacity: t.capacity,
    sold: t.sold,
    createdAt: t.createdAt,
  };
}

function mapTicketEvent(event: any, clubName: string, clubLogoUrl: string | null) {
  return {
    id: event.id,
    title: event.title,
    currency: event.currency,
    salesOpenAt: dbNaiveDateToNairobiIso(event.salesOpenAt),
    salesCloseAt: dbNaiveDateToNairobiIso(event.salesCloseAt),
    isActive: event.isActive,
    ticketUrl: `/tickets/${event.id}`,
    match: event.match ? mapPublicMatch(
      {
        ...event.match,
        ticketEvent: { id: event.id },
      },
      clubName,
      clubLogoUrl
    ) : null,
    tiers: Array.isArray(event.tiers) ? event.tiers.map(mapTicketTier) : [],
  };
}

async function getClubBrand() {
  const settings = await prisma.siteSetting.findUnique({
    where: { id: "global" },
    include: { headerLogo: true },
  });

  return {
    clubName: settings?.clubName || "Mombasa United",
    clubLogoUrl: settings?.headerLogo?.path ? mediaUrl(settings.headerLogo.path) : null,
  };
}

/**
 * Featured events for tickets landing page
 * GET /tickets/events/featured
 */
ticketsRouter.get("/events/featured", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbNow = nowForNaiveNairobiDb();
    const { clubName, clubLogoUrl } = await getClubBrand();

    const events = await prisma.ticketEvent.findMany({
      where: {
        isActive: true,
        salesCloseAt: { gt: dbNow },
      },
      orderBy: [
        { salesOpenAt: "asc" },
      ],
      include: {
        match: {
          include: {
            opponentLogo: true,
          },
        },
        tiers: {
          orderBy: { price: "asc" },
        },
      },
      take: 12,
    });

    res.json({
      items: events.map((e) => mapTicketEvent(e, clubName, clubLogoUrl)),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Optional: all active upcoming events
 * GET /tickets/events
 */
ticketsRouter.get("/events", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const dbNow = nowForNaiveNairobiDb();
    const { clubName, clubLogoUrl } = await getClubBrand();

    const events = await prisma.ticketEvent.findMany({
      where: {
        isActive: true,
        salesCloseAt: { gt: dbNow },
      },
      orderBy: [
        { salesOpenAt: "asc" },
      ],
      include: {
        match: {
          include: {
            opponentLogo: true,
          },
        },
        tiers: {
          orderBy: { price: "asc" },
        },
      },
    });

    res.json({
      items: events.map((e) => mapTicketEvent(e, clubName, clubLogoUrl)),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * Single event page
 * GET /tickets/events/:id
 */
ticketsRouter.get("/events/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clubName, clubLogoUrl } = await getClubBrand();

    const event = await prisma.ticketEvent.findUnique({
      where: { id: req.params.id },
      include: {
        match: {
          include: {
            opponentLogo: true,
          },
        },
        tiers: {
          orderBy: { price: "asc" },
        },
      },
    });

    if (!event || !event.isActive) {
      throw Object.assign(new Error("Not found"), { status: 404 });
    }

    res.json({
      event: mapTicketEvent(event, clubName, clubLogoUrl),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * My tickets
 * GET /tickets/me
 */
ticketsRouter.get("/me", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { clubName, clubLogoUrl } = await getClubBrand();

    const tickets = await prisma.ticket.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: {
          include: {
            match: {
              include: {
                opponentLogo: true,
              },
            },
          },
        },
        tier: true,
      },
      take: 50,
    });

    res.json({
      items: tickets.map((t) => ({
        id: t.id,
        status: t.status,
        quantity: t.quantity,
        total: t.total,
        code: t.code,
        qrDataUrl: t.qrDataUrl,
        createdAt: t.createdAt,
        tier: t.tier
          ? {
              id: t.tier.id,
              name: t.tier.name,
              price: t.tier.price,
              capacity: t.tier.capacity,
              sold: t.tier.sold,
            }
          : null,
        event: t.event
          ? mapTicketEvent(t.event, clubName, clubLogoUrl)
          : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});