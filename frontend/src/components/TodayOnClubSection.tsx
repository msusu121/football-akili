import Image from "next/image";
import Link from "next/link";

/* helpers */
function timeAgo(d?: string | null) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function ShareIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 8a3 3 0 10-2.83-4H12a3 3 0 003 4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 14a3 3 0 100 6 3 3 0 000-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 13a3 3 0 100 6 3 3 0 000-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.6 16.2l6.8-3.4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.4 7.2L8.6 10.6" />
    </svg>
  );
}

function ImgOrFallback({
  src,
  alt,
  fallbackText = "MU",
  imgClassName,
  sizes,
  quality = 70,
}: {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  imgClassName?: string;
  sizes: string;
  quality?: number;
}) {
  return (
    <div className="relative h-full w-full">
      {src ? (
        <Image
          src={src}
          alt={alt || ""}
          fill
          sizes={sizes}
          quality={quality}
          className={imgClassName || "object-cover"}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/10">
          <span className="text-4xl font-extrabold text-ink/10 select-none">
            {fallbackText}
          </span>
        </div>
      )}
    </div>
  );
}

function MetaRow({ item }: { item: any }) {
  const t = timeAgo(item?.publishedAt);
  const label = (item?.category || "news").toString().toLowerCase();

  return (
    <div className="mt-4 flex items-center justify-between text-[11px] text-ink/45">
      <div className="flex items-center gap-2">
        <span>{t ? t : ""}</span>
        <span className="text-ink/25">|</span>
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <span className="text-ink/35 hover:text-ink/60 transition">
        <ShareIcon />
      </span>
    </div>
  );
}

/**
 * TODAY ON... (ManUtd-style)
 * - top 2 = featured big cards
 * - rest = smaller cards
 */
export function TodayOnClubSection({
  items,
  title = "Today on MombasaUnited.com",
  moreHref = "/news",
  maxSecondary = 4,
}: {
  items: any[];
  title?: string;
  moreHref?: string;
  maxSecondary?: number;
}) {
  const list = Array.isArray(items) ? items : [];
  const primary = list.slice(0, 2);
  const secondary = list.slice(2, 2 + maxSecondary);

  if (!primary.length && !secondary.length) return null;

  return (
    <section className="bg-white border-t border-line">
      <div className="container-ms py-12 md:py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-[3px] w-10 bg-brand rounded-full mb-3" />
            <h2 className="h-serif text-2xl md:text-3xl font-extrabold text-ink tracking-tight uppercase">
              {title}
            </h2>
          </div>

          <Link
            href={moreHref}
            className="hidden sm:inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.15em] uppercase text-ink/60 hover:text-brand transition"
          >
            MORE NEWS
          </Link>
        </div>

        {/* DESKTOP/TABLET */}
        <div className="hidden sm:block">
          <div className="grid gap-6 lg:grid-cols-2">
            {primary.map((a: any, idx: number) => (
              <Link
                key={a.slug || a.id || idx}
                href={`/news/${a.slug}`}
                className="group rounded-2xl border border-line bg-white overflow-hidden shadow-soft hover:shadow-card transition"
              >
                <div className="flex">
                  <div className="w-[52%] min-w-[280px] bg-ink/5">
                    <ImgOrFallback
                      src={a?.heroMedia?.url}
                      alt={a?.title}
                      sizes="(max-width: 1023px) 100vw, 50vw"
                      imgClassName="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 p-6">
                    <h3 className="text-xl md:text-2xl font-extrabold text-ink uppercase leading-tight line-clamp-3">
                      {a.title}
                    </h3>
                    {a.excerpt && (
                      <p className="mt-3 text-sm text-ink/70 leading-relaxed line-clamp-3">
                        {a.excerpt}
                      </p>
                    )}
                    <MetaRow item={a} />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {secondary.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {secondary.map((a: any, idx: number) => (
                <Link
                  key={a.slug || a.id || idx}
                  href={`/news/${a.slug}`}
                  className="group rounded-2xl border border-line bg-white overflow-hidden shadow-soft hover:shadow-card transition"
                >
                  <div className="aspect-[16/10] bg-ink/5 overflow-hidden">
                    <ImgOrFallback
                      src={a?.heroMedia?.url}
                      alt={a?.title}
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      imgClassName="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h4 className="font-extrabold text-ink text-[14px] leading-snug line-clamp-2">
                      {a.title}
                    </h4>
                    {a.excerpt && (
                      <p className="mt-2 text-xs text-ink/65 leading-relaxed line-clamp-2">
                        {a.excerpt}
                      </p>
                    )}
                    <MetaRow item={a} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* MOBILE */}
        <div className="sm:hidden">
          {primary[0] && (
            <Link
              href={`/news/${primary[0].slug}`}
              className="block rounded-2xl overflow-hidden border border-line shadow-soft"
            >
              <div className="aspect-[16/10] bg-ink/5">
                <ImgOrFallback
                  src={primary[0]?.heroMedia?.url}
                  alt={primary[0]?.title}
                  sizes="100vw"
                  imgClassName="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-extrabold text-ink text-[16px] leading-snug line-clamp-2">
                  {primary[0].title}
                </h3>
                {primary[0].excerpt && (
                  <p className="mt-2 text-sm text-ink/70 leading-relaxed line-clamp-3">
                    {primary[0].excerpt}
                  </p>
                )}
                <MetaRow item={primary[0]} />
              </div>
            </Link>
          )}

          {primary[1] && (
            <Link
              href={`/news/${primary[1].slug}`}
              className="mt-4 flex gap-3 rounded-2xl overflow-hidden border border-line shadow-soft bg-white"
            >
              <div className="w-24 h-20 bg-ink/5 shrink-0 overflow-hidden">
                <ImgOrFallback
                  src={primary[1]?.heroMedia?.url}
                  alt={primary[1]?.title}
                  sizes="96px"
                  imgClassName="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 p-3">
                <h4 className="font-extrabold text-ink text-[13px] leading-snug line-clamp-2 uppercase">
                  {primary[1].title}
                </h4>
                <div className="mt-2 flex items-center justify-between text-[11px] text-ink/45">
                  <div className="flex items-center gap-2">
                    <span>{timeAgo(primary[1]?.publishedAt)}</span>
                    <span className="text-ink/25">|</span>
                    <span className="uppercase tracking-wide">
                      {(primary[1]?.category || "news").toString()}
                    </span>
                  </div>
                  <span className="text-ink/35">
                    <ShareIcon />
                  </span>
                </div>
              </div>
            </Link>
          )}

          {secondary.length > 0 && (
            <div className="mt-4 divide-y divide-line rounded-2xl border border-line overflow-hidden">
              {secondary.map((a: any, idx: number) => (
                <Link
                  key={a.slug || a.id || idx}
                  href={`/news/${a.slug}`}
                  className="flex gap-3 p-3 bg-white hover:bg-ink/[0.02] transition"
                >
                  <div className="w-20 h-14 bg-ink/5 rounded-md overflow-hidden shrink-0">
                    <ImgOrFallback
                      src={a?.heroMedia?.url}
                      alt={a?.title}
                      sizes="80px"
                      imgClassName="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-extrabold text-ink text-[13px] leading-snug line-clamp-2 uppercase">
                      {a.title}
                    </h5>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-ink/45">
                      <div className="flex items-center gap-2">
                        <span>{timeAgo(a?.publishedAt)}</span>
                        <span className="text-ink/25">|</span>
                        <span className="uppercase tracking-wide">
                          {(a?.category || "news").toString()}
                        </span>
                      </div>
                      <span className="text-ink/35">
                        <ShareIcon />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Link
              href={moreHref}
              className="inline-flex items-center gap-2 text-xs font-extrabold tracking-[0.15em] uppercase text-brand hover:text-brand-dark transition"
            >
              MORE NEWS →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}