// ============================================================
// FILE: frontend/src/app/squad/page.tsx
// DROP-IN REPLACEMENT — Squad
//
// ✅ 2 cards mobile, 4 cards desktop
// ✅ Cards ALWAYS same height (fixed poster frame heights)
// ✅ Crops bottom/right to force uniform look (keeps top-left visible)
// ✅ No info section under posters
// ✅ Groups: Goalkeepers / Defenders / Midfielders / Forwards
// ============================================================

import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";

type Member = {
  id: string;
  slug: string;
  fullName: string;
  jerseyNo?: string | null;
  position?: string | null;
  team?: string | null;
  isStaff?: boolean;
  portraitUrl?: string | null;
};

function initials(fullName: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || parts[0]?.[1] || "";
  return (a + b).toUpperCase();
}

function roleGroupFromPosition(
  pos?: string | null
): "Goalkeepers" | "Defenders" | "Midfielders" | "Forwards" | "Others" {
  const p = String(pos || "").trim();
  if (!p) return "Others";

  const up = p.toUpperCase();
  const low = p.toLowerCase();

  if (up === "GK") return "Goalkeepers";
  if (["CB", "LB", "RB", "LWB", "RWB", "DF"].includes(up)) return "Defenders";
  if (["DM", "CM", "AM", "MF"].includes(up)) return "Midfielders";
  if (["ST", "CF", "FW", "LW", "RW", "WG"].includes(up)) return "Forwards";

  if (low.includes("goal") || low.includes("keeper")) return "Goalkeepers";
  if (low.includes("defend") || low.includes("back")) return "Defenders";
  if (low.includes("mid")) return "Midfielders";
  if (low.includes("striker") || low.includes("forward") || low.includes("wing")) return "Forwards";

  return "Others";
}

const ROLE_ORDER = ["Goalkeepers", "Defenders", "Midfielders", "Forwards", "Others"] as const;

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

  const data: any = isStaff
    ? await apiGet("/team?isStaff=true")
    : await apiGet(`/team?team=${encodeURIComponent(team)}`);

  const flat: Member[] = Object.values(data?.grouped || {}).flatMap((arr: any) => arr || []);

  const grouped = flat.reduce<Record<string, Member[]>>((acc, m) => {
    const key = isStaff ? "Staff" : roleGroupFromPosition(m.position);
    acc[key] = acc[key] || [];
    acc[key].push(m);
    return acc;
  }, {});

  const sectionKeys = Object.keys(grouped).sort((a, b) => {
    const ai = ROLE_ORDER.indexOf(a as any);
    const bi = ROLE_ORDER.indexOf(b as any);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const heroTitle = isStaff
    ? "Staff"
    : teamParam === "womens"
    ? "Women"
    : teamParam === "youth"
    ? "Youth"
    : "Men";

  return (
    <SiteShell settings={home?.settings} socials={home?.socials} sponsors={home?.sponsors}>
      {/* Hero */}
      <section className="bg-white border-b border-line">
        <div className="container-ms py-8 md:py-10">
          <div className="border-l-[3px] border-[color:var(--brand)] pl-4">
            <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-[0.12em] text-ink">
              {heroTitle}
            </h1>
            <div className="mt-2 h-[3px] w-12 rounded-full bg-[color:var(--brand-accent)]" />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b border-line sticky top-[56px] md:top-[92px] z-30">
        <div className="container-ms">
          <div className="flex gap-0">
            <Link
              href="/squad"
              className={`relative px-5 py-3.5 text-[12px] font-extrabold tracking-[0.18em] uppercase transition-colors ${
                !isStaff ? "text-brand" : "text-muted hover:text-ink"
              }`}
            >
              FIRST TEAM
              {!isStaff && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[color:var(--brand-accent)]" />
              )}
            </Link>

            <Link
              href="/squad?tab=staff"
              className={`relative px-5 py-3.5 text-[12px] font-extrabold tracking-[0.18em] uppercase transition-colors ${
                isStaff ? "text-brand" : "text-muted hover:text-ink"
              }`}
            >
              STAFF
              {isStaff && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[color:var(--brand-accent)]" />
              )}
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="page-pattern py-8 md:py-12">
        <div className="container-ms">
          {sectionKeys.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted text-sm">No {isStaff ? "staff" : "players"} found.</p>
            </div>
          )}

          {sectionKeys.map((label) => {
            const members = grouped[label] || [];

            return (
              <div key={label} className="mb-10 md:mb-14">
                <div className="border-l-[3px] border-[color:var(--brand)] pl-4 mb-6">
                  <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-[0.15em] text-ink">
                    {label}
                  </h2>
                </div>

                {/* Grid: 2 mobile, 4 desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl overflow-hidden border border-line shadow-sm hover:shadow-md transition-shadow"
                    >
                      {/* ✅ Fixed heights => ALL cards same height no matter image */}
                      <div className="relative bg-[color:var(--ink)] overflow-hidden">
                        <div className="h-[250px] sm:h-[290px] md:h-[310px] lg:h-[330px] w-full">
                          {m.portraitUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.portraitUrl}
                              alt={m.fullName}
                              className="block w-full h-full object-cover object-left-top"
                              loading="lazy"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full grid place-items-center bg-[color:var(--paper)]">
                              <div className="h-14 w-14 rounded-full bg-[color:var(--brand)] text-white grid place-items-center font-extrabold">
                                {initials(m.fullName)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Bottom gold accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[color:var(--brand-accent)]" />
                      </div>

                      {/* ✅ No info section below */}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}