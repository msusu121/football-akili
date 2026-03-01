// ============================================================
// FILE: frontend/src/components/SiteShell.tsx
// DROP-IN REPLACEMENT — Global layout: Navbar + Footer
//
// Man Utd-inspired navigation with Mombasa United branding.
// Mobile hamburger menu, sticky nav, animated transitions.
// Footer: blue/gold/black, socials, club links.
//
// IMPORTANT: Uses actual logo images from settings.logoUrl
// and settings.partnerLogoUrl — NO "MU" text fallbacks.
//
// BRAND: Royal Blue (#1a56db), Gold (#d4a017), Navy (#0a1628)
// ============================================================

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";

/* ── types ── */
interface SiteSettings {
  clubName?: string;
  logoUrl?: string;
  partnerName?: string;
  partnerLogoUrl?: string;
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
  url?: string;
  tier?: string;
}

interface SiteShellProps {
  children: ReactNode;
  settings?: SiteSettings;
  socials?: Social[];
  sponsors?: Sponsor[];
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
  if (p === "facebook" || p === "fb")
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  if (p === "twitter" || p === "x")
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  if (p === "instagram" || p === "ig")
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  if (p === "youtube" || p === "yt")
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  if (p === "tiktok")
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    );
  return <span className="text-xs font-bold uppercase">{platform.substring(0, 2)}</span>;
}

export function SiteShell({ children, settings, socials = [], sponsors = [] }: SiteShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const clubName = settings?.clubName || "Mombasa United FC";
  const clubLogo = settings?.logoUrl || "/images/club-logo.png";
  const partnerName = settings?.partnerName || "SportPesa";
  const partnerLogo = settings?.partnerLogoUrl || "/images/partner-logo.png";

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink">
      {/* ═══════════════════════════════════════════════════
          NAVBAR — Sticky, dark, Man Utd-inspired
          ═══════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-brand/95 backdrop-blur-md shadow-soft" : "bg-brand"
        }`}
      >
        {/* Top bar — club name + sign in / register (desktop) */}
        <div className="hidden md:block border-b border-white/10">
          <div className="container-ms flex items-center justify-between py-2">
            <span className="text-[10px] text-white/40 tracking-[0.2em] uppercase font-bold">
              {clubName}
            </span>
            <div className="flex items-center gap-4 text-[11px] text-white/50">
              <Link href="/account" className="hover:text-brand transition">
                Sign In
              </Link>
              <span className="text-white/20">|</span>
              <Link href="/register" className="hover:text-brand transition">
                Register
              </Link>
            </div>
          </div>
        </div>

        {/* Main nav bar */}
        <div className="container-ms flex items-center justify-between h-16 md:h-[72px]">
          {/* ── Club Logo (REAL image, not text) ── */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={clubLogo}
              alt={clubName}
              className="h-10 md:h-12 w-auto object-contain"
            />
            <span className="hidden lg:block text-white font-extrabold text-sm tracking-wide uppercase">
              {clubName}
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 text-[12px] font-extrabold tracking-[0.15em] uppercase transition-colors ${
                    isActive ? "text-brand" : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-brand rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side: Partner logo + Search + Hamburger */}
          <div className="flex items-center gap-4">
            {/* ── Partner / Sponsor Logo (REAL image) ── */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[9px] text-white/30 tracking-wider uppercase">
                In partnership with
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partnerLogo}
                alt={partnerName}
                className="h-6 w-auto object-contain brightness-0 invert opacity-70 hover:opacity-100 transition-opacity"
              />
            </div>

            {/* Search button */}
            <button
              className="p-2 text-white/60 hover:text-white transition"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>

            {/* Hamburger (mobile only) */}
            <button
              className="md:hidden p-2 text-white/80 hover:text-white transition"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ═══ MOBILE MENU — Full-screen overlay ═══ */}
        <div
          className={`md:hidden fixed inset-0 top-16 z-40 bg-brand transition-all duration-300 ${
            mobileOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <nav className="flex flex-col p-6 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between py-4 border-b border-white/10 text-base font-extrabold tracking-[0.12em] uppercase transition-colors ${
                    isActive ? "text-brand" : "text-white/80"
                  }`}
                >
                  <span>{link.label}</span>
                  <svg className="w-4 h-4 text-white/30" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              );
            })}

            {/* Mobile partner logo */}
            <div className="pt-4 pb-2 flex items-center gap-2 border-b border-white/10">
              <span className="text-[9px] text-white/30 tracking-wider uppercase">
                In partnership with
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partnerLogo}
                alt={partnerName}
                className="h-5 w-auto object-contain brightness-0 invert opacity-60"
              />
            </div>

            {/* Mobile sign-in */}
            <div className="pt-6 flex items-center gap-4">
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-3 bg-brand text-white font-extrabold text-sm tracking-wider uppercase rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileOpen(false)}
                className="flex-1 text-center py-3 border-2 border-white/20 text-white font-extrabold text-sm tracking-wider uppercase rounded-lg"
              >
                Register
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════ */}
      <main className="flex-1">{children}</main>

      {/* ═══════════════════════════════════════════════════
          SPONSORS BAR
          ═══════════════════════════════════════════════════ */}
      {sponsors.length > 0 && (
        <section className="bg-white border-t border-line py-10">
          <div className="container-ms">
            <p className="text-center text-[10px] font-extrabold tracking-[0.3em] uppercase text-muted mb-8">
              Official Partners
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
              {sponsors.map((s) => (
                <a
                  key={s.name}
                  href={s.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all"
                >
                  {s.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logoUrl} alt={s.name} className="h-10 md:h-12 w-auto object-contain" />
                  ) : (
                    <span className="text-sm font-bold text-muted">{s.name}</span>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          FOOTER — Mombasa United branding (blue/navy/black)
          ═══════════════════════════════════════════════════ */}
      <footer className="footer-surface">
        {/* Main footer */}
        <div className="container-ms py-14 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={clubLogo} alt={clubName} className="h-14 w-auto" />
                <div>
                  <p className="font-extrabold text-white text-base tracking-wide uppercase">
                    {clubName}
                  </p>
                  <p className="text-[10px] text-white/40 tracking-[0.2em] uppercase mt-0.5">
                    Est. 2024 · Mombasa, Kenya
                  </p>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                The pride of the Kenyan coast. Official website of {clubName}.
                Follow us for the latest news, fixtures, and more.
              </p>

              {/* Social icons */}
              {socials.length > 0 && (
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
              )}
            </div>

            {/* Link columns */}
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h4 className="text-[11px] font-extrabold tracking-[0.2em] uppercase text-brand mb-5">
                  {group.title}
                </h4>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/50 hover:text-white transition-colors"
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

        {/* Newsletter section */}
        <div className="border-t border-white/10">
          <div className="container-ms py-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-white">Stay in the loop</p>
              <p className="text-xs text-white/40 mt-1">Get the latest news and fixture updates delivered to your inbox.</p>
            </div>
            <div className="newsletter-wrap">
              <input
                type="email"
                placeholder="Your email address"
                className="newsletter-input"
              />
              <button className="newsletter-send" aria-label="Subscribe">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="container-ms py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-white/30">
              © {new Date().getFullYear()} {clubName}. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-[11px] text-white/30">
              <Link href="/privacy" className="hover:text-white/60 transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white/60 transition">
                Terms of Use
              </Link>
            </div>
          </div>
        </div>

        {/* Blue bottom accent */}
        <div className="h-1 bg-brand-2" />
      </footer>
    </div>
  );
}
