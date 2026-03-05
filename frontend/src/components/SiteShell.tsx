// ============================================================
// FILE: components/SiteShell.tsx
// DROP-IN REPLACEMENT — Global layout: Navbar + Footer
//
// HEADER LAYOUT (matches mombasaunited.com exactly):
//   ┌─────────────────────────────────────────────────┐
//   │  BLACK top bar: SIGN IN (left) | TEMBEA MOMBASA (right) │
//   ├─────────────────────────────────────────────────┤
//   │  BLUE nav: Logo+ClubName | Links | Partner+Search │
//   └─────────────────────────────────────────────────┘
//
// ✅ Top bar visible on MOBILE + DESKTOP
// ✅ Club logo + club name always visible
// ✅ Partner logo visible on desktop right side
// ✅ Footer brand-tinted dark
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { Search, Menu, X, ChevronRight, User } from "lucide-react";

const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function resolveAssetUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (ASSET_BASE)
    return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  return url;
}

/* ── types ── */
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
}

/* ── nav links ── */
const NAV_LINKS = [
  { label: "LATEST", href: "/news" },
  { label: "FIXTURES", href: "/fixtures" },
  { label: "SQUAD", href: "/squad" },
  { label: "STORE", href: "/shop" },
  { label: "MEMBERSHIP", href: "/membership" },
  { label: "TICKETS", href: "/tickets" },
];

/* ── footer link groups ── */
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

/* ── social icon SVGs ── */
function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  const cls = "w-5 h-5 fill-current";
  if (p === "facebook" || p === "fb")
    return (
      <svg className={cls} viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  if (p === "twitter" || p === "x")
    return (
      <svg className={cls} viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (p === "instagram" || p === "ig")
    return (
      <svg className={cls} viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  if (p === "youtube" || p === "yt")
    return (
      <svg className={cls} viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
        <path fill="#1a1a1a" d="M9.545 15.568V8.432L15.818 12z" />
      </svg>
    );
  if (p === "tiktok")
    return (
      <svg className={cls} viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  return (
    <span className="text-xs font-bold uppercase">
      {platform.substring(0, 2)}
    </span>
  );
}

/* ── Logo component with fallback ── */
function ClubLogo({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || "/logos/club.png"}
      alt={alt}
      className={className}
      style={{ background: "transparent" }}
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        // Try fallback, then hide if that also fails
        if (!img.dataset.retried) {
          img.dataset.retried = "1";
          img.src = "/logos/club.png";
        } else {
          img.style.display = "none";
        }
      }}
    />
  );
}

function PartnerLogo({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export function SiteShell({
  children,
  settings,
  socials = [],
  sponsors = [],
  className = "",
}: SiteShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  /* ─── Heights for spacer calc ─── */
  const TOP_BAR_H = 32; // px
  const NAV_BAR_H_MOBILE = 56;
  const NAV_BAR_H_DESKTOP = 60;

  return (
    <div className={`min-h-screen flex flex-col ${className}`}>
      {/* ═══════════════════════════════════════════════════
          NAVBAR — Two-tone: black utility bar + blue brand nav
          ═══════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50">

        {/* ─── TOP BAR — BLACK, both mobile + desktop ─── */}
        <div
          className="bg-[#111111] flex items-center justify-between px-4 md:px-6 overflow-hidden"
          style={{ height: `${TOP_BAR_H}px`, minHeight: `${TOP_BAR_H}px`, maxHeight: `${TOP_BAR_H}px` }}
        >
          {/* Left: SIGN IN with person icon */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors shrink-0"
          >
            <User className="w-3.5 h-3.5" />
            <span
              className="text-[10px] md:text-[11px] font-semibold tracking-[0.14em] uppercase"
              style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
            >
              Sign In
            </span>
          </Link>

          {/* Right: TEMBEA MOMBASA */}
          <span
            className="text-[10px] md:text-[11px] text-white/50 tracking-[0.15em] uppercase font-light shrink-0"
            style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
          >
            Tembea Mombasa
          </span>
        </div>

        {/* ─── MAIN NAV — BLUE brand bar ─── */}
        <div
          className={`transition-all duration-300 ${
            scrolled
              ? "shadow-[0_2px_20px_rgba(0,0,0,0.3)]"
              : ""
          }`}
          style={{ backgroundColor: "var(--color-brand, #1a3a8a)" }}
        >
          <div
            className="max-w-[1400px] mx-auto px-4 md:px-6 flex items-center justify-between"
            style={{ height: `${NAV_BAR_H_MOBILE}px` }}
          >
            {/* ── LEFT: Logo + Club Name + (mobile) Hamburger + Search ── */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/" className="shrink-0 flex items-center gap-2">
                <ClubLogo
                  src={clubLogo}
                  alt={clubName}
                  className="h-9 md:h-11 w-auto max-w-[44px] object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
                />
               
              </Link>

              {/* Hamburger — mobile only */}
              <button
                className="md:hidden flex items-center justify-center w-9 h-9 text-white ml-1"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>

              {/* Search — mobile only */}
              <button className="md:hidden flex items-center justify-center w-9 h-9 text-white/70">
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* ── CENTER: Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 lg:px-4 py-4 text-[11px] lg:text-xs font-semibold tracking-[0.18em] transition-colors ${
                      isActive
                        ? "text-white"
                        : "text-white/80 hover:text-white"
                    }`}
                    style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-white rounded-t" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* ── RIGHT: Partner logo + Search (desktop) ── */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {/* Partner logo */}
              {partnerLogo && (
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] text-white/50 tracking-wider uppercase whitespace-nowrap"
                    style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
                  >
                    In partnership with
                  </span>
                  <PartnerLogo
                    src={partnerLogo}
                    alt={partnerName}
                    className="h-5 lg:h-6 w-auto object-contain brightness-0 invert opacity-80"
                  />
                </div>
              )}

              {/* Search icon */}
              <button className="flex items-center gap-1.5 px-3 py-2 text-white/70 hover:text-white transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ═══ MOBILE MENU — Blue overlay ═══ */}
        <div
          className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
            mobileOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none"
          }`}
          style={{
            top: `${TOP_BAR_H + NAV_BAR_H_MOBILE}px`,
            backgroundColor: "var(--color-brand, #1a3a8a)",
          }}
        >
          <div
            className="px-5 py-2 overflow-y-auto overscroll-contain"
            style={{ height: `calc(100vh - ${TOP_BAR_H + NAV_BAR_H_MOBILE}px)` }}
          >
            {NAV_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between py-[14px] border-b border-white/15 text-[13px] font-bold tracking-[0.14em] uppercase transition-colors ${
                    isActive ? "text-white" : "text-white/80"
                  }`}
                  style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
                >
                  {link.label}
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </Link>
              );
            })}

            {/* Mobile partner */}
            {partnerLogo && (
              <div className="flex items-center gap-3 mt-6 mb-4">
                <span className="text-[10px] text-white/50 tracking-wider uppercase">
                  In partnership with
                </span>
                <PartnerLogo
                  src={partnerLogo}
                  alt={partnerName}
                  className="h-5 w-auto object-contain brightness-0 invert opacity-70"
                />
              </div>
            )}

            {/* Mobile sign-in */}
            <div className="flex gap-3 mt-6">
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-3 bg-white text-[#1a3a8a] font-bold text-[12px] tracking-[0.14em] uppercase rounded"
                style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-3 border border-white/30 text-white font-bold text-[12px] tracking-[0.14em] uppercase rounded"
                style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
              >
                Register
              </Link>
            </div>

            <div className="mt-8 text-center">
              <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase">
                Tembea Mombasa
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed nav */}
      <div
        className="shrink-0"
        style={{ height: `${TOP_BAR_H + NAV_BAR_H_MOBILE}px` }}
      />

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1">{children}</main>

      {/* ═══ SPONSORS BAR ═══ */}
      {sponsors.length > 0 && (
        <section className="bg-[#f5f5f5] border-t border-[#e5e5e5] py-10">
          <div className="max-w-[1400px] mx-auto px-4 text-center">
            <h3
              className="text-[11px] tracking-[0.25em] uppercase text-[#999] mb-6 font-light"
              style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
            >
              Official Partners
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {sponsors.map((s) => {
                const sLogo = resolveAssetUrl(s.logo?.url || s.logoUrl);
                return (
                  <div
                    key={s.name}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                  >
                    {sLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sLogo}
                        alt={s.name}
                        className="h-8 md:h-10 w-auto object-contain grayscale hover:grayscale-0 transition-all"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                      />
                    ) : (
                      <span className="text-sm text-[#999] tracking-wider">
                        {s.name}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          FOOTER — Brand-tinted dark
          ═══════════════════════════════════════════════════ */}
      <footer>
        {/* Main footer */}
        <div style={{ backgroundColor: "color-mix(in srgb, var(--color-brand, #1a3a8a) 100%, black 40%)" }}>
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-12 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">
              {/* Club info column */}
              <div className="col-span-2 lg:col-span-2">
                <div className="flex items-center gap-3 mb-5">
                  <ClubLogo
                    src={clubLogo}
                    alt={clubName}
                    className="h-14 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]"
                  />
                  <div>
                    <div
                      className="font-bold text-base md:text-lg tracking-wider uppercase leading-tight text-white"
                      style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
                    >
                      {clubName}
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5">
                      Est. 2024 · Mombasa, Kenya
                    </div>
                  </div>
                </div>
                <p className="text-[13px] text-white/60 leading-relaxed max-w-sm mb-6">
                  The pride of the Kenyan coast. Official website of {clubName}.
                  Follow us for the latest news, fixtures, and more.
                </p>

                {/* Social icons */}
                {socials.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    {socials.map((s) => (
                      <a
                        key={s.platform}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                      >
                        <SocialIcon platform={s.platform} />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer link columns */}
              {FOOTER_LINKS.map((group) => (
                <div key={group.title}>
                  <h4
                    className="font-bold text-[12px] tracking-[0.18em] uppercase text-white mb-4"
                    style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
                  >
                    {group.title}
                  </h4>
                  <ul className="space-y-2.5">
                    {group.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-[13px] text-white/55 hover:text-white transition-colors"
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
        </div>

        {/* Newsletter section */}
        <div style={{ backgroundColor: "color-mix(in srgb, var(--color-brand, #1a3a8a) 100%, black 55%)" }}>
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4
                  className="font-bold text-[13px] tracking-[0.12em] uppercase text-white"
                  style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
                >
                  Stay in the loop
                </h4>
                <p className="text-[12px] text-white/45 mt-1">
                  Get the latest news and fixture updates delivered to your inbox.
                </p>
              </div>
              <div className="flex w-full md:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 md:w-64 px-4 py-2.5 bg-white/10 text-[13px] text-white placeholder:text-white/30 border border-white/15 rounded-l focus:outline-none focus:ring-1 focus:ring-white/40"
                />
                <button
                  className="px-5 py-2.5 bg-white text-[#1a3a8a] font-bold text-[12px] tracking-[0.12em] uppercase rounded-r hover:bg-white/90 transition-colors whitespace-nowrap"
                  style={{ fontFamily: "var(--font-display, 'Oswald', sans-serif)" }}
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="bg-[#111]">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[11px] text-white/35">
            <span>
              © {new Date().getFullYear()} {clubName}. All rights reserved.
            </span>
            <div className="flex gap-5">
              <Link
                href="/privacy"
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
