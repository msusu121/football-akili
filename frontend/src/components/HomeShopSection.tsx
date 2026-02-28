"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export function HomeShopSection({
  kits,
  shopImageUrl,
  shopUrl,
}: {
  kits: Array<{ slug: string; title: string; kitType?: string | null; heroMedia?: { url: string } | null }>;
  shopImageUrl?: string | null; // optional: big background image (not required)
  shopUrl?: string;
}) {
  const [tab, setTab] = useState<"HOME" | "AWAY" | "THIRD">("HOME");

  const active = useMemo(() => {
    const byType = kits.filter((k) => (k.kitType || "").toUpperCase() === tab);
    return byType[0] || kits[0];
  }, [kits, tab]);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1180px] px-4 pt-16 pb-10">
        {/* big stage like screenshot */}
        <div className="relative overflow-hidden rounded-2xl border border-line bg-[#fbf3ea]">
          {/* giant watermark text */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-[160px] md:text-[220px] font-extrabold tracking-tight text-black/5 select-none">
              {tab}
            </div>
          </div>

          {/* optional background image (soft) */}
          {shopImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopImageUrl}
              alt="Shop background"
              className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.10]"
            />
          ) : null}

          <div className="relative grid md:grid-cols-12 gap-6 items-center px-6 md:px-10 py-12 md:py-16">
            {/* jersey center */}
            <div className="md:col-span-8 flex items-center justify-center">
              <div className="w-full max-w-[520px]">
                {active?.heroMedia?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={active.heroMedia.url}
                    alt={active.title}
                    className="w-full h-auto object-contain drop-shadow-[0_18px_40px_rgba(0,0,0,.15)]"
                  />
                ) : (
                  <div className="w-full h-[360px] rounded-2xl bg-black/5 border border-line" />
                )}
              </div>
            </div>

            {/* right vertical tabs */}
            <div className="md:col-span-4 flex md:justify-end">
              <div className="w-full max-w-[220px]">
                <div className="grid gap-5 text-right">
                  <button
                    onClick={() => setTab("HOME")}
                    className={`w-full py-5 px-6 text-2xl font-extrabold tracking-wide ${
                      tab === "HOME"
                        ? "bg-[#0b1020] text-brand"
                        : "bg-transparent text-ink hover:text-brand transition"
                    }`}
                  >
                    HOME
                  </button>

                  <button
                    onClick={() => setTab("AWAY")}
                    className={`w-full py-5 px-6 text-2xl font-extrabold tracking-wide ${
                      tab === "AWAY"
                        ? "bg-[#0b1020] text-brand"
                        : "bg-transparent text-ink hover:text-brand transition"
                    }`}
                  >
                    AWAY
                  </button>

                  <button
                    onClick={() => setTab("THIRD")}
                    className={`w-full py-5 px-6 text-2xl font-extrabold tracking-wide ${
                      tab === "THIRD"
                        ? "bg-[#0b1020] text-brand"
                        : "bg-transparent text-ink hover:text-brand transition"
                    }`}
                  >
                    THIRD KIT
                  </button>
                </div>
              </div>
            </div>

            {/* small rotate icon (decorative) */}
            <div className="hidden md:block absolute right-[320px] bottom-[90px]">
              <div className="h-12 w-12 rounded-full bg-white shadow grid place-items-center text-black/60">
                ↻
              </div>
            </div>
          </div>

          {/* CTA button */}
          <div className="relative pb-12 flex items-center justify-center">
            <Link
              href={active?.slug ? `/shop/${active.slug}` : (shopUrl || "/shop")}
              className="px-16 py-4 bg-[#f3e3d2] text-[#a4551b] font-extrabold tracking-wide hover:bg-[#efdbc6] transition"
            >
              VISIT SHOP
            </Link>
          </div>
        </div>


      </div>
    </section>
  );
}