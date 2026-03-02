// ============================================================
// FILE: frontend/src/app/squad/page.tsx
// Man Utd-inspired squad layout:
//   - Clean "Men" title hero
//   - FIRST TEAM / STAFF tabs
//   - Sections: Goalkeepers, Defenders, Midfielders, Forwards
//   - Player cards: passport-style headshot, shirt number,
//     first name muted, last name bold
//   - 5-column responsive grid, minimal & premium
// ============================================================

import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";

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
      {/* Hero — compact like Man Utd */}
      <section className="bg-gradient-to-br from-brand to-ink-light py-12 md:py-16">
        <div className="container-ms">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">
            Men
          </h1>
        </div>
      </section>

      {/* Tab bar */}
      <div className="border-b border-line bg-card sticky top-16 z-40">
        <div className="container-ms">
          <div className="flex gap-0">
            <Link
              href="/squad"
              className={`px-6 py-4 font-sans text-xs font-extrabold tracking-[0.15em] border-b-[3px] transition-colors ${
                !isStaff
                  ? "border-brand text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              FIRST TEAM
            </Link>
            <Link
              href="/squad?tab=staff"
              className={`px-6 py-4 font-sans text-xs font-extrabold tracking-[0.15em] border-b-[3px] transition-colors ${
                isStaff
                  ? "border-brand text-ink"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              STAFF
            </Link>
          </div>
        </div>
      </div>

      {/* Player/Staff sections */}
      <section className="container-ms py-10 md:py-14">
        <div className="space-y-14">
          {sections.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted text-sm">
                No {isStaff ? "staff" : "players"} found.
              </p>
            </div>
          )}

          {sections.map(([label, members]: any) => (
            <div key={label}>
              {/* Section title — clean like Man Utd */}
              <h2 className="font-display text-2xl md:text-3xl font-bold text-ink tracking-tight mb-8">
                {label}
              </h2>

              {/* Grid — 5 columns on large screens */}
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {members.map((m: any) => {
                  const lastName = m.fullName?.split(" ").slice(-1)[0] || m.fullName;
                  const firstName = m.fullName?.split(" ").slice(0, -1).join(" ") || "";

                  return (
                    <Link
                      key={m.slug}
                      href={`/team/${m.slug}`}
                      className="group"
                    >
                      {/* Photo — passport style */}
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-b from-[#e8ecf4] to-[#d0d6e4]">
                        {m.portraitUrl ? (
                          <img
                            src={m.portraitUrl}
                            alt={m.fullName}
                            className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm text-muted">
                            No photo
                          </div>
                        )}

                        <div className="absolute inset-0 bg-brand/0 group-hover:bg-brand/5 transition-colors duration-300" />
                      </div>

                      {/* Info */}
                      <div className="mt-3 px-1">
                        {m.jerseyNo && (
                          <span className="font-sans text-xs text-brand font-bold">
                            {m.jerseyNo}
                          </span>
                        )}
                        <div className="flex flex-col leading-tight mt-0.5">
                          <span className="text-xs text-muted">
                            {firstName}
                          </span>
                          <span className="font-sans text-sm md:text-base font-extrabold text-ink tracking-tight">
                            {lastName}
                          </span>
                        </div>
                        {isStaff && m.position && (
                          <span className="text-[10px] font-sans tracking-[0.1em] uppercase text-brand font-bold mt-1 block">
                            {m.position}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
