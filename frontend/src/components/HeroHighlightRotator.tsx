"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

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

type Slide = {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  category?: string | null;
  publishedAt?: string | null;
  videoUrl?: string | null;
  bgUrl?: string | null;
  href?: string;
};

function shuffleInPlace(a: number[]) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

export function HeroHighlightRotator({
  highlights,
  featured,
  maxSlides = 5,
  intervalMs = 7000,
}: {
  highlights: any[];
  featured?: any | null;
  maxSlides?: number;
  intervalMs?: number;
}) {
  const slides: Slide[] = useMemo(() => {
    const h = Array.isArray(highlights) ? highlights : [];

    const mappedHighlights: Slide[] = h.slice(0, maxSlides).map((x: any) => ({
      id: x.id,
      slug: x.slug,
      title: x.title,
      description: x.description,
      category: x.category || null,
      publishedAt: x.publishedAt || null,
      videoUrl: x.videoUrl || null,
      bgUrl: x?.thumbnail?.url || null,
      href: x?.videoUrl ? x.videoUrl : `/highlights/${x.slug || x.id}`,
    }));

    // Fallback to featured ONLY if we have zero highlight slides
    if (mappedHighlights.length) return mappedHighlights;

    if (featured) {
      return [
        {
          id: featured.id,
          slug: featured.slug,
          title: featured.title,
          description: featured.excerpt,
          category: featured.category || null,
          publishedAt: featured.publishedAt || null,
          videoUrl: null,
          bgUrl: featured?.heroMedia?.url || null,
          href: featured?.slug ? `/news/${featured.slug}` : "/news",
        },
      ];
    }

    return [];
  }, [highlights, featured, maxSlides]);

  // IMPORTANT: don’t randomize initial render (avoids hydration mismatch).
  const [order, setOrder] = useState<number[]>(() => slides.map((_, i) => i));
  const [pos, setPos] = useState(0);

  // Randomize AFTER mount / when slides change
  useEffect(() => {
    if (!slides.length) return;
    const idxs = slides.map((_, i) => i);
    shuffleInPlace(idxs);
    setOrder(idxs);
    setPos(0);
  }, [slides.length]);

  // Rotate
  useEffect(() => {
    if (order.length <= 1) return;
    const t = window.setInterval(() => {
      setPos((p) => (p + 1) % order.length);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [order.length, intervalMs]);

  if (!slides.length) {
    return (
      <section className="relative w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink-light to-ink" />
        <div className="relative min-h-[480px] md:min-h-[580px]" />
      </section>
    );
  }

  const activeIndex = order[pos] ?? 0;
  const active = slides[activeIndex];

  return (
    <section className="relative w-full overflow-hidden">
      {/* Background crossfade stack */}
      <div className="absolute inset-0">
        {slides.map((s, i) => {
          const src = s.bgUrl || featured?.heroMedia?.url || null;
          if (!src) return null;
          const isActive = i === activeIndex;

          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${src}-${i}`}
              src={src}
              alt=""
              className={[
                "absolute inset-0 w-full h-full object-cover transition-opacity duration-700",
                isActive ? "opacity-100" : "opacity-0",
              ].join(" ")}
            />
          );
        })}

        {/* Fallback if no image at all */}
        {!slides.some((s) => !!s.bgUrl) && !featured?.heroMedia?.url && (
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink-light to-ink" />
        )}
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
          {/* Play button only if videoUrl exists */}
          {active.videoUrl && (
            <Link
              href={active.href || active.videoUrl}
              className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-brand text-ink mb-6 hover:scale-110 transition-transform shadow-glow"
            >
              <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </Link>
          )}

          <h1 className="h-serif text-white font-extrabold text-3xl sm:text-4xl md:text-6xl leading-[1.05] max-w-3xl drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]">
            {active.title || featured?.title || "WELCOME TO MOMBASA UNITED"}
          </h1>

          {(active.description || featured?.excerpt) && (
            <p className="mt-4 text-white/90 text-sm md:text-base max-w-xl leading-relaxed drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]">
              {active.description || featured?.excerpt}
            </p>
          )}

          <div className="mt-5 flex items-center gap-4 text-white/80 text-xs font-bold tracking-wide drop-shadow-[0_3px_10px_rgba(0,0,0,0.45)]">
            <span>{timeAgo(active.publishedAt || featured?.publishedAt)}</span>
            {active.category && (
              <span className="px-2.5 py-0.5 rounded bg-white/20 text-white uppercase tracking-[0.15em]">
                {active.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}