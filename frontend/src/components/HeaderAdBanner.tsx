"use client";

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
  rotateMs = 8000,
}: Props) {
  const reduceMotion = useReducedMotion();
  const hasAds = Array.isArray(items) && items.length > 0;

  const introKey = "mu_header_intro_seen";
  const shouldShowIntro = useMemo(() => {
    if (!brandIntroText) return false;
    if (!brandIntroOncePerSession) return true;
    return safeSessionGet(introKey) !== "1";
  }, [brandIntroText, brandIntroOncePerSession]);

  const [phase, setPhase] = useState<"INTRO" | "ADS">(
    shouldShowIntro ? "INTRO" : "ADS"
  );
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (phase !== "ADS" || !hasAds) return;

    if (intervalRef.current) window.clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setIdx((v) => (v + 1) % items.length);
    }, rotateMs) as unknown as number;

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [phase, hasAds, items.length, rotateMs]);

  const active = phase === "ADS" && hasAds ? items[idx] : null;

  const enter = reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 };
  const center = { opacity: 1, y: 0 };
  const exit = reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 };

  return (
    <div className="relative w-full overflow-hidden border-b border-black/10 bg-[#ececec]">
      <AnimatePresence mode="wait" initial={false}>
        {phase === "INTRO" ? (
          <motion.div
            key="intro"
            initial={enter}
            animate={center}
            exit={exit}
            transition={{ duration: reduceMotion ? 0 : 0.4 }}
            className="relative h-[clamp(170px,52vw,250px)] md:h-[92px] xl:h-[104px] 2xl:h-[112px]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.98),rgba(243,244,246,0.98),rgba(233,236,241,1))]" />

            <div className="relative mx-auto flex h-full w-full max-w-[1320px] flex-col items-center justify-center px-4 text-center">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-slate-500 sm:text-xs">
                Mombasa United
              </div>

              <div className="mt-2 flex flex-wrap items-baseline justify-center gap-2 sm:gap-3">
                <span className="bg-[linear-gradient(90deg,#7c3aed_0%,#2563eb_55%,#ef4444_100%)] bg-clip-text text-[clamp(2.2rem,8vw,6.5rem)] font-black leading-none tracking-[-0.06em] text-transparent">
                  BORN
                </span>
                <span className="text-[clamp(1.6rem,5vw,4rem)] font-black leading-none text-blue-600">
                  &amp;
                </span>
                <span className="text-[clamp(2.2rem,8vw,6.5rem)] font-black leading-none tracking-[-0.06em] text-red-500">
                  BRED
                </span>
              </div>

              <div className="mt-3 h-[3px] w-24 rounded-full bg-brand sm:w-32" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={active?.id || "ads-empty"}
            initial={enter}
            animate={center}
            exit={exit}
            transition={{ duration: reduceMotion ? 0 : 0.5 }}
            className="relative h-[clamp(170px,52vw,250px)] md:h-[92px] xl:h-[104px] 2xl:h-[112px]"
          >
            <div className="relative mx-auto h-full w-full max-w-[1320px] bg-[#ececec]">
              {active?.href ? (
                <a
                  href={active.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full w-full"
                  aria-label={active.title || "Partner promotion"}
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-[#ececec] p-2 md:p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={active.imageUrl || ""}
                      alt={active.title || "Partner promotion"}
                      className="h-full w-full object-contain object-center"
                    />
                  </div>
                </a>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#ececec] p-2 md:p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={active?.imageUrl || ""}
                    alt={active?.title || "Partner promotion"}
                    className="h-full w-full object-contain object-center"
                  />
                </div>
              )}

              {hasAds && !reduceMotion ? (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-black/10">
                  <div className="h-full bg-brand animate-[muAdProgress_8s_linear_infinite]" />
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes muAdProgress {
          0% {
            width: 0%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default HeaderAdBanner;