import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import { HomeShopSection } from "@/components/HomeShopSection";
import { HighlightsSection } from "@/components/HighlightsSection";
function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function relTime(d?: string | null) {
  if (!d) return "";
  const ms = Date.now() - new Date(d).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `about ${min} minutes ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `about ${hr} hours ago`;
  const day = Math.floor(hr / 24);
  return `${day} days ago`;
}

function dur(sec?: number | null) {
  if (sec === null || sec === undefined) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function HomePage() {
  const data = await apiGet<any>("/public/home");

  const featured = data.featured;
  const latest = (data.latestNews || []) as any[];
  const side = latest.filter((n) => n.slug !== featured?.slug).slice(0, 4);

  const highlights = (data.highlights || []) as any[];
  const mainHl = highlights[0];
  const recentHl = highlights.slice(1, 4);

  return (
    <SiteShell settings={data.settings} socials={data.socials} sponsors={data.sponsors}>
      {/* Featured (acts as hero) + right latest list */}
      <section className="mx-auto max-w-[1180px] px-4 pt-10 pb-10">
        <div className="grid gap-6 md:grid-cols-12">
          {/* Featured big card */}
          <div className="md:col-span-8">
            {featured ? (
              <Link href={`/news/${featured.slug}`} className="block">
                <div className="rounded-[18px] overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,.18)] bg-white">
                  <div className="relative aspect-[16/9] bg-black/10">
                    {featured.heroMedia?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={featured.heroMedia.url}
                        alt={featured.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}

                    {/* bottom overlay like the screenshot */}
                    <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                    <div className="absolute left-6 md:left-8 bottom-6 md:bottom-8 right-6 md:right-10">
                      <span className="inline-flex items-center rounded-sm bg-brand text-white text-[11px] font-extrabold px-3 py-1">
                        FEATURED
                      </span>

                      <div className="mt-3 h-serif text-white font-extrabold text-3xl md:text-5xl leading-[1.05]">
                        {featured.title}
                      </div>

                      <div className="mt-3 text-white/80 text-sm">
                        {fmtDate(featured.publishedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ) : null}
          </div>

          {/* Right list cards with thumbnail-left */}
          <div className="md:col-span-4 space-y-4">
            {side.map((n) => (
              <Link
                key={n.slug}
                href={`/news/${n.slug}`}
                className="block bg-white rounded-xl border border-line shadow-sm hover:shadow-md transition overflow-hidden"
              >
                <div className="grid grid-cols-3">
                  <div className="col-span-1 bg-black/5 min-h-[96px]">
                    {n.heroMedia?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.heroMedia.url} alt={n.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                  <div className="col-span-2 p-4">
                    <div className="text-[11px] font-extrabold tracking-wide text-muted">
                      {fmtDate(n.publishedAt)}
                    </div>
                    <div className="mt-1 font-extrabold leading-snug line-clamp-2">
                      {n.title}
                    </div>
                    <div className="mt-2 text-[11px] font-extrabold text-brand">
                      READ MORE &nbsp;&gt;
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HighlightsSection highlights={data.highlights || []} />

      {/* Shop kit */}
      <HomeShopSection kits={data.kits || []} shopImageUrl={data.settings?.homeShopImage?.url} shopUrl={data.settings?.shopUrl || "/shop"} />

      {/* Membership block (simple, matches banner style) */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-8">
          <div className="overflow-hidden rounded-2xl border border-line">
            <div className="relative h-[120px] md:h-[130px] bg-[#0b1020]">
              {data.settings?.homeMembershipImage?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.settings.homeMembershipImage.url}
                  alt="Membership"
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/70" />

              <div className="relative h-full flex items-center justify-between px-6 md:px-10">
                <div className="text-white">
                  <div className="text-xs font-extrabold tracking-[0.2em] text-brand">
                    FOREVER {data.settings?.clubName || "CLUB"}
                  </div>
                  <div className="mt-2 text-2xl md:text-3xl font-extrabold italic">
                    2025/26 <span className="text-brand not-italic">MEMBERSHIP</span>
                  </div>
                </div>

                <Link
                  href={data.settings?.membershipUrl || "/membership"}
                  className="inline-flex items-center gap-2 bg-brand text-black font-extrabold px-8 py-4 hover:opacity-95 transition"
                >
                  BUY NOW <span>›</span>
                </Link>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-brand" />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}