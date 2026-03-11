"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

interface FixturesClientProps {
  data: any;
}

const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function resolveAssetUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (ASSET_BASE) {
    return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
  return url;
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

function getClubName(data: any) {
  return (
    data?.settings?.clubName ||
    data?.clubName ||
    "Mombasa United FC"
  );
}

function getClubLogo(data: any) {
  return resolveAssetUrl(
    data?.settings?.headerLogo?.url ||
      data?.settings?.headerLogoUrl ||
      data?.settings?.clubLogo?.url ||
      data?.settings?.clubLogoUrl ||
      data?.settings?.logo?.url ||
      data?.settings?.logoUrl ||
      data?.clubLogoUrl ||
      "/logos/club.png"
  );
}

function getKickoff(match: any) {
  return match.kickoff || match.kickoffAt || match.date || match.scheduledAt;
}

function getCompetition(match: any) {
  return (
    match.competition?.name ||
    match.competitionName ||
    match.competition ||
    match.league ||
    "League"
  );
}

function getDisplayMatch(match: any, clubName: string, clubLogo: string) {
  const isHome = Boolean(match.isHome);

  const nestedHomeName =
    match.homeTeam?.name || match.homeTeamName || match.home || "";
  const nestedAwayName =
    match.awayTeam?.name || match.awayTeamName || match.away || "";

  const nestedHomeLogo = resolveAssetUrl(
    match.homeTeam?.logo?.url || match.homeTeamLogo || ""
  );
  const nestedAwayLogo = resolveAssetUrl(
    match.awayTeam?.logo?.url || match.awayTeamLogo || ""
  );

  const opponentName =
    match.opponent ||
    (isHome ? nestedAwayName : nestedHomeName) ||
    nestedAwayName ||
    nestedHomeName ||
    "TBD";

  const opponentLogo = resolveAssetUrl(
    match.opponentLogo?.url ||
      match.opponentLogoUrl ||
      match.opponentLogo?.path ||
      (isHome ? nestedAwayLogo : nestedHomeLogo) ||
      nestedAwayLogo ||
      nestedHomeLogo ||
      ""
  );

  if (nestedHomeName || nestedAwayName) {
    return {
      homeTeam: nestedHomeName || (isHome ? clubName : opponentName),
      awayTeam: nestedAwayName || (isHome ? opponentName : clubName),
      homeLogo: nestedHomeLogo || (isHome ? clubLogo : opponentLogo),
      awayLogo: nestedAwayLogo || (isHome ? opponentLogo : clubLogo),
    };
  }

  if (isHome) {
    return {
      homeTeam: clubName,
      awayTeam: opponentName,
      homeLogo: clubLogo,
      awayLogo: opponentLogo,
    };
  }

  return {
    homeTeam: opponentName,
    awayTeam: clubName,
    homeLogo: opponentLogo,
    awayLogo: clubLogo,
  };
}

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
  const clubName = getClubName(data);
  const clubLogo = getClubLogo(data);

  function groupByMonth(items: any[]) {
    const groups: Record<string, any[]> = {};
    items.forEach((item) => {
      const key = monthKey(getKickoff(item));
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
      <section className="bg-[#1a1a2e]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
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

      <section className="bg-white min-h-[60vh]">
        <div className="max-w-[1000px] mx-auto px-3 sm:px-4 md:px-6 py-6 md:py-10">
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
                          clubName={clubName}
                          clubLogo={clubLogo}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

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
                        <ResultCard
                          key={result.id || i}
                          result={result}
                          clubName={clubName}
                          clubLogo={clubLogo}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

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
                                      <img
                                        src={resolveAssetUrl(row.logo?.url || row.logoUrl)}
                                        alt={row.teamName || row.team}
                                        className="w-5 h-5 object-contain"
                                      />
                                    ) : (
                                      <span className="text-[9px] font-bold text-gray-400">
                                        {(row.teamName || row.team || "")
                                          .substring(0, 2)
                                          .toUpperCase()}
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

function FixtureCard({
  fix,
  ticketsUrl,
  clubName,
  clubLogo,
}: {
  fix: any;
  ticketsUrl: string;
  clubName: string;
  clubLogo: string;
}) {
  const league = getCompetition(fix);
  const dateStr = getKickoff(fix);

  const { homeTeam, awayTeam, homeLogo, awayLogo } = getDisplayMatch(
    fix,
    clubName,
    clubLogo
  );

  return (
    <div className="bg-white">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#f2f2f2]">
        <span className="text-[11px] sm:text-xs font-bold text-gray-600">
          {fmtDate(dateStr)}
        </span>
        <span className="text-gray-300 text-xs">|</span>
        <span className="text-[10px] sm:text-[11px] text-gray-400 truncate">
          {league}
        </span>
      </div>

      <div className="px-3 sm:px-5 py-4 sm:py-5">
        <div className="flex items-center">
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-[13px] sm:text-sm md:text-base font-bold text-[#1a1a1a] truncate text-right">
              {homeTeam}
            </span>
            <TeamBadge name={homeTeam} logoUrl={homeLogo} size="lg" />
          </div>

          <div className="flex-shrink-0 mx-2 sm:mx-4 px-3 sm:px-4 py-1.5 bg-[#1a1a2e] rounded-sm">
            <span className="text-[11px] sm:text-sm font-bold text-white tracking-wide">
              {fmtTime(dateStr)}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <TeamBadge name={awayTeam} logoUrl={awayLogo} size="lg" />
            <span className="text-[13px] sm:text-sm md:text-base font-bold text-[#1a1a1a] truncate">
              {awayTeam}
            </span>
          </div>

          <button className="flex-shrink-0 ml-2 sm:ml-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  result,
  clubName,
  clubLogo,
}: {
  result: any;
  clubName: string;
  clubLogo: string;
}) {
  const league = getCompetition(result);
  const dateStr = getKickoff(result);

  const { homeTeam, awayTeam, homeLogo, awayLogo } = getDisplayMatch(
    result,
    clubName,
    clubLogo
  );

  return (
    <div className="bg-white">
      <div className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-[#f2f2f2]">
        <span className="text-[11px] sm:text-xs font-bold text-gray-600">
          {fmtDate(dateStr)}
        </span>
        <span className="text-gray-300 text-xs">|</span>
        <span className="text-[10px] sm:text-[11px] text-gray-400 truncate">
          {league}
        </span>
      </div>

      <div className="px-3 sm:px-5 py-4 sm:py-5">
        <div className="flex items-center">
          <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-[13px] sm:text-sm md:text-base font-bold text-[#1a1a1a] truncate text-right">
              {homeTeam}
            </span>
            <TeamBadge name={homeTeam} logoUrl={homeLogo} size="lg" />
          </div>

          <div className="flex-shrink-0 mx-2 sm:mx-4 flex items-center gap-1.5 sm:gap-2">
            <span className="text-lg sm:text-xl font-extrabold text-[#1a1a1a]">
              {result.homeScore ?? "-"}
            </span>
            <span className="text-gray-300 text-sm font-bold">-</span>
            <span className="text-lg sm:text-xl font-extrabold text-[#1a1a1a]">
              {result.awayScore ?? "-"}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <TeamBadge name={awayTeam} logoUrl={awayLogo} size="lg" />
            <span className="text-[13px] sm:text-sm md:text-base font-bold text-[#1a1a1a] truncate">
              {awayTeam}
            </span>
          </div>

          <button className="flex-shrink-0 ml-2 sm:ml-4 text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const imgDim =
    size === "lg"
      ? "w-6 h-6 md:w-8 md:h-8"
      : "w-4 h-4 md:w-5 md:h-5";

  const textSize =
    size === "lg"
      ? "text-[9px] md:text-[10px]"
      : "text-[8px] md:text-[9px]";

  const safeLogo = resolveAssetUrl(logoUrl);

  return (
    <div
      className={`${dim} rounded-full bg-gray-100 items-center justify-center flex-shrink-0`}
    >
      {safeLogo ? (
        <img src={safeLogo} alt={name} className={`${imgDim} object-contain`} />
      ) : (
        <span className={`${textSize} font-extrabold text-gray-400`}>
          {name.substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

