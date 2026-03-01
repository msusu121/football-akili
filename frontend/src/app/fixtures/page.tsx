// ============================================================
// FILE: frontend/src/app/fixtures/page.tsx
// DROP-IN REPLACEMENT — Matches & Results page
//
// Man Utd-inspired fixtures page with:
//   - Tab navigation: Fixtures | Results | Tables
//   - Fixtures grouped by month
//   - Each fixture card: date, competition, teams with logos,
//     time/score, venue, ticket link
//   - Results with scores
//   - League table view
//   - No women's section, no live section
//   - Mobile: vertical stack, scrollable table
//
// BRAND: Navy (#0a1628), Gold (#d4a017), Black
// ============================================================

import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import { FixturesClient } from "@/components/FixturesClient";

export const metadata = {
  title: "Fixtures & Results | Mombasa United FC",
  description:
    "View upcoming fixtures, past results, and league table for Mombasa United FC.",
};

export default async function FixturesPage() {
  const data = await apiGet<any>("/public/fixtures");

  return (
    <SiteShell
      settings={data.settings}
      socials={data.socials}
      sponsors={data.sponsors}
    >
      <FixturesClient data={data} />
    </SiteShell>
  );
}
