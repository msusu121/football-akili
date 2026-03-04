// ============================================================
// FILE: frontend/src/app/squad/page.tsx
// Man Utd-inspired squad layout — UPGRADED
//
// ✅ Dark header/footer via SiteShell (page content stays light)
// ✅ Passport-style headshots, shirt number, first/last name split
// ✅ 5-column responsive grid (2 mobile, 3 tablet, 5 desktop)
// ✅ iPhone 12 responsive fix
// ✅ All backend integration preserved (apiGet)
// ============================================================

import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export default async function SquadPage({
  searchParams,
}: {
  searchParams?: { tab?: string; team?: string };
}) {
  const home: any = await apiGet("/public/home");

  const isStaff = searchParams?.tab === "staff";
  const teamParam = searchParams?.team;

  const team =
    teamParam === "womens"
      ? "Women's First Team"
      : teamParam === "youth"
      ? "Youth"
      : "Men's First Team";

  const data = isStaff
    ? await apiGet("/team?isStaff=true")
    : await apiGet(`/team?team=${encodeURIComponent(team)}`);

  const sections = Object.entries((data as any).grouped || {});

  return (
    <SiteShell settings={home?.settings} socials={home?.socials} sponsors={home?.sponsors}>
      {/* Hero — compact like Man Utd */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 md:py-12">
          <div className="border-l-[3px] border-[#e02b20] pl-4">
            <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-wider text-[#1a1a1a]">
              Men
            </h1>
          </div>
        </div>
      </section>

      {/* Tab bar — sticky below header */}
      <section className="bg-white border-b border-gray-200 sticky top-[56px] md:top-[92px] z-30">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex gap-0">
            <Link
              href="/squad"
              className={`relative px-5 py-3.5 text-[12px] font-bold tracking-[0.18em] uppercase transition-colors ${
                !isStaff
                  ? "text-[#e02b20]"
                  : "text-gray-400 hover:text-[#1a1a1a]"
              }`}
            >
              FIRST TEAM
              {!isStaff && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e02b20]" />
              )}
            </Link>
            <Link
              href="/squad?tab=staff"
              className={`relative px-5 py-3.5 text-[12px] font-bold tracking-[0.18em] uppercase transition-colors ${
                isStaff
                  ? "text-[#e02b20]"
                  : "text-gray-400 hover:text-[#1a1a1a]"
              }`}
            >
              STAFF
              {isStaff && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e02b20]" />
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* Player/Staff sections */}
      <section className="bg-[#f5f5f5] py-8 md:py-12">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          {sections.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-sm">
                No {isStaff ? "staff" : "players"} found.
              </p>
            </div>
          )}

          {sections.map(([label, members]: any) => (
            <div key={label} className="mb-10 md:mb-14">
              {/* Section title — red left border */}
              <div className="border-l-[3px] border-[#e02b20] pl-4 mb-6">
                <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-[0.15em] text-[#1a1a1a]">
                  {label}
                </h2>
              </div>

              {/* Grid — 2 cols mobile, 3 tablet, 5 desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3">
                {members.map((m: any) => {
                  const lastName =
                    m.fullName?.split(" ").slice(-1)[0] || m.fullName;
                  const firstName =
                    m.fullName?.split(" ").slice(0, -1).join(" ") || "";

                  return (
                    <Link
                      href={`/squad/${m.slug || m.id}`}
                      key={m.id || m.fullName}
                      className="group bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* Photo — compact passport style */}
                      <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-50 to-gray-100 overflow-hidden">
                        {m.portraitUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.portraitUrl}
                            alt={m.fullName}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                            No photo
                          </div>
                        )}
                        {/* Red bottom accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e02b20]" />
                      </div>

                      {/* Info */}
                      <div className="px-2.5 py-2.5">
                        {m.jerseyNo && (
                          <span className="text-[11px] font-bold text-[#e02b20] tracking-wider">
                            {m.jerseyNo}
                          </span>
                        )}
                        <div className="mt-0.5">
                          <span className="block text-[10px] text-gray-400 uppercase tracking-wider leading-tight">
                            {firstName}
                          </span>
                          <span className="block text-[12px] md:text-[13px] font-extrabold uppercase tracking-wider leading-tight text-[#1a1a1a]">
                            {lastName}
                          </span>
                        </div>
                        {isStaff && m.position && (
                          <span className="block mt-1 text-[10px] text-gray-400 uppercase tracking-wider">
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
