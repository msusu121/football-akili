// ============================================================
// FILE: frontend/src/app/page.tsx
// DROP-IN REPLACEMENT — Mombasa United FC homepage
//
// USES EXISTING COMPONENTS ONLY:
//   - SiteShell (Navbar + Celebration + Partnerships + Footer)
//   - HighlightsSection (video gallery)
//   - HomeShopSection (kit showcase)
//
// BRAND: Blue (#0a1628), Yellow/Gold (#d4a017), Black
// All classes use your globals.css tokens (bg-brand, text-brand,
// text-muted, border-line, h-serif, dark-section, container-ms)
// ============================================================

import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import { HomeShopSection } from "@/components/HomeShopSection";
import { HighlightsSection } from "@/components/HighlightsSection";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtFixtureDate(d?: string | null) {
  if (!d) return "";
  return new Date(d)
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
}

function fmtTime(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function getMembershipPlans() {
  try {
    const res = await fetch(`${API}/membership/plans`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.plans || [];
  } catch {
    return [];
  }
}

const tierMeta: Record<string, { color: string; bg: string }> = {
  BASIC:  { color: "#0a1628", bg: "rgba(10,22,40,.06)" },
  BRONZE: { color: "#92400e", bg: "rgba(146,64,14,.06)" },
  SILVER: { color: "#475569", bg: "rgba(71,85,105,.06)" },
  GOLD:   { color: "#d4a017", bg: "rgba(212,160,23,.08)" },
};

export default async function HomePage() {
  const [data, plans] = await Promise.all([
    apiGet<any>("/public/home"),
    getMembershipPlans(),
  ]);

  const featured = data.featured;
  const latest = (data.latestNews || []) as any[];
  const side = latest.filter((n: any) => n.slug !== featured?.slug).slice(0, 4);
  const fixtures = (data.fixtures || data.upcomingFixtures || []) as any[];

  return (
    <SiteShell
      settings={data.settings}
      socials={data.socials}
      sponsors={data.sponsors}
    >
      {/* ══════════════════════════════════════════════════════════
          1. FEATURED NEWS + SIDE ARTICLES
          ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-[1180px] px-4 pt-10 pb-6">
        <div className="grid gap-6 md:grid-cols-12">
          {/* Big featured card */}
          <div className="md:col-span-8">
            {featured ? (
              <Link href={`/news/${featured.slug}`} className="group block">
                <div className="rounded-card overflow-hidden shadow-hero bg-white card-lift">
                  <div className="relative aspect-[16/9] bg-ink/10">
                    {featured.heroMedia?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.heroMedia.url}
                        alt={featured.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-ink to-ink-light flex items-center justify-center">
                        <span className="text-[100px] font-extrabold text-white/5 select-none">MU</span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                    <div className="absolute left-6 md:left-8 bottom-6 md:bottom-8 right-6 md:right-10">
                      <span className="inline-flex items-center rounded bg-brand text-ink text-[10px] font-extrabold px-3 py-1 tracking-wider">
                        FEATURED
                      </span>
                      <div className="mt-3 h-serif text-white font-extrabold text-3xl md:text-5xl leading-[1.05]">
                        {featured.title}
                      </div>
                      <div className="mt-4 flex items-center gap-4 text-white/70 text-sm">
                        <span>{fmtDate(featured.publishedAt)}</span>
                        <span className="inline-flex items-center gap-1 text-brand font-bold group-hover:underline">
                          Read Article →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>

          {/* Side news cards */}
          <div className="md:col-span-4 flex flex-col gap-3">
            {side.map((n: any) => (
              <Link
                key={n.slug}
                href={`/news/${n.slug}`}
                className="group block bg-white rounded-xl border border-line shadow-card hover:shadow-soft transition overflow-hidden card-lift"
              >
                <div className="grid grid-cols-3">
                  <div className="col-span-1 bg-ink/5 min-h-[96px]">
                    {n.heroMedia?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={n.heroMedia.url}
                        alt={n.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-ink/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-ink/10">MU</span>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 p-4">
                    <div className="text-[11px] font-extrabold tracking-wide text-muted uppercase">
                      {fmtDate(n.publishedAt)}
                    </div>
                    <div className="mt-1.5 font-extrabold leading-snug line-clamp-2 text-ink group-hover:text-ink-light transition-colors">
                      {n.title}
                    </div>
                    <div className="mt-2.5 text-[11px] font-extrabold text-brand tracking-wider">
                      READ MORE &nbsp;›
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* More News link */}
        <div className="flex justify-end mt-8">
          <Link
            href="/news"
            className="group inline-flex items-center gap-3 text-xs font-extrabold tracking-[0.2em] text-ink/50 hover:text-ink transition"
          >
            MORE NEWS
            <span className="h-10 w-10 rounded-full border border-ink/10 grid place-items-center group-hover:border-brand group-hover:text-brand transition">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          2. LATEST HIGHLIGHTS (existing component — dark section)
          ══════════════════════════════════════════════════════════ */}
      <HighlightsSection highlights={data.highlights || []} />

      {/* ══════════════════════════════════════════════════════════
          3. UPCOMING FIXTURES
          ══════════════════════════════════════════════════════════ */}
      {fixtures.length > 0 && (
        <section className="bg-white border-t border-line">
          <div className="mx-auto max-w-[1180px] px-4 py-16">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="h-serif text-4xl md:text-5xl font-extrabold text-ink tracking-tight">
                  UPCOMING FIXTURES
                </h2>
                <div className="mt-2 h-[3px] w-14 bg-brand rounded-full" />
              </div>
              <Link
                href="/fixtures"
                className="hidden sm:inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.15em] text-ink/50 hover:text-brand transition"
              >
                VIEW ALL →
              </Link>
            </div>

            <div className="space-y-3">
              {fixtures.slice(0, 4).map((fix: any, i: number) => {
                const homeTeam = fix.homeTeam?.name || fix.homeTeamName || fix.home || "TBD";
                const awayTeam = fix.awayTeam?.name || fix.awayTeamName || fix.away || "TBD";
                const league = fix.competition?.name || fix.competitionName || fix.league || "League";
                const venue = fix.venue?.name || fix.venueName || fix.venue || "";
                const dateStr = fix.kickoff || fix.date || fix.scheduledAt;
                const awayLogo = fix.awayTeam?.logo?.url || fix.awayTeamLogo || null;

                return (
                  <div
                    key={fix.id || i}
                    className="bg-white rounded-xl border border-line overflow-hidden hover:shadow-soft transition-shadow card-lift"
                  >
                    {/* Dark header bar */}
                    <div className="flex items-center justify-between px-5 py-2.5 bg-ink">
                      <span className="text-white/70 text-[11px] font-extrabold tracking-[0.15em] uppercase">
                        {league}
                      </span>
                      <span className="text-brand text-[11px] font-extrabold tracking-[0.12em]">
                        {fmtFixtureDate(dateStr)} · {fmtTime(dateStr)}
                      </span>
                    </div>

                    {/* Match row */}
                    <div className="px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Home team badge placeholder */}
                        <div className="h-11 w-11 rounded-full bg-ink/5 border border-line flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-extrabold text-ink/40">
                            {homeTeam.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-ink text-[15px]">{homeTeam}</p>
                          <p className="text-sm text-muted mt-0.5">
                            vs <span className="font-bold text-ink/70">{awayTeam}</span>
                          </p>
                        </div>
                      </div>

                      {venue && (
                        <div className="flex items-center gap-2 text-muted text-xs">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                          </svg>
                          <span>{venue}</span>
                        </div>
                      )}

                      {awayLogo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={awayLogo} alt={awayTeam} className="h-11 w-11 object-contain shrink-0" />
                      )}

                      <Link
                        href={data.settings?.ticketsUrl || "/tickets"}
                        className="shrink-0 px-6 py-2.5 bg-brand text-ink text-[11px] font-extrabold tracking-[0.12em] uppercase rounded-lg hover:bg-brand-dark transition-colors"
                      >
                        Buy Tickets
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          4. KIT SHOWCASE (existing component)
          ══════════════════════════════════════════════════════════ */}
      <HomeShopSection
        kits={data.kits || []}
        shopImageUrl={data.settings?.homeShopImage?.url}
        shopUrl={data.settings?.shopUrl || "/shop"}
      />

      {/* ══════════════════════════════════════════════════════════
          5. MEMBERSHIP CTA + PLANS GRID
          ══════════════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1180px] px-4 pb-20 pt-8">
          {/* Banner — team photo background */}
          <div className="overflow-hidden rounded-2xl border border-line shadow-soft">
            <div className="relative h-[140px] md:h-[160px] bg-ink">
              {data.settings?.homeMembershipImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.settings.homeMembershipImage.url}
                  alt="Membership"
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink-light to-ink" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />

              <div className="relative h-full flex items-center justify-between px-6 md:px-10">
                <div className="text-white">
                  <div className="text-[11px] font-extrabold tracking-[0.25em] text-brand">
                    FOREVER {data.settings?.clubName || "MOMBASA UNITED"}
                  </div>
                  <div className="mt-2 h-serif text-3xl md:text-4xl font-extrabold text-white">
                    2025/26{" "}
                    <span className="text-brand">MEMBERSHIP</span>
                  </div>
                </div>

                <Link
                  href={data.settings?.membershipUrl || "/membership"}
                  className="inline-flex items-center gap-2 bg-brand text-ink font-extrabold px-8 py-4 rounded-lg hover:bg-brand-dark transition-colors shadow-glow"
                >
                  BUY NOW <span className="text-lg">›</span>
                </Link>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand" />
            </div>
          </div>

          {/* Membership tier cards */}
          {plans.length > 0 && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan: any) => {
                const meta = tierMeta[plan.tier] || tierMeta.BASIC;
                const benefits: string[] = Array.isArray(plan.benefits) ? plan.benefits : [];

                return (
                  <div
                    key={plan.id}
                    className="relative rounded-2xl border border-line bg-white p-6 card-lift group"
                    style={{ borderTopColor: meta.color, borderTopWidth: "3px" }}
                  >
                    {plan.tier === "GOLD" && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-extrabold tracking-widest uppercase text-ink bg-brand shadow-glow">
                        Most Popular
                      </div>
                    )}

                    <div className="mt-1">
                      <span
                        className="inline-block text-[10px] font-extrabold tracking-[0.2em] uppercase px-2 py-0.5 rounded"
                        style={{ color: meta.color, background: meta.bg }}
                      >
                        {plan.tier}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-extrabold text-ink">{plan.name}</h3>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-ink">
                        {plan.price === 0 ? "FREE" : `KES ${plan.price.toLocaleString()}`}
                      </span>
                      <span className="text-xs text-muted">
                        {plan.price === 0 ? "" : "/season"}
                      </span>
                    </div>

                    <div className="mt-4 h-px bg-line" />

                    <ul className="mt-4 space-y-2.5">
                      {benefits.slice(0, 5).map((b: string) => (
                        <li key={b} className="flex items-start gap-2.5 text-sm text-ink/75">
                          <span
                            className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-white text-[9px]"
                            style={{ backgroundColor: meta.color }}
                          >
                            ✓
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={data.settings?.membershipUrl || "/membership"}
                      className="mt-6 block w-full text-center text-[11px] font-extrabold tracking-[0.12em] uppercase py-3 rounded-lg border-2 transition-all group-hover:shadow-card"
                      style={{
                        borderColor: meta.color,
                        color: meta.color,
                      }}
                    >
                      {plan.price === 0 ? "Register Free" : "Join Now"}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Partnerships + Footer handled by SiteShell */}
    </SiteShell>
  );
}
