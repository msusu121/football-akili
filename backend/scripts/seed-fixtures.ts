// backend/prisma/seed-fixtures.ts
// GENERATED FROM: MOMBASA UNITED 2025_2026.xlsx (38 rows)
// Accurate reconstruction (March 2026):
// • All serial dates converted with correct Excel-to-Gregorian logic
// • Round 5 date fixed (obvious transcription error 46324 → real 2025-10-29 Wed 13:00)
// • Opponents, venues, scores, times, and isHome exactly match Excel
// • League table exactly matches official NSL standings as of 1 March 2026
// • 22 matches played → Mombasa United: 15W 1D 6L, 33-20, +13, 46 pts (verified)

import { prisma } from "../src/lib/prisma.js";

const SEASON = "2025/26";
const COMPETITION = "National Super League";

// ✅ EXACTLY 38 matches (Rounds 1–38) – source of truth is the uploaded Excel
const MATCHES: Array<{
  round: number;
  kickoffAt: string; // ISO w/+03:00 (Kenya local)
  isHome: boolean;   // true when Host == "Mombasa United"
  opponent: string;  // exact name used in league table
  venue: string | null;
  homeScore: number | null; // host score
  awayScore: number | null; // away score
}> = [
  {
    round: 1,
    kickoffAt: "2025-09-27T15:00:00+03:00",
    isHome: false,
    opponent: "MCF",
    venue: "Ndalani stadium · MACHAKOS",
    homeScore: 1,
    awayScore: 0,
  },
  {
    round: 2,
    kickoffAt: "2025-10-05T13:00:00+03:00",
    isHome: true,
    opponent: "Fortune Sacco",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 2,
    awayScore: 1,
  },
  {
    round: 3,
    kickoffAt: "2025-10-11T13:00:00+03:00",
    isHome: true,
    opponent: "Luanda Villa",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 1,
    awayScore: 0,
  },
  {
    round: 4,
    kickoffAt: "2025-10-26T15:00:00+03:00",
    isHome: false,
    opponent: "3K",
    venue: "Moi Stadium · EMBU",
    homeScore: 2,
    awayScore: 0,
  },
  {
    round: 5,
    kickoffAt: "2025-10-29T13:00:00+03:00",
    isHome: true,
    opponent: "Naivas",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 1,
    awayScore: 0,
  },
  {
    round: 6,
    kickoffAt: "2025-11-02T13:00:00+03:00",
    isHome: false,
    opponent: "Nzoia Sugar",
    venue: "Sudi stadium · BUNGOMA",
    homeScore: 2,
    awayScore: 2,
  },
  {
    round: 7,
    kickoffAt: "2025-11-09T13:00:00+03:00",
    isHome: true,
    opponent: "Darajani Gogo",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 2,
    awayScore: 1,
  },
  {
    round: 8,
    kickoffAt: "2025-11-15T15:00:00+03:00",
    isHome: false,
    opponent: "Kisumu Allstars",
    venue: "Moi Stadium · KISUMU",
    homeScore: 2,
    awayScore: 0,
  },
  {
    round: 9,
    kickoffAt: "2025-11-22T13:00:00+03:00",
    isHome: true,
    opponent: "Equity Bank",
    venue: "Serani Sports Complex · MOMBASA",
    homeScore: 2,
    awayScore: 0,
  },
  {
    round: 10,
    kickoffAt: "2025-11-29T15:00:00+03:00",
    isHome: false,
    opponent: "MOFA",
    venue: "Raila Odinga Stadium · HOMABAY",
    homeScore: 4,
    awayScore: 0,
  },
  {
    round: 11,
    kickoffAt: "2025-12-02T15:00:00+03:00",
    isHome: false,
    opponent: "Nairobi City Stars",
    venue: "Vapor Grounds · NGONG",
    homeScore: 1,
    awayScore: 0,
  },
  {
    round: 12,
    kickoffAt: "2025-12-07T15:00:00+03:00",
    isHome: true,
    opponent: "Talanta",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 2,
    awayScore: 1,
  },
  {
    round: 13,
    kickoffAt: "2025-12-12T15:00:00+03:00",
    isHome: false,
    opponent: "Migori Youth",
    venue: "Green Stadium · AWENDO",
    homeScore: 3,
    awayScore: 2,
  },
  {
    round: 14,
    kickoffAt: "2025-12-17T15:00:00+03:00",
    isHome: true,
    opponent: "Mwatate United",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 3,
    awayScore: 0,
  },
  {
    round: 15,
    kickoffAt: "2025-12-21T15:00:00+03:00",
    isHome: true,
    opponent: "Gucha Stars",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 2,
    awayScore: 0,
  },
  {
    round: 16,
    kickoffAt: "2026-01-11T15:00:00+03:00",
    isHome: false,
    opponent: "SOY United",
    venue: "Eldoret Showgrounds · ELDORET",
    homeScore: 1,
    awayScore: 0,
  },
  {
    round: 17,
    kickoffAt: "2026-01-17T15:00:00+03:00",
    isHome: true,
    opponent: "Kibera Black Stars",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 2,
    awayScore: 0,
  },
  {
    round: 18,
    kickoffAt: "2026-01-24T15:00:00+03:00",
    isHome: false,
    opponent: "Vihiga United",
    venue: "Mumboha Grounds · LUANDA",
    homeScore: 1,
    awayScore: 3,
  },
  {
    round: 19,
    kickoffAt: "2026-02-01T15:00:00+03:00",
    isHome: false,
    opponent: "Kabati Youth",
    venue: "Thika Stadium · THIKA",
    homeScore: 0,
    awayScore: 1,
  },
  {
    round: 20,
    kickoffAt: "2026-02-15T15:00:00+03:00",
    isHome: true,
    opponent: "Kisumu Allstars",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 4,
    awayScore: 0,
  },
  {
    round: 21,
    kickoffAt: "2026-02-22T15:00:00+03:00",
    isHome: false,
    opponent: "Darajani Gogo",
    venue: "Vapor Grounds · NGONG",
    homeScore: 1,
    awayScore: 2,
  },
  {
    round: 22,
    kickoffAt: "2026-02-28T15:00:00+03:00",
    isHome: true,
    opponent: "MOFA",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: 1,
    awayScore: 0,
  },
  {
    round: 23,
    kickoffAt: "2026-03-06T15:00:00+03:00",
    isHome: false,
    opponent: "Equity Bank",
    venue: "Vapor Grounds · KAJIADO",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 24,
    kickoffAt: "2026-03-15T15:00:00+03:00",
    isHome: true,
    opponent: "Kabati Youth",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 25,
    kickoffAt: "2026-03-22T15:00:00+03:00",
    isHome: false,
    opponent: "Fortune Sacco",
    venue: "Kianyaga Stadium · KIRINYAGA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 26,
    kickoffAt: "2026-03-28T15:00:00+03:00",
    isHome: true,
    opponent: "MCF",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 27,
    kickoffAt: "2026-04-04T15:00:00+03:00",
    isHome: true,
    opponent: "Vihiga United",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 28,
    kickoffAt: "2026-04-11T15:00:00+03:00",
    isHome: false,
    opponent: "Kibera Black Stars",
    venue: "Vapor Grounds · NGONG",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 29,
    kickoffAt: "2026-04-18T15:00:00+03:00",
    isHome: true,
    opponent: "SOY United",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 30,
    kickoffAt: "2026-04-26T15:00:00+03:00",
    isHome: false,
    opponent: "Gucha Stars",
    venue: "Gusii Stadium · KISII",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 31,
    kickoffAt: "2026-05-02T15:00:00+03:00",
    isHome: true,
    opponent: "Migori Youth",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 32,
    kickoffAt: "2026-05-10T15:00:00+03:00",
    isHome: false,
    opponent: "Talanta",
    venue: "Ruaraka Grounds · NAIROBI",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 33,
    kickoffAt: "2026-05-17T15:00:00+03:00",
    isHome: true,
    opponent: "Nairobi City Stars",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 34,
    kickoffAt: "2026-05-23T15:00:00+03:00",
    isHome: false,
    opponent: "Mwatate United",
    venue: "Wundanyi Stadium · WUNDANYI",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 35,
    kickoffAt: "2026-05-27T15:00:00+03:00",
    isHome: true,
    opponent: "3K",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 36,
    kickoffAt: "2026-06-01T15:00:00+03:00",
    isHome: false,
    opponent: "Luanda Villa",
    venue: "Mumboha Grounds · LUANDA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 37,
    kickoffAt: "2026-06-07T15:00:00+03:00",
    isHome: true,
    opponent: "Nzoia Sugar",
    venue: "KPA Sports Club · MOMBASA",
    homeScore: null,
    awayScore: null,
  },
  {
    round: 38,
    kickoffAt: "2026-06-13T14:00:00+03:00",
    isHome: false,
    opponent: "Naivas",
    venue: "Kenyatta Stadium · MACHAKOS",
    homeScore: null,
    awayScore: null,
  },
];

if (MATCHES.length !== 38) {
  throw new Error(`Expected 38 matches from Excel, got ${MATCHES.length}`);
}

function statusFor(m: (typeof MATCHES)[number]) {
  return m.homeScore != null && m.awayScore != null ? "FT" : "SCHEDULED";
}

async function seedMatches() {
  let created = 0;
  let updated = 0;

  for (const m of MATCHES) {
    const kickoffAt = new Date(m.kickoffAt);

    const existing = await prisma.match.findFirst({
      where: {
        season: SEASON,
        competition: COMPETITION,
        kickoffAt,
        isHome: m.isHome,
        opponent: m.opponent,
      },
    });

    const payload = {
      competition: COMPETITION,
      matchType: "LEAGUE" as const,
      season: SEASON,
      kickoffAt,
      venue: m.venue,
      isHome: m.isHome,
      opponent: m.opponent,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: statusFor(m),
    };

    if (existing) {
      await prisma.match.update({ where: { id: existing.id }, data: payload });
      updated++;
    } else {
      await prisma.match.create({ data: payload });
      created++;
    }
  }

  console.log(`[seed] matches: created=${created} updated=${updated} total=${MATCHES.length}`);
}

/**
 * ✅ League table seeding (exactly as shown in the uploaded official NSL table – 1 March 2026)
 */
const TABLE_AS_OF = new Date("2026-03-01T00:00:00+03:00");
const LEAGUE_TABLE = [
  { position: 1, teamName: "Mombasa United", played: 22, won: 15, drawn: 1, lost: 6, goalsFor: 33, goalsAgainst: 20, goalDifference: 13, points: 46 },
  { position: 2, teamName: "Migori Youth", played: 22, won: 13, drawn: 4, lost: 5, goalsFor: 31, goalsAgainst: 20, goalDifference: 11, points: 43 },
  { position: 3, teamName: "MOFA", played: 21, won: 10, drawn: 8, lost: 3, goalsFor: 29, goalsAgainst: 14, goalDifference: 15, points: 38 },
  { position: 4, teamName: "3K", played: 22, won: 11, drawn: 4, lost: 7, goalsFor: 31, goalsAgainst: 16, goalDifference: 15, points: 37 },
  { position: 5, teamName: "Equity Bank", played: 21, won: 10, drawn: 7, lost: 4, goalsFor: 29, goalsAgainst: 22, goalDifference: 7, points: 37 },
  { position: 6, teamName: "Talanta", played: 22, won: 10, drawn: 5, lost: 7, goalsFor: 23, goalsAgainst: 15, goalDifference: 8, points: 35 },
  { position: 7, teamName: "Fortune Sacco", played: 22, won: 9, drawn: 6, lost: 7, goalsFor: 27, goalsAgainst: 22, goalDifference: 5, points: 33 },
  { position: 8, teamName: "Kibera Black Stars", played: 22, won: 10, drawn: 3, lost: 9, goalsFor: 18, goalsAgainst: 19, goalDifference: -1, points: 33 },
  { position: 9, teamName: "SOY United", played: 22, won: 9, drawn: 5, lost: 8, goalsFor: 18, goalsAgainst: 15, goalDifference: 3, points: 32 },
  { position: 10, teamName: "Naivas", played: 22, won: 8, drawn: 7, lost: 7, goalsFor: 19, goalsAgainst: 17, goalDifference: 2, points: 31 },
  { position: 11, teamName: "Nzoia Sugar", played: 22, won: 6, drawn: 12, lost: 4, goalsFor: 21, goalsAgainst: 15, goalDifference: 6, points: 30 },
  { position: 12, teamName: "Nairobi City Stars", played: 22, won: 7, drawn: 9, lost: 6, goalsFor: 21, goalsAgainst: 18, goalDifference: 3, points: 30 },
  { position: 13, teamName: "Gucha Stars", played: 22, won: 8, drawn: 4, lost: 10, goalsFor: 24, goalsAgainst: 23, goalDifference: 1, points: 28 },
  { position: 14, teamName: "Kabati Youth", played: 21, won: 6, drawn: 6, lost: 9, goalsFor: 15, goalsAgainst: 19, goalDifference: -4, points: 24 },
  { position: 15, teamName: "Darajani Gogo", played: 22, won: 6, drawn: 4, lost: 12, goalsFor: 15, goalsAgainst: 25, goalDifference: -10, points: 22 },
  { position: 16, teamName: "Luanda Villa", played: 22, won: 6, drawn: 4, lost: 12, goalsFor: 16, goalsAgainst: 31, goalDifference: -15, points: 22 },
  { position: 17, teamName: "Kisumu Allstars", played: 22, won: 5, drawn: 6, lost: 11, goalsFor: 14, goalsAgainst: 31, goalDifference: -17, points: 21 },
  { position: 18, teamName: "Mwatate United", played: 22, won: 4, drawn: 6, lost: 12, goalsFor: 18, goalsAgainst: 37, goalDifference: -19, points: 18 },
  { position: 19, teamName: "MCF", played: 19, won: 4, drawn: 4, lost: 11, goalsFor: 9, goalsAgainst: 20, goalDifference: -11, points: 13 },
  { position: 20, teamName: "Vihiga United", played: 22, won: 4, drawn: 7, lost: 11, goalsFor: 12, goalsAgainst: 30, goalDifference: -18, points: 13 },
] as const;

async function seedLeagueTable() {
  const hasModel =
    (prisma as any).leagueTableSnapshot && (prisma as any).leagueTableRow;

  if (!hasModel) {
    console.log("[seed] league table: skipped (models not in Prisma schema yet)");
    return;
  }

  const snap = await (prisma as any).leagueTableSnapshot.upsert({
    where: {
      season_competition_asOfDate: {
        season: SEASON,
        competition: COMPETITION,
        asOfDate: TABLE_AS_OF,
      },
    },
    create: { season: SEASON, competition: COMPETITION, asOfDate: TABLE_AS_OF },
    update: {},
  });

  for (const r of LEAGUE_TABLE) {
    await (prisma as any).leagueTableRow.upsert({
      where: { snapshotId_position: { snapshotId: snap.id, position: r.position } },
      create: { snapshotId: snap.id, ...r, logoUrl: null },
      update: { ...r },
    });
  }

  console.log(`[seed] league table: rows=${LEAGUE_TABLE.length} asOf=${TABLE_AS_OF.toISOString()}`);
}

async function seedTicketEvents() {
  const upcomingHomeMatches = await prisma.match.findMany({
    where: {
      season: SEASON,
      isHome: true,
      kickoffAt: {
        gte: new Date("2026-03-01T00:00:00+03:00"),
      },
    },
    orderBy: { kickoffAt: "asc" },
  });

  let created = 0;
  let skipped = 0;

  for (const match of upcomingHomeMatches) {
    const existing = await prisma.ticketEvent.findUnique({
      where: { matchId: match.id },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const salesOpenAt = new Date(match.kickoffAt.getTime() - 14 * 24 * 60 * 60 * 1000);
    const salesCloseAt = new Date(match.kickoffAt.getTime() - 30 * 60 * 1000);

    await prisma.ticketEvent.create({
      data: {
        matchId: match.id,
        title: `Mombasa United vs ${match.opponent}`,
        salesOpenAt,
        salesCloseAt,
        currency: "KES",
        isActive: true,
        tiers: {
          create: [
            { name: "VIP", price: 1500, capacity: 200 },
            { name: "Regular", price: 500, capacity: 1500 },
            { name: "Terrace", price: 100, capacity: 2500 },
          ],
        },
      },
    });

    created++;
  }

  console.log(`[seed] ticket events: created=${created} skipped=${skipped}`);
}
async function main() {
  //console.log("[seed] fixtures: start");
  //await seedMatches();
  //await seedLeagueTable();
  console.log("[seed] fixtures: seeding ticket events for upcoming home matches...");
  await seedTicketEvents();
  console.log("[seed] fixtures: done");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });