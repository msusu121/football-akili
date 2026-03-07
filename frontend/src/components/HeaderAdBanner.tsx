"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

type HeaderAdItem = {
  id: string;
  title: string;
  href?: string | null;
  ctaLabel?: string | null;
  imageUrl?: string | null;
};

type Props = {
  items: HeaderAdItem[];
  brandIntroText?: string;
  brandIntroOncePerSession?: boolean;
  brandIntroMs?: number;
  rotateMs?: number;
};

function safeSessionGet(k: string) {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function safeSessionSet(k: string, v: string) {
  try {
    sessionStorage.setItem(k, v);
  } catch {}
}

export function HeaderAdBanner({
  items,
  brandIntroText = "MOMBASA BORN & BRED",
  brandIntroOncePerSession = true,
  brandIntroMs = 2400,
  rotateMs = 9000,
}: Props) {
  const reduceMotion = useReducedMotion();

  const hasAds = Array.isArray(items) && items.length > 0;

  const introKey = "mu_header_intro_seen";
  const shouldShowIntro = useMemo(() => {
    if (!brandIntroText) return false;
    if (!brandIntroOncePerSession) return true;
    return safeSessionGet(introKey) !== "1";
  }, [brandIntroText, brandIntroOncePerSession]);

  const [phase, setPhase] = useState<"INTRO" | "ADS">(() => (shouldShowIntro ? "INTRO" : "ADS"));
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // INTRO -> ADS
  useEffect(() => {
    if (phase !== "INTRO") return;

    if (brandIntroOncePerSession) safeSessionSet(introKey, "1");

    if (reduceMotion) {
      setPhase("ADS");
      return;
    }

    const t = window.setTimeout(() => setPhase("ADS"), brandIntroMs);
    return () => window.clearTimeout(t);
  }, [phase, brandIntroMs, brandIntroOncePerSession, reduceMotion]);

  // Rotate ADS
  useEffect(() => {
    if (phase !== "ADS") return;
    if (!hasAds) return;

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setIdx((v) => (v + 1) % items.length);
    }, rotateMs) as any;

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [phase, hasAds, items.length, rotateMs]);

  const active = phase === "ADS" && hasAds ? items[idx] : null;

  const enter = reduceMotion ? { opacity: 1 } : { opacity: 0, y: -10, clipPath: "inset(0 0 100% 0)" };
  const center = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" };
  const exit = reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, clipPath: "inset(100% 0 0 0)" };

  return (
    <div className="relative w-full overflow-hidden bg-black">
      {/* subtle premium wash + moving sheen */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_30%,white,transparent_40%),radial-gradient(circle_at_50%_120%,white,transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.10] bg-[linear-gradient(110deg,transparent_0%,white_7%,transparent_14%,transparent_100%)] animate-[muSheen_5.5s_linear_infinite]" />

      <AnimatePresence mode="wait" initial={false}>
        {phase === "INTRO" ? (
          <motion.div
            key="intro"
            initial={enter}
            animate={center}
            exit={exit}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="h-[74px] sm:h-[84px] w-full"
          >
            <div className="h-full container-ms flex items-center justify-center">
              <div className="text-center">
                <div className="text-white/70 text-[10px] sm:text-[11px] font-extrabold tracking-[0.35em] uppercase">
                  Official Club Message
                </div>

                <div
                  className="mt-1 text-white font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-[clamp(1.05rem,4.6vw,2.10rem)]"
                  style={{ textShadow: "0 10px 24px rgba(0,0,0,.35)" }}
                >
                  {brandIntroText}
                </div>

                <motion.div
                  initial={reduceMotion ? { width: "64%" } : { width: 0 }}
                  animate={{ width: "64%" }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="mx-auto mt-2 h-[2px] bg-brand rounded-full"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={active?.id || "ads-empty"}
            initial={enter}
            animate={center}
            exit={exit}
            transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="h-[74px] sm:h-[84px] w-full"
          >
            <div className="relative h-full w-full">
              <div className="container-ms h-full flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {active?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={active.imageUrl}
                      alt={active.title}
                      className="h-[44px] sm:h-[52px] w-auto object-contain rounded-md bg-white/5 border border-white/10 px-2 py-1"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="h-[44px] sm:h-[52px] w-[88px] rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
                      <span className="text-white/60 text-[10px] font-extrabold tracking-widest uppercase">AD</span>
                    </div>
                  )}

                  
                </div>

                {active?.href ? (
                  <Link
                    href={active.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white text-black px-4 sm:px-5 py-2 font-extrabold text-[11px] tracking-[0.16em] uppercase hover:opacity-95 transition"
                  >
                    {active?.ctaLabel || "Learn More"}
                    <span aria-hidden="true" className="text-base leading-none">›</span>
                  </Link>
                ) : (
                  <div className="shrink-0 inline-flex items-center gap-2 rounded-full bg-white/10 text-white px-4 sm:px-5 py-2 font-extrabold text-[11px] tracking-[0.16em] uppercase border border-white/15">
                    {active?.ctaLabel || "Sponsored"}
                  </div>
                )}
              </div>

              {/* bottom progress bar */}
              {hasAds && !reduceMotion ? (
                <div className="absolute left-0 right-0 bottom-0 h-[2px] bg-white/10">
                  <div className="h-full bg-brand animate-[muBar_9s_linear_infinite]" />
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes muSheen {
          0% { transform: translateX(-35%); opacity: 0.0; }
          10% { opacity: 0.12; }
          60% { opacity: 0.08; }
          100% { transform: translateX(35%); opacity: 0.0; }
        }
        @keyframes muBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}