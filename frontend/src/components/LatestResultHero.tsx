// FILE: frontend/src/components/LatestResultHero.tsx
// Premium MU-style Latest Result hero (FT) — same mobile-safe typography strategy as MatchdayHero
//
// ✅ 3-column layout on ALL screens (Home | Score | Away)
// ✅ Center column width constrained on mobile so names never lose letters
// ✅ No truncation on mobile (prevents clipped letters). Clamp starts at sm+
// ✅ Logos hidden on mobile
// ✅ Rotating background preserved

"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from "next/image";

/* helpers */
function fmtLongDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function pickTeamName(x: any, side: "home" | "away") {
  return side === "home"
    ? x?.homeTeam?.name || x?.homeTeamName || x?.home || "TBD"
    : x?.awayTeam?.name || x?.awayTeamName || x?.away || "TBD";
}

function pickLogo(x: any, side: "home" | "away") {
  return side === "home"
    ? x?.homeTeam?.logo?.url || x?.homeTeamLogo || null
    : x?.awayTeam?.logo?.url || x?.awayTeamLogo || null;
}

function pickLeague(x: any) {
  return x?.competition?.name || x?.competitionName || x?.league || "League";
}

function pickKickoff(x: any) {
  return x?.kickoff || x?.date || x?.scheduledAt || null;
}

/* rotating background */
function RotatingBackground({ images, intervalMs = 6500 }: { images: string[]; intervalMs?: number }) {
  const safe = images.filter(Boolean);
  const [idx, setIdx] = useState(() => (safe.length ? Math.floor(Math.random() * safe.length) : 0));

  useEffect(() => {
    if (safe.length <= 1) return;
    const t = window.setInterval(() => setIdx((v) => (v + 1) % safe.length), intervalMs);
    return () => window.clearInterval(t);
  }, [safe.length, intervalMs]);

  if (!safe.length) return <div className="absolute inset-0 bg-black" />;

  return (
    <div className="absolute inset-0">
      {safe.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <Image
          key={`${src}-${i}`} // in case same image appears multiple times
          src={src} 
          alt=""
          fill
          sizes="100vw"   
          className={[
            "absolute inset-0 object-cover transition-opacity duration-700",
            i === idx ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />  
      ))}
    </div>
  );
}

/* Team badge — logos hidden on mobile */
function TeamBadge({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  return (
    <div className="hidden sm:flex w-9 h-9 md:w-12 md:h-12 rounded-full bg-white/15 items-center justify-center flex-shrink-0">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="w-7 h-7 md:w-9 md:h-9 object-contain" />
      ) : (
        <span className="text-[10px] md:text-[11px] font-extrabold text-white/60">
          {String(name || "").substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export function LatestResultHero({
  latestResult,
  fixturesPageHref = "/fixtures",
  bgImages,
}: {
  latestResult: any | null;
  fixturesPageHref?: string;
  bgImages: string[];
}) {
  if (!latestResult) return null;

  const homeTeam = pickTeamName(latestResult, "home");
  const awayTeam = pickTeamName(latestResult, "away");
  const homeLogo = pickLogo(latestResult, "home");
  const awayLogo = pickLogo(latestResult, "away");
  const league = pickLeague(latestResult);
  const kickoff = pickKickoff(latestResult);

  // ✅ Same mobile-safe name rules as MatchdayHero:
  // - mobile: no clamp, allow wrap (prevents missing letters)
  // - sm+: clamp to 2 lines to keep it neat
  const nameCls = [
    "text-white font-extrabold uppercase",
    "tracking-[-0.015em]",
    "leading-[1.08]",
    "py-0.5",
    "whitespace-normal",
    "break-words",
    "text-[clamp(0.95rem,3.0vw,3.4rem)]",
    "sm:leading-[1.02]",
    "sm:py-1",
    "sm:line-clamp-2",
    "text-balance",
  ].join(" ");

  // Compact score sizing on mobile
  const scoreCls = "text-white font-extrabold text-[clamp(1.8rem,6.0vw,4.6rem)] tabular-nums";
  const dashCls = "text-white/50 font-extrabold text-[clamp(1.4rem,4.8vw,3.6rem)]";

  return (
    <section className="relative w-full overflow-hidden">
      <RotatingBackground images={bgImages} intervalMs={6500} />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/55" />

      <div className="relative">
        <div className="container-ms py-9 sm:py-12 md:py-20">
          <div className="flex flex-col items-center text-center">
            <div className="text-white/85 text-[11px] sm:text-sm md:text-base font-semibold tracking-wide">
              {league}
            </div>

            <div className="mt-3 sm:mt-4 inline-flex items-center justify-center px-4 sm:px-5 py-2 border border-white/30 bg-black/30 rounded-sm">
              <span className="text-white font-extrabold text-[11px] sm:text-sm tracking-widest uppercase">
                FT
              </span>
            </div>

            {/* HOME | SCORE | AWAY (3-column always, center constrained on mobile) */}
            <div className="mt-6 sm:mt-8 md:mt-10 w-full max-w-[1100px]">
              <div
                className="grid items-center gap-2.5 sm:gap-6 md:gap-8"
                style={{
                  gridTemplateColumns: "minmax(0,1fr) minmax(92px,160px) minmax(0,1fr)", // ✅ prevents name clipping on small phones
                }}
              >
                {/* HOME */}
                <div className="min-w-0 text-right">
                  <div className="flex items-center justify-end gap-2 sm:gap-3">
                    <div className={nameCls}>{homeTeam}</div>
                    <TeamBadge name={homeTeam} logoUrl={homeLogo} />
                  </div>
                </div>

                {/* SCORE */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className={scoreCls}>{latestResult.homeScore ?? "-"}</span>
                  <span className={dashCls}>-</span>
                  <span className={scoreCls}>{latestResult.awayScore ?? "-"}</span>
                </div>

                {/* AWAY */}
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <TeamBadge name={awayTeam} logoUrl={awayLogo} />
                    <div className={nameCls}>{awayTeam}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 h-px w-full bg-white/10" />
            </div>

            <div className="mt-4 text-white/75 text-[11px] sm:text-sm md:text-base">
              {fmtLongDate(kickoff)}
              {latestResult.venue ? `, ${latestResult.venue}` : ""}
            </div>
{/*
            <Link
              href={`${fixturesPageHref}?tab=results`}
              className="mt-6 sm:mt-8 inline-flex items-center justify-center px-8 sm:px-10 py-3 rounded-full bg-brand text-ink font-extrabold text-[11px] tracking-[0.15em] uppercase hover:opacity-95 transition"
            >
              MATCH REVIEW
            </Link>   */}
          </div>
        </div>
      </div>
    </section>
  );
}