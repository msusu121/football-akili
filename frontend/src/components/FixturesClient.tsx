"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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

function isTabType(value: string | null): value is TabType {
  return value === "fixtures" || value === "results" || value === "tables";
}

function LogoOrFallback({
  src,
  alt,
  sizes,
  fallbackText,
  imageClassName = "object-contain p-1",
  fallbackTextClassName = "text-[9px] font-extrabold text-gray-400",
}: {
  src?: string;
  alt: string;
  sizes: string;
  fallbackText: string;
  imageClassName?: string;
  fallbackTextClassName?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={imageClassName}
      />
    );
  }

  return <span className={fallbackTextClassName}>{fallbackText}</span>;
}

export function FixturesClient({ data }: FixturesClientProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("fixtures");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (isTabType(tab)) setActiveTab(tab);
  }, [searchParams]);

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
                        <FixtureCard key={fix.id || i} fix={fix} />
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
                        <ResultCard key={result.id || i} result={result} />
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
                          <th className="py-3 px-2 sm:px-3 text-center w-12 font-extrabold">
                            Pts
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.map((row: any, i: number) => {
                          const isMombasa = (row.teamName || row.team || "")
                            .toLowerCase()
                            .includes("mombasa");

                          const teamName = row.teamName || row.team || "Team";
                          const teamLogo = resolveAssetUrl(row.logo?.url || row.logoUrl);

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
                                  <div className="hidden sm:flex relative w-7 h-7 rounded-full bg-gray-100 items-center justify-center flex-shrink-0 overflow-hidden">
                                    <LogoOrFallback
                                      src={teamLogo}
                                      alt={teamName}
                                      sizes="28px"
                                      fallbackText={teamName.substring(0, 2).toUpperCase()}
                                      imageClassName="object-contain p-1"
                                      fallbackTextClassName="text-[9px] font-bold text-gray-400"
                                    />
                                  </div>

                                  <span
                                    className={`text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none ${
                                      isMombasa
                                        ? "text-[#2563eb] font-extrabold"
                                        : "text-gray-800"
                                    }`}
                                  >
                                    {teamName}
                                  </span>
                                </div>
                              </td>

                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">
                                {row.played ?? row.p ?? "-"}
                              </td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">
                                {row.won ?? row.w ?? "-"}
                              </td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">
                                {row.drawn ?? row.d ?? "-"}
                              </td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">
                                {row.lost ?? row.l ?? "-"}
                              </td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm">
                                {row.goalDifference ?? row.gd ?? "-"}
                              </td>
                              <td className="py-2.5 sm:py-3 px-2 sm:px-3 text-center text-xs sm:text-sm font-extrabold">
                                {row.points ?? row.pts ?? "-"}
                              </td>
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

/* ── Fixture Card ── */
function FixtureCard({ fix }: { fix: any }) {
  const homeTeam = fix.homeTeamName || "TBD";
  const awayTeam = fix.awayTeamName || "TBD";
  const league = fix.competitionName || fix.league || "League";
  const dateStr = fix.kickoff || fix.date || fix.scheduledAt;

  const isHome = Boolean(fix.isHome);
  const clubLogoOnHomeSide = resolveAssetUrl(fix.homeTeamLogo || "");
  const clubLogoOnAwaySide = resolveAssetUrl(fix.awayTeamLogo || "");
  const opponentLogo = resolveAssetUrl(fix.opponentLogoUrl || "");

  const homeLogo = isHome ? clubLogoOnHomeSide : opponentLogo;
  const awayLogo = isHome ? opponentLogo : clubLogoOnAwaySide;

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
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Result Card ── */
function ResultCard({ result }: { result: any }) {
  const homeTeam = result.homeTeamName || "TBD";
  const awayTeam = result.awayTeamName || "TBD";
  const league = result.competitionName || result.league || "League";
  const dateStr = result.kickoff || result.date || result.scheduledAt;

  const isHome = Boolean(result.isHome);
  const clubLogoOnHomeSide = resolveAssetUrl(result.homeTeamLogo || "");
  const clubLogoOnAwaySide = resolveAssetUrl(result.awayTeamLogo || "");
  const opponentLogo = resolveAssetUrl(result.opponentLogoUrl || "");

  const homeLogo = isHome ? clubLogoOnHomeSide : opponentLogo;
  const awayLogo = isHome ? opponentLogo : clubLogoOnAwaySide;

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
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
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
  const wrapDim =
    size === "lg"
      ? "hidden sm:flex relative w-8 h-8 lg:w-14 lg:h-14"
      : "hidden sm:flex relative w-6 h-6 lg:w-10 lg:h-10";

  const imageSizes =
    size === "lg"
      ? "(max-width: 1023px) 32px, 56px"
      : "(max-width: 1023px) 24px, 40px";

  const textSize =
    size === "lg"
      ? "text-[9px] lg:text-[12px]"
      : "text-[8px] lg:text-[10px]";

  return (
    <div
      className={`${wrapDim} rounded-full bg-gray-100 items-center justify-center flex-shrink-0 overflow-hidden`}
    >
      <LogoOrFallback
        src={logoUrl}
        alt={name}
        sizes={imageSizes}
        fallbackText={name.substring(0, 2).toUpperCase()}
        imageClassName="object-contain p-1"
        fallbackTextClassName={`${textSize} font-extrabold text-gray-400`}
      />
    </div>
  );
}