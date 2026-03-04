// backend/prisma/seed-fixtures.ts
import { prisma } from "../src/lib/prisma";

// ✅ Season / competition constants (match your frontend)
const SEASON = "2025/26";
const COMPETITION = "National Super League";

// ✅ From your uploaded Excel (MOMBASA UNITED 2025_2026.xlsx)
// NOTE: Times stored as Kenya local; we store as ISO with +03:00 to avoid shifting.
const MATCHES: Array<{
  round: number | null;
  kickoffAt: string; // ISO with +03:00
  isHome: boolean;
  opponent: string;
  venue: string | null;
  homeScore: number | null;
  awayScore: number | null;
}> = [
  {
    "round": 1,
    "kickoffAt": "2025-09-27T15:00:00+03:00",
    "isHome": false,
    "opponent": "MCF",
    "venue": "Ndalani stadium · Machakos",
    "homeScore": 1,
    "awayScore": 0
  },
  {
    "round": 2,
    "kickoffAt": "2025-10-05T13:00:00+03:00",
    "isHome": true,
    "opponent": "Fortune sacco",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 1
  },
  {
    "round": 3,
    "kickoffAt": "2025-10-11T13:00:00+03:00",
    "isHome": true,
    "opponent": "Migori Youth",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 1,
    "awayScore": 1
  },
  {
    "round": 4,
    "kickoffAt": "2025-10-18T15:00:00+03:00",
    "isHome": false,
    "opponent": "Nairobi City Stars",
    "venue": "Mavoko Stadium · Machakos",
    "homeScore": 0,
    "awayScore": 1
  },
  {
    "round": 5,
    "kickoffAt": "2025-10-29T15:00:00+03:00",
    "isHome": true,
    "opponent": "SOY United",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 3,
    "awayScore": 0
  },
  {
    "round": 6,
    "kickoffAt": "2025-11-01T15:00:00+03:00",
    "isHome": false,
    "opponent": "Talanta",
    "venue": "Dandora Stadium · Nairobi",
    "homeScore": 0,
    "awayScore": 2
  },
  {
    "round": 7,
    "kickoffAt": "2025-11-08T15:00:00+03:00",
    "isHome": true,
    "opponent": "Kibera Black Stars",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 0
  },
  {
    "round": 8,
    "kickoffAt": "2025-11-15T15:00:00+03:00",
    "isHome": false,
    "opponent": "3K",
    "venue": "Moi Stadium · Kisumu",
    "homeScore": 2,
    "awayScore": 0
  },
  {
    "round": 9,
    "kickoffAt": "2025-11-22T15:00:00+03:00",
    "isHome": true,
    "opponent": "Kabati Youth",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 0
  },
  {
    "round": 10,
    "kickoffAt": "2025-11-30T15:00:00+03:00",
    "isHome": false,
    "opponent": "Darajani Gogo",
    "venue": "Mbaraki Ground · Mombasa",
    "homeScore": 1,
    "awayScore": 2
  },
  {
    "round": 11,
    "kickoffAt": "2025-12-07T15:00:00+03:00",
    "isHome": true,
    "opponent": "Naivas",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 1
  },
  {
    "round": 12,
    "kickoffAt": "2025-12-14T15:00:00+03:00",
    "isHome": false,
    "opponent": "Nzoia Sugar",
    "venue": "Sudi Stadium · Bungoma",
    "homeScore": 0,
    "awayScore": 1
  },
  {
    "round": 13,
    "kickoffAt": "2025-12-21T15:00:00+03:00",
    "isHome": true,
    "opponent": "Gucha Stars",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 0
  },
  {
    "round": 14,
    "kickoffAt": "2025-12-28T15:00:00+03:00",
    "isHome": false,
    "opponent": "Luanda Villa",
    "venue": "Mumias Sports Complex · Kakamega",
    "homeScore": 0,
    "awayScore": 1
  },
  {
    "round": 15,
    "kickoffAt": "2026-01-04T15:00:00+03:00",
    "isHome": true,
    "opponent": "Equity Bank",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 1
  },
  {
    "round": 16,
    "kickoffAt": "2026-01-11T15:00:00+03:00",
    "isHome": false,
    "opponent": "Kisumu Allstars",
    "venue": "Moi Stadium · Kisumu",
    "homeScore": 1,
    "awayScore": 1
  },
  {
    "round": 17,
    "kickoffAt": "2026-01-18T15:00:00+03:00",
    "isHome": true,
    "opponent": "Mwatate United",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 0
  },
  {
    "round": 18,
    "kickoffAt": "2026-01-25T15:00:00+03:00",
    "isHome": false,
    "opponent": "MOFA",
    "venue": "Mumias Sports Complex · Kakamega",
    "homeScore": 0,
    "awayScore": 1
  },
  {
    "round": 19,
    "kickoffAt": "2026-02-01T15:00:00+03:00",
    "isHome": true,
    "opponent": "MCF",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 1
  },
  {
    "round": 20,
    "kickoffAt": "2026-02-08T15:00:00+03:00",
    "isHome": false,
    "opponent": "Fortune sacco",
    "venue": "Kisii Stadium · Kisii",
    "homeScore": 1,
    "awayScore": 0
  },
  {
    "round": 21,
    "kickoffAt": "2026-02-15T15:00:00+03:00",
    "isHome": true,
    "opponent": "Migori Youth",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 0,
    "awayScore": 1
  },
  {
    "round": 22,
    "kickoffAt": "2026-02-22T15:00:00+03:00",
    "isHome": true,
    "opponent": "Nairobi City Stars",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 1,
    "awayScore": 0
  },
  {
    "round": 23,
    "kickoffAt": "2026-03-01T15:00:00+03:00",
    "isHome": false,
    "opponent": "SOY United",
    "venue": "Jomo Kenyatta Stadium · Kisumu",
    "homeScore": 2,
    "awayScore": 0
  },
  {
    "round": 24,
    "kickoffAt": "2026-03-08T15:00:00+03:00",
    "isHome": true,
    "opponent": "Talanta",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 2,
    "awayScore": 0
  },
  {
    "round": 25,
    "kickoffAt": "2026-03-15T15:00:00+03:00",
    "isHome": false,
    "opponent": "Kibera Black Stars",
    "venue": "Ligi Ndogo Grounds · Nairobi",
    "homeScore": 0,
    "awayScore": 0
  },
  {
    "round": 26,
    "kickoffAt": "2026-03-22T15:00:00+03:00",
    "isHome": true,
    "opponent": "3K",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": 1,
    "awayScore": 0
  },
  {
    "round": 27,
    "kickoffAt": "2026-03-29T15:00:00+03:00",
    "isHome": false,
    "opponent": "Kabati Youth",
    "venue": "Kangundo Stadium · Machakos",
    "homeScore": 0,
    "awayScore": 1
  },
  {
    "round": 28,
    "kickoffAt": "2026-04-05T15:00:00+03:00",
    "isHome": false,
    "opponent": "Darajani Gogo",
    "venue": "Mbaraki Ground · Mombasa",
    "homeScore": 0,
    "awayScore": 0
  },
  {
    "round": 29,
    "kickoffAt": "2026-04-12T15:00:00+03:00",
    "isHome": true,
    "opponent": "Naivas",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 30,
    "kickoffAt": "2026-04-19T15:00:00+03:00",
    "isHome": false,
    "opponent": "Nzoia Sugar",
    "venue": "Sudi Stadium · Bungoma",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 31,
    "kickoffAt": "2026-04-26T15:00:00+03:00",
    "isHome": true,
    "opponent": "Gucha Stars",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 32,
    "kickoffAt": "2026-05-03T15:00:00+03:00",
    "isHome": false,
    "opponent": "Luanda Villa",
    "venue": "Mumias Sports Complex · Kakamega",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 33,
    "kickoffAt": "2026-05-10T15:00:00+03:00",
    "isHome": true,
    "opponent": "Equity Bank",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 34,
    "kickoffAt": "2026-05-17T15:00:00+03:00",
    "isHome": false,
    "opponent": "Kisumu Allstars",
    "venue": "Moi Stadium · Kisumu",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 35,
    "kickoffAt": "2026-05-23T15:00:00+03:00",
    "isHome": true,
    "opponent": "Mwatate United",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 36,
    "kickoffAt": "2026-05-30T15:00:00+03:00",
    "isHome": false,
    "opponent": "MOFA",
    "venue": "Mumias Sports Complex · Kakamega",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 37,
    "kickoffAt": "2026-06-06T15:00:00+03:00",
    "isHome": true,
    "opponent": "Luanda Villa",
    "venue": "KPA Sports Club · Mombasa",
    "homeScore": null,
    "awayScore": null
  },
  {
    "round": 38,
    "kickoffAt": "2026-06-13T15:00:00+03:00",
    "isHome": false,
    "opponent": "Kibera Black Stars",
    "venue": "Ligi Ndogo Grounds · Nairobi",
    "homeScore": null,
    "awayScore": null
  }
];

// ✅ League Table from your image (as-of 2026-03-01)
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
];

async function seedMatches() {
  for (const m of MATCHES) {
    const kickoffAt = new Date(m.kickoffAt);
    const status = m.homeScore != null && m.awayScore != null ? "FT" : "SCHEDULED";

    // Use a deterministic key to avoid duplicates across runs
    const key = `${SEASON}|${kickoffAt.toISOString()}|${m.isHome ? "H" : "A"}|${m.opponent}`;
    const id = "m_" + Buffer.from(key).toString("base64url").slice(0, 20);

    await prisma.match.upsert({
      where: { id },
      create: {
        id,
        competition: COMPETITION,
        matchType: "LEAGUE",
        season: SEASON,
        kickoffAt,
        venue: m.venue,
        isHome: m.isHome,
        opponent: m.opponent,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status,
      },
      update: {
        competition: COMPETITION,
        matchType: "LEAGUE",
        season: SEASON,
        kickoffAt,
        venue: m.venue,
        isHome: m.isHome,
        opponent: m.opponent,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status,
      },
    });
  }
}

async function seedLeagueTable() {
  // If you haven't migrated the league table models yet, skip cleanly.
  const hasModel = (prisma as any).leagueTableSnapshot && (prisma as any).leagueTableRow;
  if (!hasModel) return;

  const snap = await prisma.leagueTableSnapshot.upsert({
    where: {
      season_competition_asOfDate: {
        season: SEASON,
        competition: COMPETITION,
        asOfDate: TABLE_AS_OF,
      },
    },
    create: {
      season: SEASON,
      competition: COMPETITION,
      asOfDate: TABLE_AS_OF,
    },
    update: {},
  });

  for (const r of LEAGUE_TABLE) {
    await prisma.leagueTableRow.upsert({
      where: {
        snapshotId_position: {
          snapshotId: snap.id,
          position: r.position,
        },
      },
      create: {
        snapshotId: snap.id,
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
        logoUrl: null,
      },
      update: {
        teamName: r.teamName,
        played: r.played,
        won: r.won,
        drawn: r.drawn,
        lost: r.lost,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        goalDifference: r.goalDifference,
        points: r.points,
      },
    });
  }
}

async function main() {
  console.log("[seed] fixtures: start");
  await seedMatches();
  console.log("[seed] fixtures: done");

  console.log("[seed] league table: start");
  await seedLeagueTable();
  console.log("[seed] league table: done");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });