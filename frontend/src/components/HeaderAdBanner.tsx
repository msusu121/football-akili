"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

type AdItem = {
  id: string;
  title: string;
  href?: string | null;
  ctaLabel?: string | null;
  imageUrl?: string | null;
};

export function HeaderAdBanner({
  items,
  intervalMs = 6500,
  heightClass = "h-[78px] sm:h-[92px] md:h-[110px]",
}: {
  items: AdItem[];
  intervalMs?: number;
  heightClass?: string;
}) {
  const ads = useMemo(() => (items || []).filter((x) => !!x?.imageUrl), [items]);
  const [idx, setIdx] = useState(() => (ads.length ? Math.floor(Math.random() * ads.length) : 0));

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = window.setInterval(() => setIdx((v) => (v + 1) % ads.length), intervalMs);
    return () => window.clearInterval(t);
  }, [ads.length, intervalMs]);

  if (!ads.length) return null;

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden bg-black`}>
      {/* Crossfade images */}
      {ads.map((a, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={a.id}
          src={a.imageUrl as string}
          alt={a.title || "Ad"}
          className={[
            "absolute inset-0 w-full h-full object-cover",
            "transition-opacity duration-700",
            i === idx ? "opacity-100" : "opacity-0",
          ].join(" ")}
        />
      ))}

      {/* Premium overlays (keeps it classy + readable) */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-black/40" />
      <div className="absolute inset-0 pointer-events-none">
        {/* animated glint */}
        <div className="absolute -left-[30%] top-0 h-full w-[30%] bg-white/10 blur-xl rotate-12 animate-[adglint_6s_linear_infinite]" />
      </div>

      {/* Small AD label */}
      <div className="absolute left-3 top-3 rounded px-2 py-1 bg-black/45 border border-white/15">
        <span className="text-[10px] font-extrabold tracking-[0.22em] uppercase text-white/85">
          Advertisement
        </span>
      </div>

      {/* Click layer */}
      {ads[idx]?.href ? (
        <Link
          href={ads[idx].href as string}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label={ads[idx].title || "Advertisement"}
        />
      ) : null}

      {/* Optional CTA on right (desktop only, MU-ish) */}
      {ads[idx]?.href ? (
        <div className="hidden md:flex absolute right-4 bottom-4 items-center gap-2 rounded-full px-4 py-2 bg-black/45 border border-white/15">
          <span className="text-[11px] font-extrabold tracking-[0.18em] uppercase text-white">
            {ads[idx].ctaLabel || "Learn More"}
          </span>
          <span className="text-white/80">›</span>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes adglint {
          0% { transform: translateX(-30%) rotate(12deg); opacity: .0; }
          10% { opacity: .35; }
          50% { opacity: .25; }
          100% { transform: translateX(430%) rotate(12deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}