"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function resolveAssetUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (ASSET_BASE) {
    return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
  return url;
}

interface SiteSettings {
  clubName?: string;
  logoUrl?: string;
  headerLogo?: { url: string };
  headerLogoUrl?: string;
  clubLogo?: { url: string };
  clubLogoUrl?: string;
  logo?: { url: string };
  partnerName?: string;
  partnerLogoUrl?: string;
  partnerLogo?: { url: string };
  partner?: { logo?: { url: string } };
  ticketsUrl?: string;
  membershipUrl?: string;
  shopUrl?: string;
}

interface Social {
  platform: string;
  url: string;
}

interface Sponsor {
  name: string;
  logoUrl?: string;
  logo?: { url: string } | null;
  url?: string;
  tier?: string;
}

interface SiteShellProps {
  children: ReactNode;
  settings?: SiteSettings;
  socials?: Social[];
  sponsors?: Sponsor[];
  className?: string;
  BG_IMG?: string;
  BG_WASH?: string;
}

type HeaderAdItem = {
  id: string;
  title?: string | null;
  href?: string | null;
  ctaLabel?: string | null;
  imageUrl?: string | null;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  focusX?: number | null;
  focusY?: number | null;
  headline?: string | null;
  subheadline?: string | null;
};

type PublicHeaderAdApiItem = {
  id: string;
  title?: string | null;
  href?: string | null;
  ctaLabel?: string | null;
  imageUrl?: string | null;
  desktopImageUrl?: string | null;
  mobileImageUrl?: string | null;
  focusX?: number | null;
  focusY?: number | null;
  headline?: string | null;
  subheadline?: string | null;
};

const NAV_LINKS = [
  { label: "LATEST", href: "/news" },
  { label: "FIXTURES", href: "/fixtures" },
  { label: "SQUAD", href: "/squad" },
  { label: "STORE", href: "/shop" },
  { label: "MEMBERSHIP", href: "/membership" },
  { label: "TICKETS", href: "/tickets" },
];

const FOOTER_LINKS = [
  {
    title: "Club",
    links: [
      { label: "About Us", href: "/about" },
      { label: "History", href: "/history" },
      { label: "Squad", href: "/squad" },
      { label: "Academy", href: "/academy" },
    ],
  },
  {
    title: "Matches",
    links: [
      { label: "Fixtures", href: "/fixtures" },
      { label: "Results", href: "/fixtures?tab=results" },
      { label: "League Table", href: "/fixtures?tab=tables" },
      { label: "Tickets", href: "/tickets" },
    ],
  },
  {
    title: "Fans",
    links: [
      { label: "Membership", href: "/membership" },
      { label: "News", href: "/news" },
      { label: "Shop", href: "/shop" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();

  if (p === "facebook" || p === "fb") {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  if (p === "twitter" || p === "x") {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }

  if (p === "instagram" || p === "ig") {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }

  if (p === "youtube" || p === "yt") {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }

  if (p === "tiktok") {
    return (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  }

  return (
    <span className="text-xs font-bold uppercase">
      {platform.substring(0, 2)}
    </span>
  );
}

function clampPercent(value: unknown, fallback: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) return `${fallback}%`;
  return `${Math.max(0, Math.min(100, n))}%`;
}

const INITIAL_TAKEOVER_MS = 60_000;
const RETURN_TAKEOVER_MIN_MS = 18_000;
const RETURN_TAKEOVER_MAX_MS = 30_000;
const RETURN_GAP_MIN_MS = 4 * 60_000;
const RETURN_GAP_MAX_MS = 10 * 60_000;
const HIDDEN_TAB_RETRY_MIN_MS = 45_000;
const HIDDEN_TAB_RETRY_MAX_MS = 90_000;
const INTRO_MS = 2_200;
const AD_ROTATE_MS = 8_000;

// in-memory runtime only
let runtimeInitialShown = false;
let runtimeActiveUntil = 0;
let runtimeNextAt = 0;
let runtimeAdCursor = 0;

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandomIndex(length: number, exclude = -1) {
  if (length <= 1) return 0;
  let next = exclude;
  while (next === exclude) {
    next = randomInt(0, length - 1);
  }
  return next;
}

function ShellImage({
  src,
  alt,
  sizes,
  wrapperClassName,
  imageClassName = "object-contain",
  fallback,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  wrapperClassName: string;
  imageClassName?: string;
  fallback?: ReactNode;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveAssetUrl(src);

  if (!resolved || failed) {
    return <>{fallback ?? null}</>;
  }

  return (
    <div className={wrapperClassName}>
      <Image
        src={resolved}
        alt={alt}
        fill
        sizes={sizes}
        className={imageClassName}
        priority={priority}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function HeaderTakeover({ items }: { items: HeaderAdItem[] }) {
  const ads = (Array.isArray(items) ? items : []).filter(
    (x) => !!(x?.imageUrl || x?.desktopImageUrl || x?.mobileImageUrl)
  );

  const adSignature = ads
    .map((ad) =>
      [
        ad.id,
        ad.imageUrl || "",
        ad.desktopImageUrl || "",
        ad.mobileImageUrl || "",
        ad.headline || "",
        ad.subheadline || "",
      ].join("|")
    )
    .join("::");

  const [idx, setIdx] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<"INTRO" | "ADS">("INTRO");
  const [visible, setVisible] = useState(false);

  const introTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const returnTimerRef = useRef<number | null>(null);
  const rotateTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();

    if (mq.addEventListener) {
      mq.addEventListener("change", sync);
      return () => mq.removeEventListener("change", sync);
    }

    mq.addListener(sync);
    return () => mq.removeListener(sync);
  }, []);

  useEffect(() => {
    if (!ads.length) return;

    ads.forEach((ad) => {
      const sources = [
        String(ad.desktopImageUrl || ad.imageUrl || "").trim(),
        String(ad.mobileImageUrl || ad.imageUrl || "").trim(),
      ].filter(Boolean);

      sources.forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    });
  }, [ads, adSignature]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const clearAllTimers = () => {
      if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      if (returnTimerRef.current) window.clearTimeout(returnTimerRef.current);
      if (rotateTimerRef.current) window.clearInterval(rotateTimerRef.current);

      introTimerRef.current = null;
      hideTimerRef.current = null;
      returnTimerRef.current = null;
      rotateTimerRef.current = null;
    };

    if (!ads.length) {
      clearAllTimers();
      setVisible(false);
      setPhase("INTRO");
      return;
    }

    const returnDuration = () =>
      randomInt(RETURN_TAKEOVER_MIN_MS, RETURN_TAKEOVER_MAX_MS);

    const returnGap = () => randomInt(RETURN_GAP_MIN_MS, RETURN_GAP_MAX_MS);

    const hiddenRetryGap = () =>
      randomInt(HIDDEN_TAB_RETRY_MIN_MS, HIDDEN_TAB_RETRY_MAX_MS);

    const scheduleReturn = (delayMs: number) => {
      const safeDelay = Math.max(15_000, delayMs);
      runtimeNextAt = Date.now() + safeDelay;

      if (returnTimerRef.current) {
        window.clearTimeout(returnTimerRef.current);
      }

      returnTimerRef.current = window.setTimeout(() => {
        if (document.visibilityState === "hidden") {
          scheduleReturn(hiddenRetryGap());
          return;
        }

        runtimeAdCursor = pickRandomIndex(ads.length, runtimeAdCursor);
        setIdx(runtimeAdCursor);
        showTakeover(returnDuration(), true);
      }, safeDelay);
    };

    const hideTakeover = () => {
      setVisible(false);
      setPhase("INTRO");
      runtimeActiveUntil = 0;
      scheduleReturn(returnGap());
    };

    const showTakeover = (durationMs: number, withIntro: boolean) => {
      if (introTimerRef.current) window.clearTimeout(introTimerRef.current);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      if (rotateTimerRef.current) window.clearInterval(rotateTimerRef.current);

      runtimeNextAt = 0;
      runtimeActiveUntil = Date.now() + durationMs;

      setVisible(true);
      setPhase(withIntro && !reduced ? "INTRO" : "ADS");

      if (withIntro && !reduced) {
        const introDuration = Math.min(INTRO_MS, Math.max(900, durationMs - 500));
        introTimerRef.current = window.setTimeout(() => {
          setPhase("ADS");
        }, introDuration);
      }

      hideTimerRef.current = window.setTimeout(() => {
        hideTakeover();
      }, durationMs);
    };

    runtimeAdCursor = Math.min(runtimeAdCursor, Math.max(ads.length - 1, 0));
    setIdx(runtimeAdCursor);

    const now = Date.now();

    if (runtimeActiveUntil > now) {
      showTakeover(runtimeActiveUntil - now, false);
      return clearAllTimers;
    }

    if (!runtimeInitialShown) {
      runtimeInitialShown = true;
      runtimeAdCursor = pickRandomIndex(ads.length, -1);
      setIdx(runtimeAdCursor);
      showTakeover(INITIAL_TAKEOVER_MS, true);
      return clearAllTimers;
    }

    if (runtimeNextAt > now) {
      scheduleReturn(runtimeNextAt - now);
      return clearAllTimers;
    }

    scheduleReturn(returnGap());
    return clearAllTimers;
  }, [ads.length, adSignature, reduced]);

  useEffect(() => {
    if (!visible || phase !== "ADS" || ads.length <= 1) return;

    rotateTimerRef.current = window.setInterval(() => {
      runtimeAdCursor = pickRandomIndex(ads.length, runtimeAdCursor);
      setIdx(runtimeAdCursor);
    }, AD_ROTATE_MS);

    return () => {
      if (rotateTimerRef.current) window.clearInterval(rotateTimerRef.current);
      rotateTimerRef.current = null;
    };
  }, [visible, phase, ads.length]);

  const activeAd = ads.length ? ads[idx % ads.length] : null;
  if (!activeAd) return null;

  const desktopSrc = String(
    activeAd.desktopImageUrl || activeAd.imageUrl || ""
  ).trim();

  const mobileSrc = String(
    activeAd.mobileImageUrl || activeAd.imageUrl || desktopSrc
  ).trim();

  const focusX = clampPercent(activeAd.focusX, 50);
  const focusY = clampPercent(activeAd.focusY, 58);

  const headline = activeAd.headline || "KHUSHI MOTORS";
  const subheadline = activeAd.subheadline || "RIDE WITH HAPPINESS";

  const adMedia = (
    <div
      className="muTakeoverMedia"
      style={
        {
          ["--mu-focus-x" as string]: focusX,
          ["--mu-focus-y" as string]: focusY,
        } as React.CSSProperties
      }
    >
      <picture>
        <source media="(max-width: 767px)" srcSet={mobileSrc} />
        <img
          src={desktopSrc}
          alt={activeAd.title || headline}
          className="muTakeoverImg"
          loading="eager"
          decoding="async"
          draggable={false}
        />
      </picture>

      <div className="muTakeoverCopy">
        <div className="muTakeoverHeadline">{headline}</div>

        <div className="muTakeoverSubWrap">
          <span className="muTakeoverLine" />
          <span className="muTakeoverSubheadline">{subheadline}</span>
          <span className="muTakeoverLine" />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`muTakeoverShell ${visible ? "isVisible" : ""}`}>
      <div className="muTakeoverShellInner">
        <div className="muTakeoverFullBleed">
          <div
            className="muTakeoverWrap"
            role="region"
            aria-label="Partner promotion"
          >
            <div
              className={`muSlide muIntro ${
                phase === "INTRO" ? "isActive" : ""
              }`}
            >
              <div className="muIntroInner">
                <div className="muIntroTop">MOMBASA</div>
                <div className="muIntroMid">
                  <span className="muBorn">BORN</span>
                  <span className="muAmp">&amp;</span>
                  <span className="muBred">BRED</span>
                </div>
              </div>
            </div>

            {activeAd.href ? (
              <a
                key={`${activeAd.id}-${idx}`}
                href={activeAd.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={activeAd.title || headline}
                className={`muSlide muAd ${phase === "ADS" ? "isActive" : ""}`}
              >
                {adMedia}
              </a>
            ) : (
              <div
                key={`${activeAd.id}-${idx}`}
                aria-label={activeAd.title || headline}
                className={`muSlide muAd ${phase === "ADS" ? "isActive" : ""}`}
              >
                {adMedia}
              </div>
            )}

            {visible && phase === "ADS" && ads.length > 1 ? (
              <div className="muProgressTrack" aria-hidden="true">
                <div key={`${activeAd.id}-${idx}`} className="muProgressBar" />
              </div>
            ) : null}
          </div>

          <style jsx global>{`
            .muTakeoverShell {
              max-height: 0;
              opacity: 0;
              overflow: hidden;
              transition: max-height 520ms cubic-bezier(0.22, 1, 0.36, 1),
                opacity 280ms ease;
              will-change: max-height, opacity;
            }

            .muTakeoverShell.isVisible {
              max-height: 190px;
              opacity: 1;
            }

            .muTakeoverShellInner {
              min-height: 0;
            }

            .muTakeoverFullBleed {
              width: 100vw;
              position: relative;
              left: 50%;
              right: 50%;
              margin-left: -50vw;
              margin-right: -50vw;
              background: #06142f;
            }

            .muTakeoverWrap {
              position: relative;
              width: 100%;
              overflow: hidden;
              background: #06142f;
              border-bottom: 1px solid rgba(255, 255, 255, 0.08);
              isolation: isolate;
              height: 110px;
            }

            @media (min-width: 480px) {
              .muTakeoverWrap {
                height: 124px;
              }
            }

            @media (min-width: 768px) {
              .muTakeoverWrap {
                height: 136px;
              }
            }

            @media (min-width: 1024px) {
              .muTakeoverWrap {
                height: 150px;
              }
            }

            @media (min-width: 1280px) {
              .muTakeoverWrap {
                height: 164px;
              }
            }

            .muSlide {
              position: absolute;
              inset: 0;
              opacity: 0;
              transform: translateY(6px);
              transition: opacity 380ms ease, transform 380ms ease;
              will-change: opacity, transform;
            }

            .muSlide.isActive {
              opacity: 1;
              transform: translateY(0);
              z-index: 2;
            }

            .muAd {
              display: block;
              width: 100%;
              height: 100%;
              text-decoration: none;
              color: inherit;
            }

            .muTakeoverMedia {
              position: relative;
              width: 100%;
              height: 100%;
              background: transparent;
            }

            .muTakeoverMedia picture {
              display: block;
              width: 100%;
              height: 100%;
            }

            .muTakeoverImg {
              display: block;
              width: 100%;
              height: 100%;
              object-fit: cover;
              object-position: var(--mu-focus-x, 50%) var(--mu-focus-y, 58%);
              user-select: none;
              -webkit-user-drag: none;
            }

            .muTakeoverCopy {
              position: absolute;
              left: 50%;
              top: 47%;
              transform: translate(-50%, -50%);
              z-index: 2;
              width: min(92%, 980px);
              text-align: center;
              pointer-events: none;
            }

            .muTakeoverHeadline {
              color: #fff;
              font-weight: 1000;
              letter-spacing: 0.04em;
              line-height: 0.92;
              text-transform: uppercase;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
              font-size: clamp(16px, 3vw, 40px);
            }

            .muTakeoverSubWrap {
              margin-top: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }

            .muTakeoverLine {
              width: clamp(28px, 6vw, 90px);
              height: 2px;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.95);
              flex: 0 0 auto;
            }

            .muTakeoverSubheadline {
              color: rgba(255, 255, 255, 0.98);
              font-weight: 800;
              letter-spacing: 0.22em;
              line-height: 1;
              text-transform: uppercase;
              white-space: nowrap;
              text-shadow: 0 2px 10px rgba(0, 0, 0, 0.24);
              font-size: clamp(8px, 1.35vw, 18px);
            }

            .muIntro {
              background: radial-gradient(
                circle at center,
                rgba(255, 255, 255, 0.98) 0%,
                rgba(243, 244, 246, 0.98) 58%,
                rgba(233, 236, 241, 1) 100%
              );
            }

            .muIntroInner {
              position: absolute;
              inset: 0;
              display: grid;
              place-content: center;
              text-align: center;
              padding: 12px 18px;
              line-height: 0.9;
            }

            .muIntroTop {
              font-weight: 1000;
              color: #10214a;
              letter-spacing: -0.04em;
              font-size: clamp(14px, 2.6vw, 34px);
              animation: muIntroTopIn 520ms ease both;
            }

            .muIntroMid {
              display: inline-flex;
              align-items: baseline;
              justify-content: center;
              gap: 8px;
              margin-top: 2px;
              flex-wrap: wrap;
            }

            .muBorn {
              font-weight: 1000;
              letter-spacing: -0.05em;
              font-size: clamp(24px, 6vw, 64px);
              background: linear-gradient(
                90deg,
                #7c3aed 0%,
                #2563eb 60%,
                #ef4444 100%
              );
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              animation: muBornIn 650ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
            }

            .muAmp {
              font-weight: 1000;
              color: #2563eb;
              font-size: clamp(16px, 3vw, 34px);
              animation: muAmpIn 650ms 120ms cubic-bezier(0.2, 0.8, 0.2, 1)
                both;
            }

            .muBred {
              font-weight: 1000;
              color: #ef4444;
              letter-spacing: -0.05em;
              font-size: clamp(24px, 6vw, 64px);
              animation: muBredIn 650ms 180ms cubic-bezier(0.2, 0.8, 0.2, 1)
                both;
            }

            @keyframes muIntroTopIn {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            @keyframes muBornIn {
              from {
                opacity: 0;
                transform: translateX(-16px) scale(0.96);
              }
              to {
                opacity: 1;
                transform: translateX(0) scale(1);
              }
            }

            @keyframes muAmpIn {
              from {
                opacity: 0;
                transform: scale(0.75);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }

            @keyframes muBredIn {
              from {
                opacity: 0;
                transform: translateX(16px) scale(0.96);
              }
              to {
                opacity: 1;
                transform: translateX(0) scale(1);
              }
            }

            @media (max-width: 767px) {
              .muTakeoverCopy {
                top: 44%;
                width: 94%;
              }

              .muTakeoverHeadline {
                font-size: clamp(18px, 7vw, 34px);
              }

              .muTakeoverSubWrap {
                gap: 7px;
                margin-top: 3px;
              }

              .muTakeoverLine {
                width: clamp(18px, 10vw, 44px);
                height: 2px;
              }

              .muTakeoverSubheadline {
                font-size: clamp(7px, 2.7vw, 11px);
                letter-spacing: 0.16em;
              }

              .muIntroInner {
                padding: 10px 14px;
              }
            }

            .muProgressTrack {
              position: absolute;
              left: 0;
              right: 0;
              bottom: 0;
              height: 2px;
              background: rgba(255, 255, 255, 0.12);
              z-index: 3;
            }

            .muProgressBar {
              width: 100%;
              height: 100%;
              transform-origin: left center;
              background: var(--brand-accent, #f4b400);
              animation: muTakeoverProgress 8s linear forwards;
            }

            @keyframes muTakeoverProgress {
              from {
                transform: scaleX(0);
              }
              to {
                transform: scaleX(1);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .muTakeoverShell {
                transition: none;
              }

              .muSlide,
              .muBorn,
              .muAmp,
              .muBred,
              .muIntroTop {
                transition: none;
                animation: none;
                transform: none;
              }

              .muProgressBar {
                animation: none;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export function SiteShell({
  children,
  settings,
  socials = [],
  sponsors = [],
  className = "",
  BG_IMG = "https://mombasaunited.com/club-media/images/back3.jpeg",
  BG_WASH = "rgba(255, 255, 255, 0.75)",
}: SiteShellProps) {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerH, setHeaderH] = useState(104);
  const [headerAds, setHeaderAds] = useState<HeaderAdItem[]>([]);

  useEffect(() => setMobileOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () =>
      setHeaderH(Math.round(el.getBoundingClientRect().height));
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    async function loadAds() {
      try {
        const base = API_BASE || "";
        const r = await fetch(`${base}/public/ads?placement=HEADER_TOP`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!r.ok) {
          setHeaderAds([]);
          return;
        }

        const json = await r.json();
        if (!alive) return;

        const items: PublicHeaderAdApiItem[] = Array.isArray(json?.items)
          ? json.items
          : [];

        const normalized = items
          .map((x) => ({
            id: x.id,
            title: x.title,
            href: x.href,
            ctaLabel: x.ctaLabel,
            imageUrl: resolveAssetUrl(x.imageUrl),
            desktopImageUrl:
              resolveAssetUrl(x.desktopImageUrl) || resolveAssetUrl(x.imageUrl),
            mobileImageUrl:
              resolveAssetUrl(x.mobileImageUrl) || resolveAssetUrl(x.imageUrl),
            focusX: x.focusX ?? 50,
            focusY: x.focusY ?? 58,
            headline: x.headline ?? "KHUSHI MOTORS",
            subheadline: x.subheadline ?? "RIDE WITH HAPPINESS",
          }))
          .filter(
            (x) => !!(x.imageUrl || x.desktopImageUrl || x.mobileImageUrl)
          );

        setHeaderAds(normalized);
      } catch {
        if (alive) setHeaderAds([]);
      }
    }

    loadAds();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const clubName = settings?.clubName || "Mombasa United FC";
  const clubLogo = resolveAssetUrl(
    settings?.headerLogo?.url ||
      settings?.headerLogoUrl ||
      settings?.clubLogo?.url ||
      settings?.clubLogoUrl ||
      settings?.logo?.url ||
      settings?.logoUrl
  );

  const partnerName = settings?.partnerName || "SportPesa";
  const partnerLogo = resolveAssetUrl(
    settings?.partnerLogo?.url ||
      settings?.partnerLogoUrl ||
      settings?.partner?.logo?.url
  );

  return (
    <div
      className={`min-h-screen flex flex-col text-ink ${className}`}
      style={{
        backgroundImage: `linear-gradient(${BG_WASH}, ${BG_WASH}), url(${BG_IMG})`,
        backgroundRepeat: "repeat",
        backgroundSize: "600px",
        backgroundPosition: "top center",
      }}
    >
      <header
        ref={headerRef as any}
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-soft" : ""
        }`}
      >
        <HeaderTakeover items={headerAds} />

        <div className="border-b border-white/10 bg-ink text-white">
          <div className="container-ms flex h-10 items-center justify-between">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/90 transition hover:text-white"
              aria-label="Sign in"
            >
              <svg
                className="h-4 w-4 text-white/80"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 20.25a7.5 7.5 0 0115 0"
                />
              </svg>
              <span>Sign In</span>
            </Link>

            <div className="whitespace-nowrap text-[11px] font-extrabold uppercase tracking-[0.22em] text-white">
              Tembea Mombasa
            </div>
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            scrolled ? "bg-brand/95 backdrop-blur-md" : "bg-brand"
          }`}
        >
          <div className="container-ms flex h-16 items-center justify-between md:h-[72px]">
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <ShellImage
                  src={clubLogo}
                  alt={clubName}
                  sizes="(max-width: 767px) 180px, 240px"
                  wrapperClassName="relative h-12 w-[180px] shrink-0 bg-transparent md:h-14 md:w-[240px]"
                  imageClassName="object-contain"
                  priority
                  fallback={
                    <div className="flex h-12 w-[180px] shrink-0 items-center justify-center rounded-xl bg-blue-900/30 text-white md:h-14 md:w-[240px]">
                      <span className="text-sm font-black tracking-wide">MU</span>
                    </div>
                  }
                />
                <span className="hidden truncate text-sm font-extrabold uppercase tracking-wide text-white lg:block">
                  {clubName}
                </span>
              </Link>

              <button
                className="p-2 text-white/80 transition hover:text-white md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                )}
              </button>

              <button
                className="p-2 text-white/60 transition hover:text-white md:hidden"
                aria-label="Search"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            </div>

            <nav className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href || pathname.startsWith(link.href + "/");

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.15em] transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {link.label}
                    {isActive ? (
                      <span className="absolute bottom-0 left-4 right-4 h-[2px] rounded-full bg-[color:var(--brand-accent)]" />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden shrink-0 items-center gap-4 md:flex">
              <div className="hidden items-center gap-2 lg:flex">
                <span className="text-[9px] uppercase tracking-wider text-white/30">
                  In partnership with
                </span>

                <ShellImage
                  src={partnerLogo}
                  alt={partnerName}
                  sizes="112px"
                  wrapperClassName="relative h-8 w-[112px]"
                  imageClassName="object-contain opacity-80 transition-opacity hover:opacity-100"
                  fallback={
                    <span className="text-xs font-bold text-white/60">
                      {partnerName}
                    </span>
                  }
                />
              </div>

              <button
                className="p-2 text-white/60 transition hover:text-white"
                aria-label="Search"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            className={`md:hidden ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          >
            <div
              className={`fixed inset-x-0 bottom-0 z-40 transition-opacity duration-300 ${
                mobileOpen ? "opacity-100" : "opacity-0"
              }`}
              style={{ top: headerH }}
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="absolute inset-0 bg-ink/70"
              />

              <div
                className={`absolute inset-0 overflow-y-auto bg-brand shadow-[0_24px_60px_rgba(0,0,0,0.35)] transition-all duration-300 ${
                  mobileOpen ? "translate-y-0" : "-translate-y-4"
                }`}
              >
                <nav className="flex min-h-full flex-col px-6 pb-8 pt-4">
                  {NAV_LINKS.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      pathname.startsWith(link.href + "/");

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center justify-between border-b border-white/10 py-4 text-base font-extrabold uppercase tracking-[0.12em] transition-colors ${
                          isActive ? "text-white" : "text-white/90 hover:text-white"
                        }`}
                      >
                        <span>{link.label}</span>
                        <svg
                          className="h-4 w-4 text-white/40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </Link>
                    );
                  })}

                  <div className="flex items-center gap-2 border-b border-white/10 pb-3 pt-5">
                    <span className="text-[9px] uppercase tracking-wider text-white/40">
                      In partnership with
                    </span>

                    <ShellImage
                      src={partnerLogo}
                      alt={partnerName}
                      sizes="96px"
                      wrapperClassName="relative h-6 w-[96px]"
                      imageClassName="object-contain brightness-0 invert opacity-80"
                      fallback={
                        <span className="text-[10px] font-bold text-white/60">
                          {partnerName}
                        </span>
                      }
                    />
                  </div>

                  <div className="mt-6 flex items-center gap-4">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-lg bg-white py-3 text-center text-sm font-extrabold uppercase tracking-wider text-ink"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex-1 rounded-lg border-2 border-white/30 py-3 text-center text-sm font-extrabold uppercase tracking-wider text-white"
                    >
                      Register
                    </Link>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {sponsors.length > 0 ? (
        <section className="border-t border-line bg-white py-12 md:py-14">
          <div className="container-ms">
            <p className="mb-8 text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-muted">
              Official Partners
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-8 md:gap-x-14 md:gap-y-10">
              {sponsors.map((s) => {
                const sLogo = resolveAssetUrl(s.logo?.url || s.logoUrl);

                return (
                  <a
                    key={s.name}
                    href={s.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center"
                  >
                    {sLogo ? (
                      <ShellImage
                        src={sLogo}
                        alt={s.name}
                        sizes="(max-width: 767px) 180px, (max-width: 1279px) 240px, 280px"
                        wrapperClassName="relative h-14 w-[180px] sm:h-16 sm:w-[210px] md:h-20 md:w-[240px] lg:h-24 lg:w-[280px]"
                        imageClassName="object-contain opacity-80 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
                        fallback={
                          <span className="text-sm font-bold text-muted">
                            {s.name}
                          </span>
                        }
                      />
                    ) : (
                      <span className="text-sm font-bold text-muted">{s.name}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <footer className="footer-surface">
        <div className="container-ms py-14 md:py-16">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-8">
            <div className="md:col-span-2">
              <div className="mb-5 flex items-center gap-3">
                <ShellImage
                  src={clubLogo}
                  alt={clubName}
                  sizes="56px"
                  wrapperClassName="relative h-14 w-14 shrink-0 bg-transparent"
                  imageClassName="object-contain"
                  fallback={
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-900/30 text-white">
                      <span className="text-sm font-black">MU</span>
                    </div>
                  }
                />

                <div>
                  <p className="text-base font-extrabold uppercase tracking-wide text-white">
                    {clubName}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    Est. 2024 · Mombasa, Kenya
                  </p>
                </div>
              </div>

              <p className="max-w-sm text-sm leading-relaxed text-white/50">
                The pride of the Kenyan coast. Official website of {clubName}.
                Follow us for the latest news, fixtures, and more.
              </p>

              {socials.length > 0 ? (
                <div className="mt-6 flex items-center gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.platform}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-pill"
                      aria-label={`Follow on ${s.platform}`}
                    >
                      <SocialIcon platform={s.platform} />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h4 className="mb-5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand">
                  {group.title}
                </h4>

                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/50 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-ms flex flex-col items-center justify-between gap-3 py-5 md:flex-row">
            <p className="text-[11px] text-white/30">
              © {new Date().getFullYear()} {clubName}. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-white/30">
              <Link href="/privacy" className="transition hover:text-white/60">
                Privacy Policy
              </Link>

              <Link href="/terms" className="transition hover:text-white/60">
                Terms of Use
              </Link>

              <a
                href="https://akilimatic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-white/70"
              >
                Powered by{" "}
                <span className="font-semibold text-white/60">Akilimatic</span>
              </a>
            </div>
          </div>
        </div>

        <div className="h-1 bg-brand-2" />
      </footer>
    </div>
  );
}

export default SiteShell;