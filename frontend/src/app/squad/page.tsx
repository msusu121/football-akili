// ============================================================
// FILE: frontend/src/app/squad/page.tsx
// REPLACE your existing squad/page.tsx with this
// Matches Murang'a Seal team layout:
//   - TEAMS / STAFF tabs with orange underline
//   - Team sub-tabs (Men's First Team, Women's, Youth)
//   - Sections: GOALKEEPERS, DEFENDERS, MIDFIELDERS, FORWARDS
//   - Player cards: portrait photo, jersey number badge,
//     last name bold, first name muted, orange accent bar,
//     position in small tracked uppercase
//   - Clean, no filters, responsive grid
// ============================================================

import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";

function toTitle(s: string) {
  return (s || "").toUpperCase();
}

export default async function SquadPage({
  searchParams,
}: {
  searchParams?: { tab?: string; team?: string };
}) {
  const home = await apiGet<any>("/public/home");

  const isStaff = searchParams?.tab === "staff";
  const teamParam = searchParams?.team;

  const team =
    teamParam === "womens"
      ? "Women's First Team"
      : teamParam === "youth"
      ? "Youth"
      : "Men's First Team";

  const data = isStaff
    ? await apiGet<any>("/team?isStaff=true")
    : await apiGet<any>(`/team?team=${encodeURIComponent(team)}`);

  const sections = Object.entries(data.grouped || {});

  return (
    <SiteShell
      settings={home.settings}
      socials={home.socials}
      sponsors={home.sponsors}
    >
      <section className="container-ms py-10 md:py-14">
        {/* ── Tab bar: TEAMS / STAFF ── */}
        <div className="flex items-center gap-0 border-b border-line">
          <Link
            href="/squad"
            className={`px-6 py-4 font-extrabold text-sm tracking-wide border-b-[3px] transition-colors ${
              !isStaff
                ? "border-brand text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            TEAMS
          </Link>
          <Link
            href="/squad?tab=staff"
            className={`px-6 py-4 font-extrabold text-sm tracking-wide border-b-[3px] transition-colors ${
              isStaff
                ? "border-brand text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            STAFF
          </Link>
        </div>

        {/* ── Team sub-tabs (only show when not staff) ── */}
        {!isStaff && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {[
              { label: "Men's First Team", value: "mens" },
              { label: "Women's First Team", value: "womens" },
              { label: "Youth", value: "youth" },
            ].map((t) => {
              const isActive =
                (!teamParam && t.value === "mens") || teamParam === t.value;
              return (
                <Link
                  key={t.value}
                  href={`/squad?team=${t.value}`}
                  className={`rounded-full px-5 py-2 text-xs font-bold tracking-wide transition-colors ${
                    isActive
                      ? "bg-ink text-white"
                      : "bg-[#f0ede6] text-muted hover:bg-ink/10 hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* ── Current selection label ── */}
        <div className="mt-4 text-sm text-muted">
          {isStaff ? "Coaching & Management Staff" : team}
        </div>

        {/* ── Sections: GOALKEEPERS, DEFENDERS, etc. ── */}
        <div className="mt-10 space-y-16">
          {sections.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted text-sm">
                No {isStaff ? "staff" : "players"} found for this selection.
              </p>
            </div>
          )}

          {sections.map(([label, members]: any) => (
            <div key={label}>
              {/* Section title */}
              <h2 className="h-serif text-4xl md:text-5xl font-extrabold text-ink leading-none">
                {toTitle(label)}
              </h2>
              <div className="mt-3 h-[4px] w-16 bg-[#f4c11a] rounded-full" />

              {/* Player/Staff grid */}
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m: any) => (
                  <Link
                    key={m.slug}
                    href={`/team/${m.slug}`}
                    className="group bg-white rounded-2xl border border-line overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Portrait */}
                    <div className="relative h-[340px] bg-gradient-to-b from-[#f5f3ee] to-[#e8e5dd] overflow-hidden">
                      {m.portraitUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.portraitUrl}
                          alt={m.fullName}
                          className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="h-serif text-7xl text-ink/5 font-bold">
                            MU
                          </span>
                        </div>
                      )}

                      {/* Jersey number badge */}
                      {m.jerseyNo && (
                        <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white shadow-md grid place-items-center">
                          <span className="font-extrabold text-ink text-lg leading-none">
                            {m.jerseyNo}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="p-5">
                      {/* Last name large, first name(s) smaller */}
                      <div className="text-xl font-extrabold text-ink leading-tight">
                        {m.fullName?.split(" ").slice(-1)[0] || m.fullName}
                      </div>
                      <div className="mt-0.5 text-sm text-muted">
                        {m.fullName?.split(" ").slice(0, -1).join(" ") || ""}
                      </div>

                      {/* Orange accent bar */}
                      <div className="mt-4 h-[3px] w-8 bg-brand rounded-full" />

                      {/* Position */}
                      <div className="mt-3 text-[10px] font-extrabold tracking-[0.25em] uppercase text-muted">
                        {m.position || (isStaff ? "STAFF" : "")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
