import Link from "next/link";
import { MatchClock } from "@/components/MatchClock";

const NAIROBI_TZ = "Africa/Nairobi";

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
  const homeLogo = pickLogo(fixture, "home");
  const awayLogo = pickLogo(fixture, "away");
  const league = pickLeague(fixture);
  const kickoff = pickKickoff(fixture);

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
    inferred === "PRE" ? "" : inferred === "LIVE" ? "MATCH CENTRE" : "MATCH REPORT";

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
        <img src={bgImageUrl} alt="" className="w-full h-full object-cover" />
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

            <div className="mt-6 sm:mt-8 md:mt-10 w-full max-w-[1100px]">
              <div
                className="grid items-center gap-2.5 sm:gap-6 md:gap-8"
                style={{
                  gridTemplateColumns: "minmax(0,1fr) minmax(92px,130px) minmax(0,1fr)",
                }}
              >
                <div className="min-w-0 text-right">
                  <div className="flex items-center justify-end gap-2 sm:gap-3">
                    <div className={nameCls}>{homeTeam}</div>
                    <TeamBadge name={homeTeam} logoUrl={homeLogo} />
                  </div>
                </div>

                <div className="flex justify-center">{clockNode}</div>

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