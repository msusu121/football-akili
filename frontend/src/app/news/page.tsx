import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function NewsIndex() {
  const home = await apiGet<any>("/public/home");
  const data = await apiGet<any>("/news?page=1&pageSize=16");

  return (
    <SiteShell settings={home.settings} socials={home.socials} sponsors={home.sponsors}>
      <section className="mx-auto max-w-[1180px] px-4 py-12">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h1 className="h-serif text-4xl md:text-5xl font-extrabold tracking-tight">NEWS</h1>
            <div className="mt-3 h-[3px] w-14 bg-brand rounded-full" />
            <div className="mt-4 text-sm text-muted">Showing {data.total} Articles</div>
          </div>

          <Link
            href="/"
            className="hidden md:inline-flex items-center justify-center rounded-full border border-line bg-white hover:bg-black/5 px-6 py-3 text-sm font-semibold"
          >
            Back Home
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {data.items.map((n: any) => (
            <Link
              key={n.slug}
              href={`/news/${n.slug}`}
              className="bg-white rounded-xl border border-line shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="grid grid-cols-3">
                <div className="col-span-1 bg-black/5 min-h-[120px]">
                  {n.heroMedia?.url || n.heroUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(n.heroMedia?.url || n.heroUrl) as string}
                      alt={n.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>

                <div className="col-span-2 p-5">
                  <div className="text-[11px] font-extrabold tracking-wide text-muted">
                    {fmtDate(n.publishedAt)}
                  </div>

                  <div className="mt-2 font-extrabold leading-snug line-clamp-2">
                    {n.title}
                  </div>

                  <div className="mt-2 text-sm text-muted line-clamp-2">
                    {n.excerpt}
                  </div>

                  <div className="mt-3 text-[11px] font-extrabold text-brand">
                    READ MORE &nbsp;&gt;
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Simple pagination placeholder (optional) */}
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