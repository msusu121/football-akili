import Link from "next/link";

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
function fmtTime(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
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

/* logos hidden on mobile */
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

  return (
    <section className="relative w-full overflow-hidden">
      {/* single background */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgImageUrl} alt="" className="w-full h-full object-cover" />
      </div>

      {/* overlay for readability */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/55" />

      {/* content */}
      <div className="relative">
        <div className="container-ms py-14 md:py-20">
          <div className="flex flex-col items-center text-center">
            <div className="text-white/85 text-sm md:text-base font-semibold tracking-wide">
              {league}
            </div>

            <div className="mt-4 inline-flex items-center justify-center px-5 py-2 border border-white/30 bg-black/30 rounded-sm">
              <span className="text-white font-extrabold text-sm tracking-widest uppercase">
                MATCHDAY
              </span>
            </div>

            {/* TEAM LOGO VS LOGO TEAM (logos hidden on mobile) */}
            <div className="mt-8 md:mt-10 flex items-center justify-center gap-4 md:gap-8 flex-wrap">
              <div className="flex items-center justify-end gap-3 min-w-0">
                <span className="text-white font-extrabold uppercase tracking-tight text-3xl sm:text-4xl md:text-6xl truncate max-w-[42vw] sm:max-w-none">
                  {homeTeam}
                </span>
                <TeamBadge name={homeTeam} logoUrl={homeLogo} />
              </div>

              <div className="px-4 py-2 bg-black/35 border border-white/25 rounded-sm">
                <span className="text-white font-extrabold text-[12px] md:text-[14px] tracking-wide">
                  {fmtTime(kickoff)}
                </span>
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <TeamBadge name={awayTeam} logoUrl={awayLogo} />
                <span className="text-white font-extrabold uppercase tracking-tight text-3xl sm:text-4xl md:text-6xl truncate max-w-[42vw] sm:max-w-none">
                  {awayTeam}
                </span>
              </div>
            </div>

            <div className="mt-4 text-white/75 text-sm md:text-base">
              {fmtLongDate(kickoff)}
              {fixture.venue ? `, ${fixture.venue}` : ""}
            </div>

            <Link
              href={ticketsUrl || "/tickets"}
              className="mt-8 inline-flex items-center justify-center px-10 py-3 rounded-full bg-brand text-ink font-extrabold text-[11px] tracking-[0.15em] uppercase hover:opacity-95 transition"
            >
              TICKET INFO
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}