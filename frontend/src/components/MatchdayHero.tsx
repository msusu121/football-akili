"use client";

import Link from "next/link";
import { MatchClock } from "@/components/MatchClock";

const NAIROBI_TZ = "Africa/Nairobi";

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

function parseKickoffMs(raw?: string | null) {
  if (!raw) return NaN;

  const s = String(raw).trim();
  if (!s) return NaN;

  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/* helpers */
function fmtLongDate(d?: string | null) {
  if (!d) return "";

  const ms = parseKickoffMs(d);
  if (!Number.isFinite(ms)) return "";

  return new Date(ms).toLocaleDateString("en-GB", {
    timeZone: NAIROBI_TZ,
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
    x?.homeTeam?.logo?.url || x?.homeTeamLogo || ""
  );
  const clubLogoOnAwaySide = resolveAssetUrl(
    x?.awayTeam?.logo?.url || x?.awayTeamLogo || ""
  );
  const opponentLogo = getOpponentLogoUrl(x);

  const homeLogo = isHome ? clubLogoOnHomeSide : opponentLogo;
  const awayLogo = isHome ? opponentLogo : clubLogoOnAwaySide;

  return {
    homeLogo: homeLogo || null,
    awayLogo: awayLogo || null,
  };
}

function pickLeague(x: any) {
  return x?.competition?.name || x?.competitionName || x?.league || "League";
}

function pickKickoff(x: any) {
  return x?.kickoff || x?.date || x?.scheduledAt || null;
}

function TeamBadge({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl?: string | null;
}) {
  return (
    <div className="flex w-12 h-12 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full bg-white/18 backdrop-blur-[3px] border border-white/20 items-center justify-center flex-shrink-0 overflow-hidden shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="w-8 h-8 sm:w-8 sm:h-8 md:w-11 md:h-11 lg:w-14 lg:h-14 object-contain"
        />
      ) : (
        <span className="text-[10px] sm:text-[10px] md:text-[12px] lg:text-[14px] font-extrabold text-white/75">
          {String(name || "").substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function TeamBlock({
  side,
  name,
  logoUrl,
  nameCls,
}: {
  side: "home" | "away";
  name: string;
  logoUrl?: string | null;
  nameCls: string;
}) {
  if (side === "home") {
    return (
      <div className="min-w-0 text-center sm:text-right">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3 md:gap-4">
          <TeamBadge name={name} logoUrl={logoUrl} />
          <div className={nameCls}>{name}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 text-center sm:text-left">
      <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-center sm:gap-3 md:gap-4">
        <TeamBadge name={name} logoUrl={logoUrl} />
        <div className={nameCls}>{name}</div>
      </div>
    </div>
  );
}

export function MatchdayHero({
  fixture,
  ticketsUrl,
  bgImageUrl,
}: {
  fixture: any;
  ticketsUrl: string;
  bgImageUrl: string;
}) {
  if (!fixture) return null;

  const homeTeam = pickTeamName(fixture, "home");
  const awayTeam = pickTeamName(fixture, "away");
  const { homeLogo, awayLogo } = getMatchLogos(fixture);
  const league = pickLeague(fixture);
  const kickoff = pickKickoff(fixture);
  const resolvedBg = resolveAssetUrl(bgImageUrl);

  const kickoffMs = kickoff ? parseKickoffMs(String(kickoff)) : NaN;
  const nowMs = Date.now();
  const liveWindowMs = 135 * 60 * 1000;
  const statusNorm = String(fixture?.status || "").toUpperCase();

  const inferred =
    statusNorm === "FT" || statusNorm === "FULL_TIME"
      ? "POST"
      : statusNorm === "LIVE" || statusNorm === "IN_PROGRESS"
      ? "LIVE"
      : Number.isFinite(kickoffMs) && nowMs < kickoffMs
      ? "PRE"
      : Number.isFinite(kickoffMs) &&
        nowMs >= kickoffMs &&
        nowMs <= kickoffMs + liveWindowMs
      ? "LIVE"
      : "POST";

  const ctaHref =
    inferred === "PRE"
      ? ticketsUrl || "/tickets"
      : inferred === "LIVE"
      ? "/fixtures?tab=fixtures"
      : "/fixtures?tab=results";

  const ctaLabel =
    inferred === "PRE"
      ? "TICKET INFO"
      : inferred === "LIVE"
      ? "MATCH CENTRE"
      : "MATCH REPORT";

  const nameCls = [
    "text-white font-extrabold uppercase",
    "tracking-[-0.02em]",
    "leading-[1.02]",
    "whitespace-normal",
    "break-words",
    "text-balance",
    "text-[clamp(0.95rem,4vw,3.8rem)]",
    "max-w-[11ch] sm:max-w-none",
  ].join(" ");

  const clockNode = kickoff ? (
    <MatchClock kickoffISO={String(kickoff)} status={fixture?.status || null} />
  ) : (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-black/35 border border-white/25 rounded-sm">
      <span className="text-white font-extrabold text-[11px] tracking-[0.18em] uppercase">
        TBC
      </span>
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolvedBg} alt="" className="w-full h-full object-cover" />
      </div>

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
                MATCHDAY
              </span>
            </div>

            <div className="mt-6 sm:mt-8 md:mt-10 w-full max-w-[1180px]">
              <div
                className="grid items-center gap-3 sm:gap-6 md:gap-8"
                style={{
                  gridTemplateColumns: "minmax(0,1fr) minmax(104px,170px) minmax(0,1fr)",
                }}
              >
                <TeamBlock
                  side="home"
                  name={homeTeam}
                  logoUrl={homeLogo}
                  nameCls={nameCls}
                />

                <div className="flex justify-center">{clockNode}</div>

                <TeamBlock
                  side="away"
                  name={awayTeam}
                  logoUrl={awayLogo}
                  nameCls={nameCls}
                />
              </div>

              <div className="mt-4 sm:mt-6 h-px w-full bg-white/10" />
            </div>

            <div className="mt-4 text-white/75 text-[11px] sm:text-sm md:text-base">
              {fmtLongDate(kickoff)}
              {fixture.venue ? `, ${fixture.venue}` : ""}
            </div>

            <Link
              href={ctaHref}
              className="mt-6 sm:mt-8 inline-flex items-center justify-center px-8 sm:px-10 py-3 rounded-full bg-brand text-ink font-extrabold text-[11px] tracking-[0.15em] uppercase hover:opacity-95 transition"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
