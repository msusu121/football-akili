import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";

function fmtLong(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }).toUpperCase();
}

export default async function NewsDetailPage({ params }: { params: { slug: string } }) {
  const home = await apiGet<any>("/public/home");
  const post = await apiGet<any>(`/news/${params.slug}`);

  const hero = post.heroMedia?.url || post.heroUrl || null;

  return (
    <SiteShell settings={home.settings} socials={home.socials} sponsors={home.sponsors}>
      {/* Hero background */}
      <section className="relative">
        <div className="h-[360px] md:h-[520px] w-full bg-black/10 overflow-hidden">
          {hero ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero} alt={post.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-black/20" />
          )}
        </div>
      </section>

      {/* Floating white article card */}
      <section className="relative">
        <div className="mx-auto max-w-[980px] px-4 -mt-24 md:-mt-28 pb-16">
          <div className="bg-white border border-line shadow-[0_18px_60px_rgba(0,0,0,.22)]">
            <div className="px-6 md:px-10 py-8 md:py-10">
              <Link href="/news" className="text-sm text-muted hover:text-ink transition">
                ← Back to news
              </Link>

              {/* Date + rule */}
              <div className="mt-6 text-[11px] font-extrabold tracking-[0.18em] text-muted">
                {fmtLong(post.publishedAt)}
              </div>
              <div className="mt-4 h-px bg-black/80" />

              {/* Title */}
              <h1 className="mt-6 h-serif text-4xl md:text-6xl font-extrabold leading-[1.03] tracking-tight">
                {post.title}
              </h1>

              {/* Excerpt block with left border */}
              {post.excerpt ? (
                <div className="mt-6 border-l-4 border-black/20 pl-5">
                  <p className="italic text-[15px] md:text-[16px] leading-relaxed text-black/75">
                    {post.excerpt}
                  </p>
                </div>
              ) : null}

              <div className="mt-8 h-px bg-black/10" />
              <div className="mt-10 prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}