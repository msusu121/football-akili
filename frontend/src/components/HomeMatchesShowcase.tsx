"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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

function fmtLongDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

  const homeTeamLogo = resolveAssetUrl(
    x?.homeTeamLogo || x?.homeTeam?.logo?.url || ""
  );
  const awayTeamLogo = resolveAssetUrl(
    x?.awayTeamLogo || x?.awayTeam?.logo?.url || ""
  );
  const opponentLogo = getOpponentLogoUrl(x);

  const homeLogo = isHome ? homeTeamLogo : opponentLogo;
  const awayLogo = isHome ? opponentLogo : awayTeamLogo;

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

/* ── rotating background ── */
function RotatingBackground({
  images,
  intervalMs = 6000,
}: {
  images: string[];
  intervalMs?: number;
}) {
  const safe = images.filter(Boolean);
  const [idx, setIdx] = useState(() =>
    safe.length ? Math.floor(Math.random() * safe.length) : 0
  );

  useEffect(() => {
    if (safe.length <= 1) return;
    const t = window.setInterval(
      () => setIdx((v) => (v + 1) % safe.length),
      intervalMs
    );
    return () => window.clearInterval(t);
  }, [safe.length, intervalMs]);

  if (!safe.length) return <div className="absolute inset-0 bg-black" />;

  return (
    <div className="absolute inset-0">
      {safe.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className={[
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
            i === idx ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

/* ── Team badge ── */
function TeamBadge({
  name,
  logoUrl,
  size = "lg",
  dark = false,
}: {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "lg";
  dark?: boolean;
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

  return (
    <div
      className={`${dim} rounded-full items-center justify-center flex-shrink-0 ${
        dark ? "bg-white/15" : "bg-gray-100"
      }`}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className={`${imgDim} object-contain`} />
      ) : (
        <span
          className={`${textSize} font-extrabold ${
            dark ? "text-white/60" : "text-gray-400"
          }`}
        >
          {String(name || "").substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

/* ── Home showcase ── */
export function HomeMatchesShowcase({
  latestResult,
  fixtures,
  results,
  ticketsUrl,
  fixturesPageHref = "/fixtures",
  bgImages,
}: {
  latestResult: any | null;
  fixtures: any[];
  results: any[];
  ticketsUrl: string;
  fixturesPageHref?: string;
  bgImages: string[];
}) {
  const railRef = useRef<HTMLDivElement | null>(null);

  const railItems = useMemo(() => {
    const r = Array.isArray(results) ? results : [];
    const f = Array.isArray(fixtures) ? fixtures : [];
    const recentResults = r.slice(0, 2);
    const nextFixtures = f.slice(0, 6);
    return [...recentResults, ...nextFixtures].slice(0, 8);
  }, [results, fixtures]);

  const scrollByCards = (dir: "left" | "right") => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  };

  const showResultHero = !!latestResult;
  const heroHomeTeam = latestResult ? pickHomeTeamName(latestResult) : "";
  const heroAwayTeam = latestResult ? pickAwayTeamName(latestResult) : "";
  const heroLogos = latestResult ? getMatchLogos(latestResult) : { homeLogo: null, awayLogo: null };

  return (
    <>
      {showResultHero && (
        <section className="relative w-full overflow-hidden">
          <RotatingBackground images={bgImages} intervalMs={6500} />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/55" />

          <div className="relative">
            <div className="container-ms py-14 md:py-20">
              <div className="flex flex-col items-center text-center">
                <div className="text-white/85 text-sm md:text-base font-semibold tracking-wide">
                  {pickLeague(latestResult)}
                </div>

                <div className="mt-4 inline-flex items-center justify-center px-5 py-2 border border-white/30 bg-black/30 rounded-sm">
                  <span className="text-white font-extrabold text-sm tracking-widest uppercase">
                    FT
                  </span>
                </div>

                <div className="mt-8 md:mt-10 flex items-center justify-center gap-4 md:gap-8 flex-wrap">
                  <div className="flex items-center justify-end gap-3 min-w-0">
                    <span className="text-white font-extrabold uppercase tracking-tight text-3xl sm:text-4xl md:text-6xl truncate max-w-[42vw] sm:max-w-none">
                      {heroHomeTeam}
                    </span>
                    <TeamBadge
                      name={heroHomeTeam}
                      logoUrl={heroLogos.homeLogo}
                      size="lg"
                      dark
                    />
                  </div>

                  <div className="flex items-center gap-3 md:gap-5">
                    <span className="text-white font-extrabold text-5xl sm:text-6xl md:text-7xl">
                      {latestResult.homeScore ?? "-"}
                    </span>
                    <span className="text-white/50 font-extrabold text-4xl sm:text-5xl md:text-6xl">
                      -
                    </span>
                    <span className="text-white font-extrabold text-5xl sm:text-6xl md:text-7xl">
                      {latestResult.awayScore ?? "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 min-w-0">
                    <TeamBadge
                      name={heroAwayTeam}
                      logoUrl={heroLogos.awayLogo}
                      size="lg"
                      dark
                    />
                    <span className="text-white font-extrabold uppercase tracking-tight text-3xl sm:text-4xl md:text-6xl truncate max-w-[42vw] sm:max-w-none">
                      {heroAwayTeam}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-white/75 text-sm md:text-base">
                  {fmtLongDate(pickKickoff(latestResult))}
                  {latestResult.venue ? `, ${latestResult.venue}` : ""}
                </div>

                <Link
                  href={`${fixturesPageHref}?tab=results`}
                  className="mt-8 inline-flex items-center justify-center px-10 py-3 rounded-full bg-brand text-ink font-extrabold text-[11px] tracking-[0.15em] uppercase hover:opacity-95 transition"
                >
                  MATCH REVIEW
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {railItems.length > 0 && (
        <section className="bg-[#f3f3f3] border-t border-black/5">
          <div className="container-ms py-12 md:py-14">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-6">
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#111] uppercase">
                  Matches
                </h2>
                <Link
                  href={fixturesPageHref}
                  className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#111]/60 hover:text-[#111] transition"
                >
                  All Matches
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollByCards("left")}
                  aria-label="Scroll left"
                  className="h-12 w-12 rounded-lg bg-[#444] text-white/90 hover:bg-[#555] transition flex items-center justify-center"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollByCards("right")}
                  aria-label="Scroll right"
                  className="h-12 w-12 rounded-lg bg-brand text-ink hover:opacity-95 transition flex items-center justify-center"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>

            <div
              ref={railRef}
              className="flex gap-6 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory"
            >
              {railItems.map((m: any, i: number) => (
                <MatchCard
                  key={m?.id || i}
                  match={m}
                  ticketsUrl={ticketsUrl}
                  fixturesPageHref={fixturesPageHref}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/* ── Match Card ── */
function MatchCard({
  match,
  ticketsUrl,
  fixturesPageHref,
}: {
  match: any;
  ticketsUrl: string;
  fixturesPageHref: string;
}) {
  const homeTeam = pickHomeTeamName(match);
  const awayTeam = pickAwayTeamName(match);
  const league = pickLeague(match);
  const dateStr = pickKickoff(match);
  const { homeLogo, awayLogo } = getMatchLogos(match);
  const played = isResultMatch(match);

  return (
    <div className="snap-start w-[300px] sm:w-[320px] bg-white rounded-xl border border-black/10 shadow-[0_10px_24px_rgba(0,0,0,0.08)] overflow-hidden flex-shrink-0">
      <div className="px-5 pt-5 pb-3 text-center">
        <div className="text-[12px] font-extrabold text-[#2b2b2b] tracking-wide">
          {league}
        </div>
        <div className="mt-2 text-[12px] text-[#777]">
          {fmtDateShort(dateStr)}, {fmtTime(dateStr)}
          {match.venue ? `, ${match.venue}` : ""}
        </div>
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-center justify-center gap-3">
          <TeamBadge name={homeTeam} logoUrl={homeLogo} size="lg" />

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

          <TeamBadge name={awayTeam} logoUrl={awayLogo} size="lg" />
        </div>

        <div className="mt-3 text-center text-[12px] font-extrabold text-[#111] tracking-wide uppercase">
          {homeTeam} <span className="text-[#999] font-bold">vs</span> {awayTeam}
        </div>
      </div>

      <div className="px-5 pb-6 flex justify-center">
        {played ? (
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