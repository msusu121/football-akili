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
import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import { HomeShopSection } from "@/components/HomeShopSection";
import { HighlightsSection } from "@/components/HighlightsSection";
import { HeroHighlightRotator } from "@/components/HeroHighlightRotator";
import { LatestResultHero } from "@/components/LatestResultHero";
import { MatchesRail } from "@/components/MatchesRail";
import { TodayOnClubSection } from "@/components/TodayOnClubSection";
import { MatchdayHero } from "@/components/MatchdayHero";
import { BreakingStoryHero } from "@/components/BreakingStoryHero";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

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

async function getMembershipPlans() {
  try {
    const res = await fetch(`${API}/membership/plans`, { next: { revalidate: 3600 } });
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
  // ✅ prevents cached "now" + cached fixtures from keeping old hero
  noStore();

  const [home, plans, fixData] = await Promise.all([
    apiGet<any>("/public/home"),
    getMembershipPlans(),
    apiGet<any>("/public/fixtures"),
  ]);

 
  const featured = home.featured;
  const latestNews = (home.latestNews || []) as any[];

  // Safe even if fewer than requested
  const todayNews = latestNews.slice(0, 6);
  const moreNews = latestNews.slice(6, 10);

  const highlights = (home.highlights || []) as any[];

  const fixtures = (fixData.upcomingFixtures || []) as any[];
  const pastResults = (fixData.results || []) as any[];

  const latestResult = pastResults[0] || null;

  // ── HERO SLOT selection ──
  const nowMs = Date.now();

  // Prefer matchdayFixture from backend (live/inferred/next), else nextFixture, else first upcoming
  const nextFixture = fixData.matchdayFixture || fixData.nextFixture || fixtures[0] || null;

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

  const statusSaysLive = statusNorm === "LIVE" || statusNorm === "IN_PROGRESS";
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
          return nowMs - t <= BREAKING_MINUTES * 60 * 1000 && !!n?.heroMedia?.url;
        }) || null
      : null;

  const matchdayBg =
    featured?.heroMedia?.url ||
    home.settings?.heroMedia?.url ||
    "/home/matchday-default.jpg";

    console.log("nowMs:", nowMs, new Date(nowMs).toISOString());
console.log("pickedFixture:", nextFixture?.id);
console.log("pickedKickoffISO:", kickoffISO);
console.log("pickedKickoffMs:", kickoffMs, kickoffMs ? new Date(kickoffMs).toISOString() : null);
console.log("statusNorm:", statusNorm);

const hoursToKO = kickoffMs ? (kickoffMs - nowMs) / 36e5 : null;
console.log("hoursToKO:", hoursToKO);

console.log("MATCHDAY_PRE_HOURS:", MATCHDAY_PRE_HOURS);
console.log("preWindowOk:", preWindowOk);
console.log("liveWindowOk:", liveWindowOk);
console.log("statusSaysLive:", statusSaysLive);
console.log("statusSaysFT:", statusSaysFT);
console.log("isMatchday:", isMatchday);

console.log("fixData.matchdayFixture:", fixData?.matchdayFixture?.id, fixData?.matchdayFixture?.kickoff, fixData?.matchdayFixture?.status);
console.log("fixData.nextFixture:", fixData?.nextFixture?.id, fixData?.nextFixture?.kickoff, fixData?.nextFixture?.status);
console.log("fixtures[0]:", fixtures?.[0]?.id, fixtures?.[0]?.kickoff, fixtures?.[0]?.status);

  return (
    <SiteShell settings={home.settings} socials={home.socials} sponsors={home.sponsors}>
      <div className="homepage-bg relative min-h-screen">
        <div className="relative z-10">
          {/* HERO SLOT */}
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

          {/* TODAY ON */}
          <TodayOnClubSection
            items={latestNews}
            title="Today on MombasaUnited.com"
            moreHref="/news"
            maxSecondary={4}
          />

          {/* HIGHLIGHTS */}
          <HighlightsSection highlights={highlights} />

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

          {/* IN CASE YOU MISSED IT */}
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
                          <Image
                            src={article.heroMedia.url}
                            alt={article.title}
                            fill
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-ink to-ink-light flex items-center justify-center">
                            <span className="text-3xl font-extrabold text-white/5 select-none">
                              MU
                            </span>
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

          {/* MEMBERSHIP */}
          <section className="bg-white">
            <div className="container-ms pb-20 pt-8">
              <div className="overflow-hidden rounded-2xl border border-line shadow-soft">
                <div className="relative h-[140px] md:h-[160px] bg-ink">
                  {home.settings?.homeMembershipImage?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                      src={home.settings.homeMembershipImage.url}
                      alt="Membership"
                      fill
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink-light to-ink" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-black/60" />

                  <div className="relative h-full flex items-center justify-between px-6 md:px-10">
                    <div className="text-white">
                      <div className="text-[11px] font-extrabold tracking-[0.25em] text-brand">
                        FOREVER {home.settings?.clubName || "MOMBASA UNITED"}
                      </div>
                      <div className="mt-2 h-serif text-3xl md:text-4xl font-extrabold text-white">
                        2025/26 <span className="text-brand">MEMBERSHIP</span>
                      </div>
                    </div>

                    <Link
                      href={home.settings?.membershipUrl || "/membership"}
                      className="inline-flex items-center gap-2 bg-brand text-ink font-extrabold px-8 py-4 rounded-lg hover:bg-brand-dark transition-colors shadow-glow"
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
                          <span className="text-xs text-muted">{plan.price === 0 ? "" : "/season"}</span>
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
                          href={home.settings?.membershipUrl || "/membership"}
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