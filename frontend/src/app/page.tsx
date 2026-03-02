// ============================================================
// FILE: frontend/src/app/page.tsx
// DROP-IN REPLACEMENT — Mombasa United FC homepage
//
// STRUCTURE (matches Manchester United homepage flow):
//   1. Full-width Hero Highlight (latest video/highlight — dark, immersive)
//   2. "TODAY ON MOMBASAUNITED.COM" — news articles list
//   3. "The Highlights" — horizontal video cards (full-width dark section)
//   4. Latest Match Result card (if available)
//   5. Upcoming Fixtures (conditional — hidden if none)
//   6. Kit Showcase (HomeShopSection — preserved as-is)
//   7. Membership CTA + Plans
//
// CONDITIONAL: If no upcoming fixtures, the Fixtures section is hidden
//              and the Highlights section appears more prominently.
//
// BRAND: Blue (#0a1628), Yellow/Gold (#d4a017), Black
// Uses globals.css tokens: bg-brand, text-brand, text-muted,
// border-line, h-serif, dark-section, container-ms
// ============================================================

import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import { HomeShopSection } from "@/components/HomeShopSection";
import { HighlightsSection } from "@/components/HighlightsSection";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/* ── helpers ── */
function fmtDate(d?: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
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
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function timeAgo(d?: string | null) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function getMembershipPlans() {
  try {
    const res = await fetch(`${API}/membership/plans`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.plans || [];
  } catch { return []; }
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
  const todayNews = latest.slice(0, 6);
  const moreNews = latest.slice(6, 10);
  const fixtures = (data.fixtures || data.upcomingFixtures || []) as any[];
  const highlights = (data.highlights || []) as any[];
  const latestResult = data.latestResult || null;
  const hasFixtures = fixtures.length > 0;

  // Hero highlight = first highlight or featured news
  const heroHighlight = highlights[0] || null;

  return (
    <SiteShell
      settings={data.settings}
      socials={data.socials}
      sponsors={data.sponsors}
    >
      <div className="homepage-bg relative min-h-screen">
        {/* Semi-transparent white overlay to keep text readable */}
        {/* Change /75 to /60 (more image visible) or /85 (more readable) */}
        

        {/* All content above the overlay */}
        <div className="relative z-10">

          {/* ══════════════════════════════════════════════════════════
              1. HERO HIGHLIGHT — Full-width dark immersive block
          ══════════════════════════════════════════════════════════ */}
          <section className="relative w-full bg-ink overflow-hidden">
            {/* Background image */}
            <div className="absolute inset-0">
              {heroHighlight?.thumbnail?.url || featured?.heroMedia?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroHighlight?.thumbnail?.url || featured?.heroMedia?.url}
                  alt=""
                  className="w-full h-full object-cover opacity-40"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-ink via-ink-light to-ink" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[200px] md:text-[300px] font-extrabold text-white/[0.02] select-none h-serif">
                MU
              </span>
            </div>

            {/* Content */}
            <div className="relative min-h-[480px] md:min-h-[580px] flex flex-col justify-end">
              <div className="container-ms pb-10 md:pb-14">
                {/* Play button if highlight */}
                {heroHighlight?.videoUrl && (
                  <Link
                    href={heroHighlight.videoUrl || `/highlights/${heroHighlight.slug || heroHighlight.id}`}
                    className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-brand text-ink mb-6 hover:scale-110 transition-transform shadow-glow"
                  >
                    <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </Link>
                )}

                <h1 className="h-serif text-white font-extrabold text-3xl sm:text-4xl md:text-6xl leading-[1.05] max-w-3xl">
                  {heroHighlight?.title || featured?.title || "WELCOME TO MOMBASA UNITED"}
                </h1>

                {(heroHighlight?.description || featured?.excerpt) && (
                  <p className="mt-4 text-white/70 text-sm md:text-base max-w-xl leading-relaxed">
                    {heroHighlight?.description || featured?.excerpt}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-4 text-white/50 text-xs font-bold tracking-wide">
                  <span>{timeAgo(heroHighlight?.publishedAt || featured?.publishedAt)}</span>
                  {heroHighlight?.category && (
                    <span className="px-2.5 py-0.5 rounded bg-white/10 text-white/70 uppercase tracking-[0.15em]">
                      {heroHighlight.category}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              2. "TODAY ON MOMBASAUNITED.COM" — News list
          ══════════════════════════════════════════════════════════ */}
          <section className="bg-white border-t border-line">
            <div className="container-ms py-12 md:py-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="h-serif text-2xl md:text-3xl font-extrabold text-ink tracking-tight uppercase">
                  Today on MombasaUnited.com
                </h2>
                <Link
                  href="/news"
                  className="hidden sm:inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-ink/50 hover:text-brand transition"
                >
                  MORE NEWS →
                </Link>
              </div>

              <div className="space-y-0 divide-y divide-line">
                {todayNews.map((article: any, i: number) => (
                  <Link
                    key={article.slug || i}
                    href={`/news/${article.slug}`}
                    className="group flex gap-4 py-4 hover:bg-ink/[0.02] -mx-2 px-2 rounded transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-28 h-20 sm:w-36 sm:h-24 rounded-lg overflow-hidden bg-ink/5 shrink-0">
                      {article.heroMedia?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={article.heroMedia.url}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-ink/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-ink/10">MU</span>
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-ink text-sm md:text-[15px] leading-snug line-clamp-2 group-hover:text-ink-light transition-colors">
                        {article.title}
                      </h3>
                      {article.excerpt && (
                        <p className="mt-1 text-muted text-xs line-clamp-2 hidden sm:block">
                          {article.excerpt}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                        <span>{timeAgo(article.publishedAt)}</span>
                        {article.category && (
                          <span className="text-brand font-bold uppercase tracking-wider">
                            {article.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Mobile MORE NEWS link */}
              <div className="sm:hidden mt-6 flex justify-center">
                <Link
                  href="/news"
                  className="inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.15em] uppercase text-brand hover:text-brand-dark transition"
                >
                  MORE NEWS →
                </Link>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              3. "THE HIGHLIGHTS" — Full-width dark video section
          ══════════════════════════════════════════════════════════ */}
          <HighlightsSection highlights={highlights} />

          {/* ══════════════════════════════════════════════════════════
              4. LATEST MATCH RESULT (if available)
          ══════════════════════════════════════════════════════════ */}
          {latestResult && (
            <section className="bg-ink border-t border-white/10">
              <div className="container-ms py-10 md:py-14">
                <div className="bg-white/[0.05] rounded-2xl border border-white/10 overflow-hidden">
                  {/* Competition bar */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
                    <span className="text-white/50 text-[10px] font-extrabold tracking-[0.2em] uppercase">
                      {latestResult.competition?.name || latestResult.league || "League"}
                    </span>
                    <span className="text-brand text-[11px] font-extrabold tracking-wide">
                      {fmtFixtureDate(latestResult.kickoff || latestResult.date)} · FT
                    </span>
                  </div>

                  {/* Score */}
                  <div className="px-5 py-8 flex items-center justify-center gap-6 sm:gap-10">
                    {/* Home team */}
                    <div className="flex flex-col items-center gap-2 text-center min-w-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center">
                        {latestResult.homeTeam?.logo?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={latestResult.homeTeam.logo.url} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-xs font-extrabold text-white/40">
                            {(latestResult.homeTeam?.name || latestResult.home || "HOM").substring(0, 3).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-white text-xs sm:text-sm font-bold truncate max-w-[100px]">
                        {latestResult.homeTeam?.name || latestResult.home || "Home"}
                      </span>
                    </div>

                    {/* Score display */}
                    <div className="flex items-center gap-3">
                      <span className="h-serif text-4xl sm:text-5xl font-extrabold text-white">
                        {latestResult.homeScore ?? "-"}
                      </span>
                      <span className="text-white/30 text-lg">-</span>
                      <span className="h-serif text-4xl sm:text-5xl font-extrabold text-white">
                        {latestResult.awayScore ?? "-"}
                      </span>
                    </div>

                    {/* Away team */}
                    <div className="flex flex-col items-center gap-2 text-center min-w-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/10 flex items-center justify-center">
                        {latestResult.awayTeam?.logo?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={latestResult.awayTeam.logo.url} alt="" className="w-10 h-10 object-contain" />
                        ) : (
                          <span className="text-xs font-extrabold text-white/40">
                            {(latestResult.awayTeam?.name || latestResult.away || "AWY").substring(0, 3).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-white text-xs sm:text-sm font-bold truncate max-w-[100px]">
                        {latestResult.awayTeam?.name || latestResult.away || "Away"}
                      </span>
                    </div>
                  </div>

                  {/* Match review CTA */}
                  <div className="border-t border-white/10 px-5 py-3 flex justify-center">
                    <Link
                      href={`/fixtures/${latestResult.id || ""}`}
                      className="text-brand text-[11px] font-extrabold tracking-[0.15em] uppercase hover:text-brand-2 transition"
                    >
                      MATCH REVIEW →
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════════
              5. UPCOMING FIXTURES (conditional — only if fixtures exist)
          ══════════════════════════════════════════════════════════ */}
          {hasFixtures && (
            <section className="bg-white border-t border-line">
              <div className="container-ms py-12 md:py-16">
                <div className="flex items-end justify-between mb-10">
                  <div>
                    <h2 className="h-serif text-3xl md:text-4xl font-extrabold text-ink tracking-tight uppercase">
                      Upcoming Fixtures
                    </h2>
                    <div className="title-underline" />
                  </div>
                  <Link
                    href="/fixtures"
                    className="hidden sm:inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.15em] text-ink/50 hover:text-brand transition"
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

                    return (
                      <div
                        key={fix.id || i}
                        className="bg-white rounded-xl border border-line overflow-hidden hover:shadow-soft transition-shadow card-lift"
                      >
                        <div className="flex items-center justify-between px-5 py-2.5 bg-ink">
                          <span className="text-white/70 text-[11px] font-extrabold tracking-[0.15em] uppercase">
                            {league}
                          </span>
                          <span className="text-brand text-[11px] font-extrabold tracking-[0.12em]">
                            {fmtFixtureDate(dateStr)} · {fmtTime(dateStr)}
                          </span>
                        </div>

                        <div className="px-5 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
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
              6. "IN CASE YOU MISSED IT" — More news grid
          ══════════════════════════════════════════════════════════ */}
          {moreNews.length > 0 && (
            <section className="bg-white border-t border-line">
              <div className="container-ms py-12 md:py-16">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="h-serif text-2xl md:text-3xl font-extrabold text-ink tracking-tight uppercase">
                    In Case You Missed It
                  </h2>
                  <Link
                    href="/news"
                    className="hidden sm:inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-ink/50 hover:text-brand transition"
                  >
                    MORE FROM THE CLUB →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {moreNews.map((article: any, i: number) => (
                    <Link
                      key={article.slug || i}
                      href={`/news/${article.slug}`}
                      className="group block bg-white rounded-xl border border-line overflow-hidden card-lift"
                    >
                      <div className="aspect-[16/10] bg-ink/5 overflow-hidden">
                        {article.heroMedia?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={article.heroMedia.url}
                            alt={article.title}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-ink to-ink-light flex items-center justify-center">
                            <span className="text-3xl font-extrabold text-white/5 select-none">MU</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-extrabold text-ink text-sm leading-snug line-clamp-2 group-hover:text-ink-light transition-colors">
                          {article.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
                          <span>{timeAgo(article.publishedAt)}</span>
                          {article.category && (
                            <span className="text-brand font-bold uppercase">{article.category}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════════
              7. KIT SHOWCASE (preserved — no changes)
          ══════════════════════════════════════════════════════════ */}
          <HomeShopSection />

          {/* ══════════════════════════════════════════════════════════
              8. MEMBERSHIP CTA + PLANS GRID
          ══════════════════════════════════════════════════════════ */}
          <section className="bg-white">
            <div className="container-ms pb-20 pt-8">
              {/* Banner */}
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
                          style={{ borderColor: meta.color, color: meta.color }}
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

        </div>
      </div>
    </SiteShell>
  );
}