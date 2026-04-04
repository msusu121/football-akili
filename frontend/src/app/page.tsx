// FILE: frontend/src/app/page.tsx
// DROP-IN REPLACEMENT — Mombasa United FC homepage
//
// HERO SLOT:
// - MatchdayHero shows if match is within 24h OR live window OR status says LIVE
// - BreakingStoryHero if a story was published within 30min with heroMedia
// - Else HeroHighlightRotator
//
// IMPORTANT: noStore() + force-dynamic prevents stale hero decisions.

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { unstable_noStore as noStore } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import { HomeShopSection } from "@/components/HomeShopSection";
import { HighlightsSection } from "@/components/HighlightsSection";
import { HeroHighlightRotator } from "@/components/HeroHighlightRotator";
import { LatestResultHero } from "@/components/LatestResultHero";
import { MatchesRail } from "@/components/MatchesRail";
import { TodayOnClubSection } from "@/components/TodayOnClubSection";
import { MatchdayHero } from "@/components/MatchdayHero";
import { BreakingStoryHero } from "@/components/BreakingStoryHero";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

/* ── helpers ── */
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

function resolveAssetUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (ASSET_BASE) {
    return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
  return url;
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
  BASIC: { color: "#0a1628", bg: "rgba(10,22,40,.06)" },
  BRONZE: { color: "#92400e", bg: "rgba(146,64,14,.06)" },
  SILVER: { color: "#475569", bg: "rgba(71,85,105,.06)" },
  GOLD: { color: "#d4a017", bg: "rgba(212,160,23,.08)" },
};

export default async function HomePage() {
  // prevents cached "now" + cached fixtures from keeping old hero
  noStore();

  const [home, plans, fixData] = await Promise.all([
    apiGet<any>("/public/home"),
    getMembershipPlans(),
    apiGet<any>("/public/fixtures"),
  ]);

  const featured = home.featured;
  const latestNews = (home.latestNews || []) as any[];
  const moreNews = latestNews.slice(6, 10);

  const highlights = (home.highlights || []) as any[];

  const fixtures = (fixData.upcomingFixtures || []) as any[];
  const pastResults = (fixData.results || []) as any[];

  const latestResult = pastResults[0] || null;

  // ── HERO SLOT selection ──
  const nowMs = Date.now();

  // Prefer matchdayFixture from backend (live/inferred/next), else nextFixture, else first upcoming
  const nextFixture =
    fixData.matchdayFixture || fixData.nextFixture || fixtures[0] || null;

  const kickoffISO = nextFixture?.kickoff ? String(nextFixture.kickoff) : null;
  const kickoffMs = kickoffISO ? new Date(kickoffISO).getTime() : null;

  const statusNorm = String(nextFixture?.status || "").toUpperCase();

  // Windows
  const MATCHDAY_PRE_HOURS = 24;
  const MATCHDAY_LIVE_MINUTES = 135;

  const preWindowOk =
    kickoffMs !== null &&
    kickoffMs > nowMs &&
    kickoffMs - nowMs <= MATCHDAY_PRE_HOURS * 60 * 60 * 1000;

  const liveWindowOk =
    kickoffMs !== null &&
    nowMs >= kickoffMs &&
    nowMs <= kickoffMs + MATCHDAY_LIVE_MINUTES * 60 * 1000;

  const statusSaysLive =
    statusNorm === "LIVE" || statusNorm === "IN_PROGRESS";
  const statusSaysFT = statusNorm === "FT" || statusNorm === "FULL_TIME";

  const isMatchday =
    !!nextFixture && !statusSaysFT && (statusSaysLive || preWindowOk || liveWindowOk);

  // Breaking story (only if not matchday)
  const BREAKING_MINUTES = 30;
  const breakingStory =
    !isMatchday
      ? latestNews.find((n: any) => {
          const t = n?.publishedAt ? new Date(n.publishedAt).getTime() : null;
          if (!t) return false;
          return (
            nowMs - t <= BREAKING_MINUTES * 60 * 1000 && !!n?.heroMedia?.url
          );
        }) || null
      : null;

  const matchdayBg =
    resolveAssetUrl(featured?.heroMedia?.url) ||
    resolveAssetUrl(home.settings?.heroMedia?.url) ||
    "/home/matchday-default.jpg";

  const membershipImageUrl = resolveAssetUrl(
    home.settings?.homeMembershipImage?.url
  );

  return (
    <SiteShell
      settings={home.settings}
      socials={home.socials}
      sponsors={home.sponsors}
    >
      <div className="homepage-bg relative min-h-screen">
        <div className="relative z-10">
          {/* LATEST RESULT HERO */}
          <LatestResultHero
            latestResult={latestResult}
            fixturesPageHref="/fixtures"
            bgImages={[
              "https://mombasaunited.com/club-media/home/match-bg-1.jpeg",
              "https://mombasaunited.com/club-media/home/match-bg-2.jpeg",
              "https://mombasaunited.com/club-media/home/match-bg-3.jpeg",
              "https://mombasaunited.com/club-media/home/match-bg-4.jpeg",
            ]}
          />
          

          {/* TODAY ON */}
          <TodayOnClubSection
            items={latestNews}
            title="Today on MombasaUnited.com"
            moreHref="/news"
            maxSecondary={4}
          />
          {isMatchday && nextFixture ? (
            <MatchdayHero
              fixture={nextFixture}
              ticketsUrl={home.settings?.ticketsUrl || "/tickets"}
              bgImageUrl={matchdayBg}
            />
          ) : breakingStory ? (
            <BreakingStoryHero story={breakingStory} />
          ) : (
            <HeroHighlightRotator
              highlights={highlights}
              featured={featured}
              maxSlides={5}
              intervalMs={7000}
            />
          )} 
          {/* HIGHLIGHTS */}
          <HighlightsSection highlights={highlights} />

          

          {/* IN CASE YOU MISSED IT */}
          {moreNews.length > 0 && (
            <section className="bg-white border-t border-line">
              <div className="container-ms py-12 md:py-16">
                <div className="mb-8 flex items-center justify-between">
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

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {moreNews.map((article: any, i: number) => {
                    const articleImage = resolveAssetUrl(article.heroMedia?.url);

                    return (
                      <Link
                        key={article.slug || i}
                        href={`/news/${article.slug}`}
                        className="group block overflow-hidden rounded-xl border border-line bg-white card-lift"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-ink/5">
                          {articleImage ? (
                            <Image
                              src={articleImage}
                              alt={article.title || "News image"}
                              fill
                              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink to-ink-light">
                              <span className="select-none text-3xl font-extrabold text-white/5">
                                MU
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="p-4">
                          <h3 className="text-sm font-extrabold leading-snug text-ink line-clamp-2 transition-colors group-hover:text-ink-light">
                            {article.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-muted">
                            <span>{timeAgo(article.publishedAt)}</span>
                            {article.category && (
                              <span className="font-bold uppercase text-brand">
                                {article.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* SHOP */}
          <HomeShopSection />

          {/* MATCHES STRIP */}
          <MatchesRail
            fixtures={fixtures}
            results={pastResults}
            ticketsUrl={home.settings?.ticketsUrl || "/tickets"}
            fixturesPageHref="/fixtures"
            title="Matches"
            defaultTab="fixtures"
          />

          {/* MEMBERSHIP 
          <section className="bg-white">
            <div className="container-ms pb-20 pt-8">
              <div className="overflow-hidden rounded-2xl border border-line shadow-soft">
                <div className="relative h-[140px] bg-ink md:h-[160px]">
                  {membershipImageUrl ? (
                    <Image
                      src={membershipImageUrl}
                      alt="Membership"
                      fill
                      sizes="100vw"
                      className="object-cover opacity-60"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink-light to-ink" />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />

                  <div className="relative flex h-full items-center justify-between px-6 md:px-10">
                    <div className="text-white">
                      <div className="text-[11px] font-extrabold tracking-[0.25em] text-brand">
                        FOREVER {home.settings?.clubName || "MOMBASA UNITED"}
                      </div>
                      <div className="mt-2 h-serif text-3xl font-extrabold text-white md:text-4xl">
                        2025/26 <span className="text-brand">MEMBERSHIP</span>
                      </div>
                    </div>

                    <Link
                      href={home.settings?.membershipUrl || "/membership"}
                      className="inline-flex items-center gap-2 rounded-lg bg-brand px-8 py-4 font-extrabold text-ink shadow-glow transition-colors hover:bg-brand-dark"
                    >
                      BUY NOW <span className="text-lg">›</span>
                    </Link>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand" />
                </div>
              </div>

              {plans.length > 0 && (
                <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {plans.map((plan: any) => {
                    const meta = tierMeta[plan.tier] || tierMeta.BASIC;
                    const benefits: string[] = Array.isArray(plan.benefits)
                      ? plan.benefits
                      : [];

                    return (
                      <div
                        key={plan.id}
                        className="group relative rounded-2xl border border-line bg-white p-6 card-lift"
                        style={{
                          borderTopColor: meta.color,
                          borderTopWidth: "3px",
                        }}
                      >
                        {plan.tier === "GOLD" && (
                          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-[10px] font-extrabold uppercase tracking-widest text-ink shadow-glow">
                            Most Popular
                          </div>
                        )}

                        <div className="mt-1">
                          <span
                            className="inline-block rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.2em]"
                            style={{ color: meta.color, background: meta.bg }}
                          >
                            {plan.tier}
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-extrabold text-ink">
                          {plan.name}
                        </h3>

                        <div className="mt-3 flex items-baseline gap-1.5">
                          <span className="text-3xl font-extrabold text-ink">
                            {plan.price === 0
                              ? "FREE"
                              : `KES ${plan.price.toLocaleString()}`}
                          </span>
                          <span className="text-xs text-muted">
                            {plan.price === 0 ? "" : "/season"}
                          </span>
                        </div>

                        <div className="mt-4 h-px bg-line" />

                        <ul className="mt-4 space-y-2.5">
                          {benefits.slice(0, 5).map((b: string) => (
                            <li
                              key={b}
                              className="flex items-start gap-2.5 text-sm text-ink/75"
                            >
                              <span
                                className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[9px] text-white"
                                style={{ backgroundColor: meta.color }}
                              >
                                ✓
                              </span>
                              {b}
                            </li>
                          ))}
                        </ul>

                        <Link
                          href={home.settings?.membershipUrl || "/membership"}
                          className="mt-6 block w-full rounded-lg border-2 py-3 text-center text-[11px] font-extrabold uppercase tracking-[0.12em] transition-all group-hover:shadow-card"
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
          </section> */}



          
        </div>
      </div>
    </SiteShell>
  );
}