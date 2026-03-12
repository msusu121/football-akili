// ============================================================
// FILE: frontend/src/components/FixturesClient.tsx
// Client component for the Matches & Results page
//
// Tabs: Fixtures | Results | Tables
// Man Utd-inspired card-based layout grouped by month
// ✅ Exact Man Utd layout: TeamA [logo] [time] [logo] TeamB
// ✅ Tabs: white bg pill for active, not underline
// ✅ Date bar: light gray bg
// ✅ Logos hidden on mobile
// ✅ Table contained on mobile with horizontal scroll
// ✅ TICKET INFO centered with red arrow
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
  return dt
    .toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    .toUpperCase();
}

type TabType = "fixtures" | "results" | "tables";

export function FixturesClient({ data }: FixturesClientProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "fixtures";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const fixtures = useMemo(
    () => (data.upcomingFixtures || data.fixtures || []) as any[],
    [data]
  );
  const results = useMemo(
    () => (data.results || data.pastResults || []) as any[],
    [data]
  );
  const table = useMemo(
    () => (data.leagueTable || data.table || []) as any[],
    [data]
  );
  const ticketsUrl = data.settings?.ticketsUrl || "/tickets";

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
      {/* Page header — dark bg, Man Utd style */}
      <section className="bg-[#1a1a2e]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          {/* Tabs row — right-aligned on desktop, full-width on mobile */}
          <div className="flex items-center justify-center py-3">
            <div className="flex items-center gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 sm:px-6 py-2.5 text-[11px] sm:text-[13px] font-bold tracking-[0.08em] uppercase transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-[#1a1a1a]"
                      : "bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content area */}
      <section className="bg-white min-h-[60vh]">
        <div className="max-w-[1000px] mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
          {/* ── FIXTURES TAB ── */}
          {activeTab === "fixtures" && (
            <>
              {fixtures.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-lg font-bold text-gray-800">
                    No upcoming fixtures
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Check back soon for updates.
                  </p>
                </div>
              ) : (
                Object.entries(fixtureGroups).map(([month, items]) => (
                  <div key={month} className="mb-8 md:mb-12">
                    <h2 className="text-base sm:text-lg md:text-xl font-extrabold uppercase tracking-wider text-[#1a1a1a] mb-4 md:mb-6 font-[var(--font-display)]">
                      {month}
                    </h2>
                    <div className="divide-y divide-gray-100">
                      {items.map((fix: any, i: number) => (
                        <FixtureCard
                          key={fix.id || i}
                          fix={fix}
                          ticketsUrl={ticketsUrl}
                        />
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
                  <p className="text-lg font-bold text-gray-800">
                    No results yet
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Results will appear after matches are played.
                  </p>
                </div>
              ) : (
                Object.entries(resultGroups).map(([month, items]) => (
                  <div key={month} className="mb-8 md:mb-12">
                    <h2 className="text-base sm:text-lg md:text-xl font-extrabold uppercase tracking-wider text-[#1a1a1a] mb-4 md:mb-6 font-[var(--font-display)]">
                      {month}
                    </h2>
                    <div className="divide-y divide-gray-100">
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
                  <p className="text-lg font-bold text-gray-800">
                    League table unavailable
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Table data will appear when the season starts.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-sm">
                      <thead>
                        <tr className="bg-[#1a1a2e] text-white text-[11px] sm:text-xs uppercase tracking-wider">
                          <th className="py-3 px-2 sm:px-3 text-center w-10">#</th>
                          <th className="py-3 px-2 sm:px-3 text-left">Team</th>
                          <th className="py-3 px-2 sm:px-3 text-center w-10">P</th>
                          <th className="py-3 px-2 sm:px-3 text-center w-10">W</th>
                          <th className="py-3 px-2 sm:px-3 text-center w-10">D</th>
                          <th className="py-3 px-2 sm:px-3 text-center w-10">L</th>
                          <th className="py-3 px-2 sm:px-3 text-center w-10">GD</th>
                          <th className="py-3 px-2 sm:px-3 text-center w-12 font-extrabold">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.map((row: any, i: number) => {
                          const isMombasa = (row.teamName || row.team || "")
                            .toLowerCase()
                            .includes("mombasa");
                          return (
                            <tr
                              key={row.id || i}
                              className={`border-b border-gray-100 ${
                                isMombasa ? "bg-blue-50 font-bold" : "hover:bg-gray-50"
                              }`}
                            >
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm text-gray-500">
                                {row.position || i + 1}
                              </td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="hidden sm:flex w-7 h-7 rounded-full bg-gray-100 items-center justify-center flex-shrink-0">
                                    {row.logo?.url || row.logoUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={row.logo?.url || row.logoUrl}
                                        alt={row.teamName || row.team}
                                        className="w-5 h-5 object-contain"
                                      />
                                    ) : (
                                      <span className="text-[9px] font-bold text-gray-400">
                                        {(row.teamName || row.team || "").substring(0, 2).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none ${
                                      isMombasa ? "text-[#2563eb] font-extrabold" : "text-gray-800"
                                    }`}
                                  >
                                    {row.teamName || row.team}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">{row.played ?? row.p ?? "-"}</td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">{row.won ?? row.w ?? "-"}</td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">{row.drawn ?? row.d ?? "-"}</td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">{row.lost ?? row.l ?? "-"}</td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">{row.goalDifference ?? row.gd ?? "-"}</td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm font-extrabold">{row.points ?? row.pts ?? "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

/* ── Fixture Card — Man Utd exact layout ── */
function FixtureCard({
  fix,
  ticketsUrl,
}: {
  fix: any;
  ticketsUrl: string;
}) {
  const homeTeam = fix.homeTeam?.name || fix.homeTeamName || fix.home || "TBD";
  const awayTeam = fix.awayTeam?.name || fix.awayTeamName || fix.away || "TBD";
  const league = fix.competition?.name || fix.competitionName || fix.league || "League";
  const dateStr = fix.kickoff || fix.date || fix.scheduledAt;
  const homeLogo = fix.homeTeam?.logo?.url || fix.homeTeamLogo || null;
  const awayLogo = fix.awayTeam?.logo?.url || fix.awayTeamLogo || null;

  return (
    <div className="bg-white">
      {/* Date + competition bar — light gray like Man Utd */}
      <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#f2f2f2]">
        <span className="text-[11px] sm:text-xs font-bold text-gray-600">
          {fmtDate(dateStr)}
        </span>
        <span className="text-gray-300 text-xs">|</span>
        <span className="text-[10px] sm:text-[11px] text-gray-400 truncate">
          {league}
        </span>
      </div>

      {/* Teams row — centered: TeamA [logo] [TIME] [logo] TeamB + chevron */}
      <div className="px-3 sm:px-5 py-4 sm:py-5">
        <div className="flex items-center">
          {/* Home team — right aligned */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-[13px] sm:text-sm md:text-base font-bold text-[#1a1a1a] truncate text-right">
              {homeTeam}
            </span>
            <TeamBadge name={homeTeam} logoUrl={homeLogo} size="lg" />
          </div>

          {/* Time box — dark centered pill */}
          <div className="flex-shrink-0 mx-2 sm:mx-4 px-3 sm:px-4 py-1.5 bg-[#1a1a2e] rounded-sm">
            <span className="text-[11px] sm:text-sm font-bold text-white tracking-wide">
              {fmtTime(dateStr)}
            </span>
          </div>

          {/* Away team — left aligned */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <TeamBadge name={awayTeam} logoUrl={awayLogo} size="lg" />
            <span className="text-[13px] sm:text-sm md:text-base font-bold text-[#1a1a1a] truncate">
              {awayTeam}
            </span>
          </div>

          {/* Chevron dropdown */}
          <button className="flex-shrink-0 ml-2 sm:ml-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* TICKET INFO — centered below with arrow 
        <div className="flex items-center justify-center mt-3 gap-1">
          <Link
            href={ticketsUrl}
            className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500 hover:text-gray-700 transition-colors"
          >
            TICKET INFO
          </Link>
          <span className="text-[#2563eb]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>    */}
      </div>
    </div>
  );
}

/* ── Result Card — Man Utd exact layout ── */
function ResultCard({ result }: { result: any }) {
  const homeTeam = result.homeTeam?.name || result.homeTeamName || result.home || "TBD";
  const awayTeam = result.awayTeam?.name || result.awayTeamName || result.away || "TBD";
  const league = result.competition?.name || result.competitionName || result.league || "League";
  const dateStr = result.kickoff || result.date || result.scheduledAt;
  const homeLogo = result.homeTeam?.logo?.url || result.homeTeamLogo || null;
  const awayLogo = result.awayTeam?.logo?.url || result.awayTeamLogo || null;

  return (
    <div className="bg-white">
      {/* Date + competition bar — light gray */}
      <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#f2f2f2]">
        <span className="text-[11px] sm:text-xs font-bold text-gray-600">
          {fmtDate(dateStr)}
        </span>
        <span className="text-gray-300 text-xs">|</span>
        <span className="text-[10px] sm:text-[11px] text-gray-400 truncate">
          {league}
        </span>
      </div>

      {/* Teams row — centered: TeamA [logo] [SCORE] [logo] TeamB + chevron */}
      <div className="px-3 sm:px-5 py-4 sm:py-5">
        <div className="flex items-center">
          {/* Home team — right aligned */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-[13px] sm:text-sm md:text-base font-bold text-[#1a1a1a] truncate text-right">
              {homeTeam}
            </span>
            <TeamBadge name={homeTeam} logoUrl={homeLogo} size="lg" />
          </div>

          {/* Score box — dark centered */}
          <div className="flex-shrink-0 mx-2 sm:mx-4 flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl font-extrabold text-[#1a1a1a]">
              {result.homeScore ?? "-"}
            </span>
            <span className="text-gray-300 text-sm font-bold">-</span>
            <span className="text-lg sm:text-xl font-extrabold text-[#1a1a1a]">
              {result.awayScore ?? "-"}
            </span>
          </div>

          {/* Away team — left aligned */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <TeamBadge name={awayTeam} logoUrl={awayLogo} size="lg" />
            <span className="text-[13px] sm:text-sm md:text-base font-bold text-[#1a1a1a] truncate">
              {awayTeam}
            </span>
          </div>

          {/* Chevron dropdown */}
          <button className="flex-shrink-0 ml-2 sm:ml-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* MATCH REVIEW — centered below
        <div className="flex items-center justify-center mt-3 gap-1">
          <Link
            href="#"
            className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500 hover:text-gray-700 transition-colors"
          >
            MATCH REVIEW
          </Link>
          <span className="text-[#2563eb]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>    */} 
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
  const dim =
    size === "lg"
      ? "hidden sm:flex w-8 h-8 md:w-10 md:h-10"
      : "hidden sm:flex w-6 h-6 md:w-8 md:h-8";
  const imgDim = size === "lg" ? "w-6 h-6 md:w-8 md:h-8" : "w-4 h-4 md:w-5 md:h-5";
  const textSize = size === "lg" ? "text-[9px] md:text-[10px]" : "text-[8px] md:text-[9px]";

  return (
    <div
      className={`${dim} rounded-full bg-gray-100 items-center justify-center flex-shrink-0`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className={`${imgDim} object-contain`} />
      ) : (
        <span className={`${textSize} font-extrabold text-gray-400`}>
          {name.substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
