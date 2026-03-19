import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";

const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

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

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function NewsIndex() {
  const home = await apiGet<any>("/public/home");
  const data = await apiGet<any>("/news?page=1&pageSize=16");

  return (
    <SiteShell
      settings={home.settings}
      socials={home.socials}
      sponsors={home.sponsors}
    >
      <section className="mx-auto max-w-[1180px] px-4 py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="h-serif text-4xl font-extrabold tracking-tight md:text-5xl">
              NEWS
            </h1>
            <div className="mt-3 h-[3px] w-14 rounded-full bg-brand" />
            <div className="mt-4 text-sm text-muted">
              Showing {data.total} Articles
            </div>
          </div>

          <Link
            href="/"
            className="hidden items-center justify-center rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold hover:bg-black/5 md:inline-flex"
          >
            Back Home
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {data.items.map((n: any) => {
            const heroUrl = resolveAssetUrl(n.heroMedia?.url || n.heroUrl);

            return (
              <Link
                key={n.slug}
                href={`/news/${n.slug}`}
                className="overflow-hidden rounded-xl border border-line bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="grid grid-cols-3">
                  <div className="col-span-1 min-h-[120px] bg-black/5">
                    {heroUrl ? (
                      <div className="relative h-full min-h-[120px] w-full">
                        <Image
                          src={heroUrl}
                          alt={n.title || "News image"}
                          fill
                          sizes="(max-width: 767px) 33vw, (max-width: 1180px) 17vw, 190px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full min-h-[120px] w-full items-center justify-center bg-black/5">
                        <span className="select-none text-2xl font-extrabold text-black/10">
                          MU
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 p-5">
                    <div className="text-[11px] font-extrabold tracking-wide text-muted">
                      {fmtDate(n.publishedAt)}
                    </div>

                    <div className="mt-2 line-clamp-2 font-extrabold leading-snug">
                      {n.title}
                    </div>

                    <div className="mt-2 line-clamp-2 text-sm text-muted">
                      {n.excerpt}
                    </div>

                    <div className="mt-3 text-[11px] font-extrabold text-brand">
                      READ MORE &nbsp;&gt;
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 flex items-center justify-center gap-3">
          <button className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold hover:bg-black/5">
            Prev
          </button>
          <button className="rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold hover:bg-black/5">
            Next
          </button>
        </div>
      </section>
    </SiteShell>
  );
}