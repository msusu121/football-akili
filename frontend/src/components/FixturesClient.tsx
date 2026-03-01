// ============================================================
// FILE: frontend/src/components/FixturesClient.tsx
// Client component for the Matches & Results page
//
// Tabs: Fixtures | Results | Tables
// Man Utd-inspired card-based layout grouped by month
// ============================================================

"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

interface FixturesClientProps {
  data: any;
}

/* ── helpers ── */
function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function fmtTime(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function monthKey(d?: string | null) {
  if (!d) return "Unknown";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { month: "long", year: "numeric" }).toUpperCase();
}

type TabType = "fixtures" | "results" | "tables";

export function FixturesClient({ data }: FixturesClientProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "fixtures";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const fixtures = useMemo(() => (data.upcomingFixtures || data.fixtures || []) as any[], [data]);
  const results = useMemo(() => (data.results || data.pastResults || []) as any[], [data]);
  const table = useMemo(() => (data.leagueTable || data.table || []) as any[], [data]);
  const ticketsUrl = data.settings?.ticketsUrl || "/tickets";

  // Group by month
  function groupByMonth(items: any[]) {
    const groups: Record<string, any[]> = {};
    items.forEach((item) => {
      const key = monthKey(item.kickoff || item.date || item.scheduledAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }

  const fixtureGroups = useMemo(() => groupByMonth(fixtures), [fixtures]);
  const resultGroups = useMemo(() => groupByMonth(results), [results]);

  const tabs: { key: TabType; label: string }[] = [
    { key: "fixtures", label: "Fixtures" },
    { key: "results", label: "Results" },
    { key: "tables", label: "Tables" },
  ];

  return (
    <>
      {/* Page header */}
      <section className="bg-ink">
        <div className="container-ms pt-10 pb-6 md:pt-14 md:pb-8">
          <h1 className="h-serif text-4xl md:text-5xl font-extrabold text-white tracking-tight uppercase">
            Matches
          </h1>

          {/* Tabs */}
          <div className="mt-8 flex items-center gap-1 border-b border-white/10">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3 text-[12px] font-extrabold tracking-[0.15em] uppercase transition-colors ${
                  activeTab === tab.key
                    ? "text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-brand rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content area */}
      <section className="bg-bg border-t border-line min-h-[60vh]">
        <div className="container-ms py-10 md:py-14">
          {/* ── FIXTURES TAB ── */}
          {activeTab === "fixtures" && (
            <>
              {fixtures.length === 0 ? (
                <div className="text-center py-20">
                  <p className="h-serif text-2xl text-muted">No upcoming fixtures</p>
                  <p className="text-sm text-muted mt-2">Check back soon for updates.</p>
                </div>
              ) : (
                Object.entries(fixtureGroups).map(([month, items]) => (
                  <div key={month} className="mb-10">
                    <h3 className="h-serif text-xl md:text-2xl font-extrabold text-ink mb-5 uppercase">
                      {month}
                    </h3>
                    <div className="space-y-3">
                      {items.map((fix: any, i: number) => (
                        <FixtureCard key={fix.id || i} fix={fix} ticketsUrl={ticketsUrl} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── RESULTS TAB ── */}
          {activeTab === "results" && (
            <>
              {results.length === 0 ? (
                <div className="text-center py-20">
                  <p className="h-serif text-2xl text-muted">No results yet</p>
                  <p className="text-sm text-muted mt-2">Results will appear after matches are played.</p>
                </div>
              ) : (
                Object.entries(resultGroups).map(([month, items]) => (
                  <div key={month} className="mb-10">
                    <h3 className="h-serif text-xl md:text-2xl font-extrabold text-ink mb-5 uppercase">
                      {month}
                    </h3>
                    <div className="space-y-3">
                      {items.map((result: any, i: number) => (
                        <ResultCard key={result.id || i} result={result} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* ── TABLES TAB ── */}
          {activeTab === "tables" && (
            <>
              {table.length === 0 ? (
                <div className="text-center py-20">
                  <p className="h-serif text-2xl text-muted">League table unavailable</p>
                  <p className="text-sm text-muted mt-2">Table data will appear when the season starts.</p>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-4 px-4">
                  <table className="w-full min-w-[640px]">
                    <thead>
                      <tr className="border-b-2 border-ink/10">
                        <th className="text-left py-3 px-3 text-[11px] font-extrabold tracking-[0.15em] uppercase text-muted w-8">
                          #
                        </th>
                        <th className="text-left py-3 px-3 text-[11px] font-extrabold tracking-[0.15em] uppercase text-muted">
                          Team
                        </th>
                        <th className="text-center py-3 px-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-muted w-10">
                          P
                        </th>
                        <th className="text-center py-3 px-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-muted w-10">
                          W
                        </th>
                        <th className="text-center py-3 px-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-muted w-10">
                          D
                        </th>
                        <th className="text-center py-3 px-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-muted w-10">
                          L
                        </th>
                        <th className="text-center py-3 px-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-muted w-14">
                          GD
                        </th>
                        <th className="text-center py-3 px-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-muted w-12">
                          Pts
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.map((row: any, i: number) => {
                        const isMombasa =
                          (row.teamName || row.team || "")
                            .toLowerCase()
                            .includes("mombasa");
                        return (
                          <tr
                            key={row.id || i}
                            className={`border-b border-line transition-colors ${
                              isMombasa
                                ? "bg-brand/5 font-extrabold"
                                : "hover:bg-ink/[0.02]"
                            }`}
                          >
                            <td className="py-3 px-3 text-sm text-ink font-bold">
                              {row.position || i + 1}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-ink/5 flex items-center justify-center shrink-0">
                                  {row.logo?.url || row.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={row.logo?.url || row.logoUrl}
                                      alt=""
                                      className="w-5 h-5 object-contain"
                                    />
                                  ) : (
                                    <span className="text-[8px] font-extrabold text-ink/30">
                                      {(row.teamName || row.team || "").substring(0, 2).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <span className={`text-sm ${isMombasa ? "text-ink" : "text-ink/80"}`}>
                                  {row.teamName || row.team}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center text-sm text-ink/70">{row.played ?? row.p ?? "-"}</td>
                            <td className="py-3 px-2 text-center text-sm text-ink/70">{row.won ?? row.w ?? "-"}</td>
                            <td className="py-3 px-2 text-center text-sm text-ink/70">{row.drawn ?? row.d ?? "-"}</td>
                            <td className="py-3 px-2 text-center text-sm text-ink/70">{row.lost ?? row.l ?? "-"}</td>
                            <td className="py-3 px-2 text-center text-sm text-ink/70">
                              {row.goalDifference ?? row.gd ?? "-"}
                            </td>
                            <td className="py-3 px-2 text-center text-sm font-extrabold text-ink">
                              {row.points ?? row.pts ?? "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

/* ── Fixture Card ── */
function FixtureCard({ fix, ticketsUrl }: { fix: any; ticketsUrl: string }) {
  const homeTeam = fix.homeTeam?.name || fix.homeTeamName || fix.home || "TBD";
  const awayTeam = fix.awayTeam?.name || fix.awayTeamName || fix.away || "TBD";
  const league = fix.competition?.name || fix.competitionName || fix.league || "League";
  const venue = fix.venue?.name || fix.venueName || fix.venue || "";
  const dateStr = fix.kickoff || fix.date || fix.scheduledAt;

  return (
    <div className="bg-white rounded-xl border border-line overflow-hidden hover:shadow-soft transition-shadow">
      {/* Date + competition bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-ink">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-white/90 font-bold">{fmtDate(dateStr)}</span>
          <span className="text-white/30">|</span>
          <span className="text-white/60 font-bold tracking-wider uppercase">{league}</span>
        </div>
        <span className="text-brand text-[11px] font-extrabold tracking-wider">
          {fmtTime(dateStr)}
        </span>
      </div>

      {/* Teams */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-6 flex-1">
          {/* Home */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <TeamBadge
              name={homeTeam}
              logoUrl={fix.homeTeam?.logo?.url || fix.homeTeamLogo}
            />
            <span className="font-extrabold text-ink text-sm sm:text-base truncate">
              {homeTeam}
            </span>
          </div>

          {/* VS */}
          <div className="px-4 py-2 bg-ink/5 rounded-lg">
            <span className="h-serif text-lg font-extrabold text-ink/30">VS</span>
          </div>

          {/* Away */}
          <div className="flex items-center gap-3 flex-1 min-w-0 justify-end">
            <span className="font-extrabold text-ink text-sm sm:text-base truncate text-right">
              {awayTeam}
            </span>
            <TeamBadge
              name={awayTeam}
              logoUrl={fix.awayTeam?.logo?.url || fix.awayTeamLogo}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar — venue + tickets */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-line bg-ink/[0.02]">
        {venue && (
          <div className="flex items-center gap-2 text-muted text-xs">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>{venue}</span>
          </div>
        )}
        <Link
          href={ticketsUrl}
          className="inline-flex items-center gap-2 px-5 py-2 bg-brand text-ink text-[10px] font-extrabold tracking-[0.12em] uppercase rounded-lg hover:bg-brand-dark transition-colors"
        >
          TICKET INFO
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

/* ── Result Card ── */
function ResultCard({ result }: { result: any }) {
  const homeTeam = result.homeTeam?.name || result.homeTeamName || result.home || "TBD";
  const awayTeam = result.awayTeam?.name || result.awayTeamName || result.away || "TBD";
  const league = result.competition?.name || result.competitionName || result.league || "League";
  const dateStr = result.kickoff || result.date || result.scheduledAt;

  return (
    <div className="bg-white rounded-xl border border-line overflow-hidden hover:shadow-soft transition-shadow">
      {/* Date + competition bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-ink">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-white/90 font-bold">{fmtDate(dateStr)}</span>
          <span className="text-white/30">|</span>
          <span className="text-white/60 font-bold tracking-wider uppercase">{league}</span>
        </div>
        <span className="text-brand text-[11px] font-extrabold tracking-wider">FT</span>
      </div>

      {/* Teams + Score */}
      <div className="px-5 py-6 flex items-center justify-center gap-6 sm:gap-10">
        {/* Home */}
        <div className="flex flex-col items-center gap-2 text-center min-w-0">
          <TeamBadge
            name={homeTeam}
            logoUrl={result.homeTeam?.logo?.url || result.homeTeamLogo}
            size="lg"
          />
          <span className="text-ink text-xs sm:text-sm font-bold truncate max-w-[100px]">
            {homeTeam}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-3">
          <span className="h-serif text-4xl sm:text-5xl font-extrabold text-ink">
            {result.homeScore ?? "-"}
          </span>
          <span className="text-ink/20 text-xl font-bold">-</span>
          <span className="h-serif text-4xl sm:text-5xl font-extrabold text-ink">
            {result.awayScore ?? "-"}
          </span>
        </div>

        {/* Away */}
        <div className="flex flex-col items-center gap-2 text-center min-w-0">
          <TeamBadge
            name={awayTeam}
            logoUrl={result.awayTeam?.logo?.url || result.awayTeamLogo}
            size="lg"
          />
          <span className="text-ink text-xs sm:text-sm font-bold truncate max-w-[100px]">
            {awayTeam}
          </span>
        </div>
      </div>

      {/* Match review link */}
      <div className="border-t border-line px-5 py-3 flex justify-center bg-ink/[0.02]">
        <Link
          href={`/fixtures/${result.id || ""}`}
          className="text-brand text-[11px] font-extrabold tracking-[0.15em] uppercase hover:text-brand-dark transition"
        >
          MATCH REVIEW →
        </Link>
      </div>
    </div>
  );
}

/* ── Team Badge ── */
function TeamBadge({
  name,
  logoUrl,
  size = "sm",
}: {
  name: string;
  logoUrl?: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-14 h-14 sm:w-16 sm:h-16" : "w-10 h-10";
  const imgDim = size === "lg" ? "w-10 h-10" : "w-6 h-6";
  const textSize = size === "lg" ? "text-xs" : "text-[10px]";

  return (
    <div className={`${dim} rounded-full bg-ink/5 border border-line flex items-center justify-center shrink-0`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className={`${imgDim} object-contain`} />
      ) : (
        <span className={`${textSize} font-extrabold text-ink/30`}>
          {name.substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
