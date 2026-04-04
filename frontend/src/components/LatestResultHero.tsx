"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import Image from "next/image";

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

function pickStructuredLogo(x: any, side: "home" | "away") {
  return resolveAssetUrl(
    side === "home"
      ? x?.homeTeam?.logo?.url || x?.homeTeamLogo || null
      : x?.awayTeam?.logo?.url || x?.awayTeamLogo || null
  );
}

function pickDisplayedLogos(x: any) {
  const isHome = Boolean(x?.isHome);

  const homeStructured = pickStructuredLogo(x, "home");
  const awayStructured = pickStructuredLogo(x, "away");
  const opponentLogo = resolveAssetUrl(
    x?.opponentLogo?.url || x?.opponentLogoUrl || null
  );

  const homeLogo = isHome
    ? homeStructured || awayStructured
    : homeStructured || opponentLogo;

  const awayLogo = isHome
    ? awayStructured || opponentLogo
    : opponentLogo || awayStructured;

  return {
    homeLogo: homeLogo || undefined,
    awayLogo: awayLogo || undefined,
  };
}

function pickLeague(x: any) {
  return x?.competition?.name || x?.competitionName || x?.league || "League";
}

function pickKickoff(x: any) {
  return x?.kickoff || x?.date || x?.scheduledAt || null;
}

/* rotating background */
function RotatingBackground({
  images,
  intervalMs = 6500,
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
        <Image
          key={`${src}-${i}`}
          src={src}
          alt=""
          fill
          sizes="100vw"
          className={[
            "absolute inset-0 object-cover transition-opacity duration-700",
            i === idx ? "opacity-100" : "opacity-0",
          ].join(" ")}
          priority={i === idx}
        />
      ))}
    </div>
  );
}

/* Team badge — desktop only */
function TeamBadge({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const resolved = resolveAssetUrl(logoUrl);

  return (
    <div className="hidden lg:flex h-14 w-14 rounded-full border border-white/18 bg-white/12 backdrop-blur-[2px] items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      {resolved ? (
        <Image
          src={resolved}
          alt={name}
          width={44}
          height={44}
          sizes="56px"
          className="h-11 w-11 object-contain"
        />
      ) : (
        <span className="text-[11px] font-extrabold text-white/70 tracking-wide">
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
  const { homeLogo, awayLogo } = pickDisplayedLogos(latestResult);
  const league = pickLeague(latestResult);
  const kickoff = pickKickoff(latestResult);

  const nameCls = [
    "text-white font-extrabold uppercase",
    "tracking-[-0.015em]",
    "leading-[1.08]",
    "py-0.5",
    "whitespace-normal",
    "break-words",
    "text-[clamp(0.95rem,3vw,3.4rem)]",
    "sm:leading-[1.02]",
    "sm:py-1",
    "sm:line-clamp-2",
    "text-balance",
  ].join(" ");

  const scoreCls =
    "text-white font-extrabold text-[clamp(1.8rem,6vw,4.6rem)] tabular-nums";
  const dashCls =
    "text-white/50 font-extrabold text-[clamp(1.4rem,4.8vw,3.6rem)]";

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

            <div className="mt-6 sm:mt-8 md:mt-10 w-full max-w-[1100px]">
              <div
                className="grid items-center gap-2.5 sm:gap-6 md:gap-8"
                style={{
                  gridTemplateColumns:
                    "minmax(0,1fr) minmax(92px,160px) minmax(0,1fr)",
                }}
              >
                <div className="min-w-0 text-right">
                  <div className="flex items-center justify-end gap-2 sm:gap-3 lg:gap-4">
                    <div className={nameCls}>{homeTeam}</div>
                    <TeamBadge name={homeTeam} logoUrl={homeLogo} />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  <span className={scoreCls}>{latestResult.homeScore ?? "-"}</span>
                  <span className={dashCls}>-</span>
                  <span className={scoreCls}>{latestResult.awayScore ?? "-"}</span>
                </div>

                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
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

            {false ? (
              <Link
                href={`${fixturesPageHref}?tab=results`}
                className="mt-6 sm:mt-8 inline-flex items-center justify-center px-8 sm:px-10 py-3 rounded-full bg-brand text-ink font-extrabold text-[11px] tracking-[0.15em] uppercase hover:opacity-95 transition"
              >
                MATCH REVIEW
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LatestResultHero;
