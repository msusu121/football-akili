// ============================================================
// FILE: frontend/src/components/HighlightsSection.tsx
// DROP-IN REPLACEMENT — Full-width dark video cards section
//
// Man Utd-inspired horizontal video gallery.
// Full-width dark background, horizontal scrollable cards,
// play buttons, duration overlays, categories.
//
// BRAND: Navy (#0a1628), Gold (#d4a017)
// ============================================================

"use client";

import Link from "next/link";
import { useRef } from "react";

interface Highlight {
  id?: string;
  slug?: string;
  title: string;
  description?: string;
  thumbnail?: { url: string };
  videoUrl?: string;
  duration?: string;
  category?: string;
  publishedAt?: string;
}

interface HighlightsSectionProps {
  highlights?: Highlight[];
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

export function HighlightsSection({ highlights = [] }: HighlightsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (highlights.length === 0) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.offsetWidth * 0.7;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="bg-ink w-full overflow-hidden border-t border-white/5">
      <div className="container-ms py-12 md:py-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-brand text-[10px] font-extrabold tracking-[0.3em] uppercase mb-2">
              Videos
            </p>
            <h2 className="h-serif text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase">
              The Highlights
            </h2>
            <div className="mt-2 h-[3px] w-12 bg-brand rounded-full" />
          </div>

          <div className="flex items-center gap-3">
            {/* Scroll arrows */}
            <button
              onClick={() => scroll("left")}
              className="hidden sm:flex w-10 h-10 rounded-full border border-white/20 items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition"
              aria-label="Scroll left"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="hidden sm:flex w-10 h-10 rounded-full border border-white/20 items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition"
              aria-label="Scroll right"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>

            <Link
              href="/highlights"
              className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-white/40 hover:text-brand transition"
            >
              VIEW ALL →
            </Link>
          </div>
        </div>
      </div>

      {/* Scrollable cards — full width, edge-to-edge */}
      <div
        ref={scrollRef}
        className="flex gap-4 md:gap-5 overflow-x-auto scroll-smooth pb-6 px-4 md:px-8 lg:px-[calc((100vw-1280px)/2+2rem)] snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {highlights.map((hl, i) => {
          const href = hl.videoUrl || `/highlights/${hl.slug || hl.id || i}`;
          return (
            <Link
              key={hl.id || i}
              href={href}
              className="group flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] snap-start"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video rounded-xl overflow-hidden bg-ink-light">
                {hl.thumbnail?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={hl.thumbnail.url}
                    alt={hl.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-ink via-ink-light to-ink flex items-center justify-center">
                    <span className="text-5xl font-extrabold text-white/[0.03] select-none">MU</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-brand/90 flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-glow">
                    <svg className="w-5 h-5 text-ink ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>

                {/* Duration badge */}
                {hl.duration && (
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono tracking-wide">
                    {hl.duration}
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="mt-3 px-1">
                <h3 className="font-extrabold text-white text-sm leading-snug line-clamp-2 group-hover:text-brand transition-colors">
                  {hl.title}
                </h3>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-white/40">
                  <span>{timeAgo(hl.publishedAt)}</span>
                  {hl.category && (
                    <span className="text-brand font-bold uppercase tracking-wider">
                      {hl.category}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom padding */}
      <div className="h-6 md:h-10" />
    </section>
  );
}
