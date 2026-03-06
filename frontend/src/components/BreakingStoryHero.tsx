import Link from "next/link";

/* helpers */
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

export function BreakingStoryHero({ story }: { story: any }) {
  if (!story) return null;

  const bg = story?.heroMedia?.url || null;
  const href = story?.slug ? `/news/${story.slug}` : "/news";

  return (
    <section className="relative w-full overflow-hidden">
      <div className="absolute inset-0">
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ink via-ink-light to-ink" />
        )}
      </div>

      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/55" />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[200px] md:text-[300px] font-extrabold text-white/[0.02] select-none h-serif">
          MU
        </span>
      </div>

      <div className="relative min-h-[480px] md:min-h-[580px] flex flex-col justify-end">
        <div className="container-ms pb-10 md:pb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/15 text-white/90 text-[11px] font-extrabold tracking-[0.15em] uppercase">
            Breaking
          </div>

          <h1 className="mt-4 h-serif text-white font-extrabold text-3xl sm:text-4xl md:text-6xl leading-[1.05] max-w-3xl drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]">
            {story.title}
          </h1>

          {story.excerpt && (
            <p className="mt-4 text-white/90 text-sm md:text-base max-w-xl leading-relaxed drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
              {story.excerpt}
            </p>
          )}

          <div className="mt-5 flex items-center gap-4 text-white/80 text-xs font-bold tracking-wide drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]">
            <span>{timeAgo(story.publishedAt)}</span>
            {story.category && (
              <span className="px-2.5 py-0.5 rounded bg-white/20 text-white uppercase tracking-[0.15em]">
                {story.category}
              </span>
            )}
          </div>

          <Link
            href={href}
            className="mt-7 inline-flex items-center justify-center px-10 py-3 rounded-full bg-brand text-ink font-extrabold text-[11px] tracking-[0.15em] uppercase hover:opacity-95 transition"
          >
            READ STORY
          </Link>
        </div>
      </div>
    </section>
  );
}