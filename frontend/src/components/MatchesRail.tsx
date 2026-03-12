"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";

const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

/* ── helpers ── */
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

function fmtDateShort(d?: string | null) {
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

function pickLeague(x: any) {
  return x?.competition?.name || x?.competitionName || x?.league || "League";
}

function pickKickoff(x: any) {
  return x?.kickoff || x?.date || x?.scheduledAt || null;
}

function pickHomeTeamName(x: any) {
  return x?.homeTeamName || x?.homeTeam?.name || x?.home || "TBD";
}

function pickAwayTeamName(x: any) {
  return x?.awayTeamName || x?.awayTeam?.name || x?.away || "TBD";
}

function getOpponentLogoUrl(x: any) {
  return resolveAssetUrl(
    x?.opponentLogoUrl ||
      x?.opponentLogo?.publicUrl ||
      x?.opponentLogo?.url ||
      x?.opponentLogo?.path ||
      ""
  );
}

function getMatchLogos(x: any) {
  const isHome = Boolean(x?.isHome);

  const clubLogoOnHomeSide = resolveAssetUrl(
    x?.homeTeamLogo || x?.homeTeam?.logo?.url || ""
  );
  const clubLogoOnAwaySide = resolveAssetUrl(
    x?.awayTeamLogo || x?.awayTeam?.logo?.url || ""
  );
  const opponentLogo = getOpponentLogoUrl(x);

  const homeLogo = isHome ? clubLogoOnHomeSide : opponentLogo;
  const awayLogo = isHome ? opponentLogo : clubLogoOnAwaySide;

  return {
    homeLogo: homeLogo || null,
    awayLogo: awayLogo || null,
  };
}

function isResultMatch(x: any) {
  const hs = x?.homeScore;
  const as = x?.awayScore;
  const status = String(x?.status || "").toUpperCase();
  return (
    (hs !== null && hs !== undefined && as !== null && as !== undefined) ||
    status === "FT"
  );
}

/* team badge: hidden on mobile */
function TeamBadge({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 items-center justify-center flex-shrink-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name}
          className="w-6 h-6 md:w-8 md:h-8 object-contain"
        />
      ) : (
        <span className="text-[9px] md:text-[10px] font-extrabold text-gray-400">
          {String(name || "").substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function MatchCard({
  match,
  ticketsUrl,
  fixturesPageHref,
  mode,
}: {
  match: any;
  ticketsUrl: string;
  fixturesPageHref: string;
  mode: "fixtures" | "results";
}) {
  const homeTeam = pickHomeTeamName(match);
  const awayTeam = pickAwayTeamName(match);
  const { homeLogo, awayLogo } = getMatchLogos(match);
  const league = pickLeague(match);
  const dateStr = pickKickoff(match);

  const played = mode === "results" ? true : isResultMatch(match);

  return (
    <div className="snap-start w-[300px] sm:w-[320px] bg-white rounded-xl border border-black/10 shadow-[0_10px_24px_rgba(0,0,0,0.08)] overflow-hidden flex-shrink-0">
      {/* Competition header */}
      <div className="px-5 pt-5 pb-3 text-center">
        <div className="text-[12px] font-extrabold text-[#2b2b2b] tracking-wide">
          {league}
        </div>
        <div className="mt-2 text-[12px] text-[#777]">
          {fmtDateShort(dateStr)}, {fmtTime(dateStr)}
          {match.venue ? `, ${match.venue}` : ""}
        </div>
      </div>

      {/* Score/time row */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-center gap-3">
          <TeamBadge name={homeTeam} logoUrl={homeLogo} />

          {played ? (
            <div className="flex items-center gap-2">
              <span className="text-3xl font-extrabold text-[#111]">
                {match.homeScore ?? "-"}
              </span>
              <span className="text-[#bbb] font-extrabold text-xl">-</span>
              <span className="text-3xl font-extrabold text-[#111]">
                {match.awayScore ?? "-"}
              </span>
            </div>
          ) : (
            <div className="px-4 py-2 bg-[#1a1a2e] rounded-sm">
              <span className="text-white font-extrabold text-[14px] tracking-wide">
                {fmtTime(dateStr)}
              </span>
            </div>
          )}

          <TeamBadge name={awayTeam} logoUrl={awayLogo} />
        </div>

        <div className="mt-3 text-center text-[12px] font-extrabold text-[#111] tracking-wide uppercase">
          {homeTeam} <span className="text-[#999] font-bold">vs</span> {awayTeam}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-6 flex justify-center">
        {mode === "results" ? (
          <Link
            href={`${fixturesPageHref}?tab=results`}
            className="inline-flex items-center justify-center px-10 py-3 rounded-full border border-[#ddd] text-[11px] font-extrabold tracking-[0.12em] uppercase text-[#333] hover:bg-[#f6f6f6] transition"
          >
            Match Review
          </Link>
        ) : (
          <Link
            href={ticketsUrl}
            className="inline-flex items-center justify-center px-10 py-3 rounded-full border border-[#ddd] text-[11px] font-extrabold tracking-[0.12em] uppercase text-[#333] hover:bg-[#f6f6f6] transition"
          >
            Ticket Info
          </Link>
        )}
      </div>
    </div>
  );
}

type RailTab = "fixtures" | "results";

export function MatchesRail({
  fixtures,
  results,
  ticketsUrl,
  fixturesPageHref = "/fixtures",
  title = "Matches",
  defaultTab = "fixtures",
  maxCards = 8,
}: {
  fixtures: any[];
  results: any[];
  ticketsUrl: string;
  fixturesPageHref?: string;
  title?: string;
  defaultTab?: RailTab;
  maxCards?: number;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [tab, setTab] = useState<RailTab>(defaultTab);

  const fixtureItems = useMemo(
    () => (Array.isArray(fixtures) ? fixtures : []).slice(0, maxCards),
    [fixtures, maxCards]
  );
  const resultItems = useMemo(
    () => (Array.isArray(results) ? results : []).slice(0, maxCards),
    [results, maxCards]
  );

  const items = tab === "fixtures" ? fixtureItems : resultItems;

  useEffect(() => {
    if (railRef.current) {
      railRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
  }, [tab]);

  if (!fixtureItems.length && !resultItems.length) return null;

  const scrollByCards = (dir: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    const amt = 360;
    el.scrollBy({ left: dir === "left" ? -amt : amt, behavior: "smooth" });
  };

  return (
    <section className="bg-[#f3f3f3] border-t border-black/5">
      <div className="container-ms py-12 md:py-14">
        {/* Header row */}
        <div className="flex items-end justify-between mb-6 gap-4">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111] uppercase">
              {title}
            </h2>

            {/* Tabs */}
            <div className="inline-flex rounded-lg overflow-hidden border border-black/10 bg-white">
              <button
                onClick={() => setTab("fixtures")}
                className={[
                  "px-4 sm:px-5 py-2 text-[11px] font-extrabold tracking-[0.12em] uppercase transition",
                  tab === "fixtures"
                    ? "bg-[#111] text-white"
                    : "bg-white text-[#111]/60 hover:text-[#111]",
                ].join(" ")}
              >
                Fixtures
              </button>
              <button
                onClick={() => setTab("results")}
                className={[
                  "px-4 sm:px-5 py-2 text-[11px] font-extrabold tracking-[0.12em] uppercase transition",
                  tab === "results"
                    ? "bg-[#111] text-white"
                    : "bg-white text-[#111]/60 hover:text-[#111]",
                ].join(" ")}
              >
                Results
              </button>
            </div>

            <Link
              href={fixturesPageHref}
              className="hidden sm:inline text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#111]/60 hover:text-[#111] transition"
            >
              All Matches
            </Link>
          </div>

          {/* Nav buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => scrollByCards("left")}
              aria-label="Scroll left"
              className="h-12 w-12 rounded-lg bg-[#444] text-white/90 hover:bg-[#555] transition flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 18l-6-6 6-6"
                />
              </svg>
            </button>
            <button
              onClick={() => scrollByCards("right")}
              aria-label="Scroll right"
              className="h-12 w-12 rounded-lg bg-brand text-ink hover:opacity-95 transition flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 18l6-6-6-6"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile ALL MATCHES link */}
        <div className="sm:hidden mb-4">
          <Link
            href={fixturesPageHref}
            className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#111]/60 hover:text-[#111] transition"
          >
            All Matches →
          </Link>
        </div>
      </div>

      {/* Rail */}
      {items.length ? (
        <div className="w-screen relative left-1/2 -translate-x-1/2">
          <div
            ref={railRef}
            className="flex gap-6 overflow-x-auto pb-10 scroll-smooth snap-x snap-mandatory px-4 sm:px-6 lg:px-10"
          >
            {items.map((m: any, i: number) => (
              <MatchCard
                key={m?.id || i}
                match={m}
                ticketsUrl={ticketsUrl}
                fixturesPageHref={fixturesPageHref}
                mode={tab}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="container-ms pb-14">
          <div className="py-10 text-center text-[#111]/60 font-semibold">
            {tab === "fixtures" ? "No upcoming fixtures" : "No results yet"}
          </div>
        </div>
      )}
    </section>
  );
}