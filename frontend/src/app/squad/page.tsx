// ============================================================
// FILE: frontend/src/app/squad/page.tsx
// DROP-IN REPLACEMENT — Mombasa United squad layout
//
// ✅ 2 cards mobile, 4 cards desktop
// ✅ Images never look "too big" (fixed height, object-contain, padded)
// ✅ Brand Blue + Gold (uses CSS tokens from globals.css)
// ✅ Groups players into: Goalkeepers / Defenders / Midfielders / Forwards
// ✅ NO position initials shown on cards (as requested)
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

function splitName(fullName: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { first: "", last: parts[0] || fullName };
  const last = parts[parts.length - 1] || "";
  const first = parts.slice(0, -1).join(" ");
  return { first, last };
}

// If someone accidentally saved "JACK WATTE JACK WATTE", this cleans it.
function dedupeName(fullName: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const mid = Math.floor(parts.length / 2);
    const a = parts.slice(0, mid).join(" ").toLowerCase();
    const b = parts.slice(mid).join(" ").toLowerCase();
    if (a && a === b) return parts.slice(0, mid).join(" ");
  }
  return fullName;
}

function initials(fullName: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || parts[0]?.[1] || "";
  return (a + b).toUpperCase();
}

/**
 * ✅ Upload-friendly grouping:
 * Accepts either codes (GK/CB/ST/AM...) OR full words (Goalkeeper/Defender/Striker...)
 */
function roleGroupFromPosition(pos?: string | null): "Goalkeepers" | "Defenders" | "Midfielders" | "Forwards" | "Others" {
  const p = String(pos || "").trim();
  if (!p) return "Others";

  const up = p.toUpperCase();
  const low = p.toLowerCase();

  // direct code matches
  if (up === "GK") return "Goalkeepers";
  if (["CB", "LB", "RB", "LWB", "RWB", "DF"].includes(up)) return "Defenders";
  if (["DM", "CM", "AM", "MF"].includes(up)) return "Midfielders";
  if (["ST", "CF", "FW", "LW", "RW", "WG"].includes(up)) return "Forwards";

  // word matches
  if (low.includes("goal")) return "Goalkeepers";
  if (low.includes("keeper")) return "Goalkeepers";

  if (low.includes("defend") || low.includes("back")) return "Defenders";
  if (low.includes("mid")) return "Midfielders";

  if (low.includes("striker") || low.includes("forward") || low.includes("wing")) return "Forwards";

  return "Others";
}

const ROLE_ORDER: Array<Member["isStaff"] extends true ? "Staff" : any> = [
  "Goalkeepers",
  "Defenders",
  "Midfielders",
  "Forwards",
  "Others",
];

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

  // Backend returns grouped by position. We flatten and regroup cleanly for UI.
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
            <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-wider text-ink">
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
              {!isStaff && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[color:var(--brand-accent)]" />}
            </Link>

            <Link
              href="/squad?tab=staff"
              className={`relative px-5 py-3.5 text-[12px] font-extrabold tracking-[0.18em] uppercase transition-colors ${
                isStaff ? "text-brand" : "text-muted hover:text-ink"
              }`}
            >
              STAFF
              {isStaff && <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[color:var(--brand-accent)]" />}
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
                {/* Section title */}
                <div className="border-l-[3px] border-[color:var(--brand)] pl-4 mb-6">
                  <h2 className="text-lg md:text-xl font-extrabold uppercase tracking-[0.15em] text-ink">
                    {label}
                  </h2>
                </div>

                {/* Grid: 2 mobile, 4 desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {members.map((m) => {
                    const cleanName = dedupeName(m.fullName);
                    const { first, last } = splitName(cleanName);

                    return (
                      <div
                        key={m.id}
                        className="group bg-white rounded-2xl overflow-hidden border border-line shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Photo box: fixed height + contain */}
                        <div className="relative bg-[color:var(--paper)]">
                          <div className="h-[210px] sm:h-[230px] md:h-[245px] lg:h-[255px] w-full overflow-hidden">
                            {m.portraitUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={m.portraitUrl}
                                alt={cleanName}
                                className="w-full h-full object-contain p-3 group-hover:scale-[1.02] transition-transform duration-500"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center">
                                <div className="h-14 w-14 rounded-full bg-[color:var(--brand)] text-white grid place-items-center font-extrabold">
                                  {initials(cleanName)}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Bottom gold accent */}
                          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[color:var(--brand-accent)]" />
                        </div>

                        {/* Info */}
                       
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </SiteShell>
  );
}