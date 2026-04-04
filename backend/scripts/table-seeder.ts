import { prisma } from "../src/lib/prisma.js";

const SEASON = "2025/26";
const COMPETITION = "National Super League";
const TABLE_AS_OF = new Date("2026-04-04T00:00:00+03:00");

const LEAGUE_TABLE = [
  { position: 1, teamName: "Mombasa United", played: 27, won: 19, drawn: 1, lost: 7, goalsFor: 44, goalsAgainst: 24, goalDifference: 20, points: 58 },
  { position: 2, teamName: "Migori Youth", played: 26, won: 16, drawn: 4, lost: 6, goalsFor: 39, goalsAgainst: 24, goalDifference: 15, points: 52 },
  { position: 3, teamName: "Equity Bank", played: 27, won: 15, drawn: 7, lost: 5, goalsFor: 38, goalsAgainst: 25, goalDifference: 13, points: 52 },
  { position: 4, teamName: "3K", played: 27, won: 15, drawn: 5, lost: 7, goalsFor: 42, goalsAgainst: 18, goalDifference: 24, points: 50 },
  { position: 5, teamName: "MOFA", played: 25, won: 12, drawn: 9, lost: 4, goalsFor: 34, goalsAgainst: 18, goalDifference: 16, points: 45 },
  { position: 6, teamName: "Fortune Sacco", played: 26, won: 12, drawn: 7, lost: 7, goalsFor: 42, goalsAgainst: 25, goalDifference: 17, points: 43 },
  { position: 7, teamName: "Kibera Black Stars", played: 27, won: 13, drawn: 3, lost: 11, goalsFor: 23, goalsAgainst: 23, goalDifference: 0, points: 42 },
  { position: 8, teamName: "Naivas", played: 27, won: 11, drawn: 8, lost: 8, goalsFor: 28, goalsAgainst: 23, goalDifference: 5, points: 41 },
  { position: 9, teamName: "Talanta", played: 27, won: 10, drawn: 7, lost: 10, goalsFor: 25, goalsAgainst: 22, goalDifference: 3, points: 37 },
  { position: 10, teamName: "Nzoia Sugar", played: 26, won: 8, drawn: 12, lost: 6, goalsFor: 26, goalsAgainst: 20, goalDifference: 6, points: 36 },
  { position: 11, teamName: "SOY United", played: 26, won: 10, drawn: 6, lost: 10, goalsFor: 22, goalsAgainst: 19, goalDifference: 3, points: 36 },
  { position: 12, teamName: "Nairobi City Stars", played: 27, won: 8, drawn: 10, lost: 9, goalsFor: 24, goalsAgainst: 26, goalDifference: -2, points: 34 },
  { position: 13, teamName: "Gucha Stars", played: 27, won: 9, drawn: 5, lost: 13, goalsFor: 26, goalsAgainst: 30, goalDifference: -4, points: 32 },
  { position: 14, teamName: "Luanda Villa", played: 26, won: 8, drawn: 4, lost: 14, goalsFor: 18, goalsAgainst: 34, goalDifference: -16, points: 28 },
  { position: 15, teamName: "Kabati Youth", played: 26, won: 7, drawn: 6, lost: 13, goalsFor: 17, goalsAgainst: 33, goalDifference: -16, points: 27 },
  { position: 16, teamName: "Kisumu Allstars", played: 27, won: 7, drawn: 6, lost: 14, goalsFor: 17, goalsAgainst: 29, goalDifference: -12, points: 27 },
  { position: 17, teamName: "Darajani Gogo", played: 26, won: 6, drawn: 6, lost: 14, goalsFor: 17, goalsAgainst: 29, goalDifference: -12, points: 24 },
  { position: 18, teamName: "Mwatate United", played: 26, won: 5, drawn: 6, lost: 15, goalsFor: 20, goalsAgainst: 42, goalDifference: -22, points: 21 },
  { position: 19, teamName: "Vihiga United", played: 27, won: 6, drawn: 7, lost: 14, goalsFor: 18, goalsAgainst: 39, goalDifference: -21, points: 19 },
  { position: 20, teamName: "MCF", played: 25, won: 5, drawn: 5, lost: 15, goalsFor: 13, goalsAgainst: 29, goalDifference: -16, points: 17 },
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
    create: {
      season: SEASON,
      competition: COMPETITION,
      asOfDate: TABLE_AS_OF,
    },
    update: {},
  });

  for (const r of LEAGUE_TABLE) {
    await (prisma as any).leagueTableRow.upsert({
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
        logoUrl: null,
      },
    });
  }

  console.log(
    `[seed] league table: rows=${LEAGUE_TABLE.length} asOf=${TABLE_AS_OF.toISOString()}`
  );
}

async function main() {
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