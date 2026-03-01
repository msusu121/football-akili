// ============================================================
// FILE: frontend/src/components/HomeShopSection.tsx
// DROP-IN REPLACEMENT
//
// Kit showcase for homepage — 3 jerseys displayed side-by-side
// with horizontal HOME / AWAY / THIRD buttons.
// Clicking any kit navigates to /shop?kit=home (or away/third)
//
// IMPORTANT: Copy the 3 jersey images to your Next.js public folder:
//   public/assets/jersey-home.jpeg   (Blue kit — Tembea Mombasa)
//   public/assets/jersey-away.jpeg   (White kit)
//   public/assets/jersey-third.jpeg  (Black & Gold kit)
//
// Or if you prefer /src/assets with next/image, update paths below.
// ============================================================

"use client";

import Link from "next/link";
import { useState } from "react";

const kits = [
  {
    key: "home",
    label: "HOME",
    image: "/assets/jersey-home.jpeg",
    desc: "2025/26 Home Kit",
    color: "#1a3a8a", // Blue
  },
  {
    key: "away",
    label: "AWAY",
    image: "/assets/jersey-away.jpeg",
    desc: "2025/26 Away Kit",
    color: "#ffffff", // White
  },
  {
    key: "third",
    label: "THIRD KIT",
    image: "/assets/jersey-third.jpeg",
    desc: "2025/26 Third Kit",
    color: "#0a0a0a", // Black
  },
];

export function HomeShopSection() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="bg-white border-t border-line">
      <div className="mx-auto max-w-[1180px] px-4 py-16">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="h-serif text-4xl md:text-5xl font-extrabold text-ink tracking-tight">
            OFFICIAL KITS
          </h2>
          <div className="mx-auto mt-2 h-[3px] w-14 bg-brand rounded-full" />
          <p className="mt-4 text-sm text-muted max-w-md mx-auto">
            Represent the pride of Mombasa. Available in Kids and Adults sizes.
          </p>
        </div>

        {/* Jersey grid — all 3 side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
          {kits.map((kit) => (
            <Link
              key={kit.key}
              href={`/shop?kit=${kit.key}`}
              className="group block"
              onMouseEnter={() => setHovered(kit.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="relative overflow-hidden rounded-2xl border border-line bg-[#f8f9fc] card-lift">
                {/* Giant watermark */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
                  <span className="text-[120px] md:text-[160px] font-extrabold tracking-tight text-black/[0.03] select-none">
                    {kit.label.split(" ")[0]}
                  </span>
                </div>

                {/* Jersey image */}
                <div className="relative aspect-[3/4] flex items-center justify-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={kit.image}
                    alt={`Mombasa United ${kit.label} Kit`}
                    className="w-full h-full object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,.18)] group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>

                {/* Label bar */}
                <div className="px-5 pb-5">
                  <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-muted mb-1">
                    {kit.desc}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-ink text-lg">
                      {kit.label}
                    </span>
                    <span className="text-xs font-bold text-brand group-hover:translate-x-1 transition-transform">
                      SHOP NOW →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Horizontal kit selector buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          {kits.map((kit) => (
            <Link
              key={kit.key}
              href={`/shop?kit=${kit.key}`}
              className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-3.5 rounded-xl text-[12px] font-extrabold tracking-[0.15em] uppercase transition-all border-2 border-ink/10 text-ink hover:border-brand hover:text-brand hover:shadow-card"
            >
              {kit.label}
            </Link>
          ))}
        </div>

        {/* Visit Store CTA */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-12 py-4 bg-brand text-ink font-extrabold text-sm tracking-[0.12em] uppercase rounded-xl hover:bg-brand-dark transition-colors shadow-glow"
          >
            VISIT STORE
          </Link>
        </div>
      </div>
    </section>
  );
}
