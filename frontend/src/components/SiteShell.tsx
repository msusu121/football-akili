"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  X as XIcon,
  ChevronDown,
  Send,
} from "lucide-react";
import { SiTiktok } from "react-icons/si";

/**
 * IMPORTANT:
 * If your backend returns relative URLs like "/uploads/logo.png",
 * set NEXT_PUBLIC_ASSET_BASE_URL="https://api.yourdomain.com"
 */
const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function resolveAssetUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (ASSET_BASE) return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  return url;
}

function SocialIcon({ platform }: { platform: string }) {
  const p = (platform || "").toLowerCase();
  if (p.includes("facebook")) return <Facebook className="h-5 w-5" />;
  if (p.includes("instagram")) return <Instagram className="h-5 w-5" />;
  if (p.includes("youtube")) return <Youtube className="h-5 w-5" />;
  if (p === "x" || p.includes("twitter")) return <XIcon className="h-5 w-5" />;
  if (p.includes("tiktok")) return <div className="h-5 w-5"><SiTiktok size={20} /></div>;
  return null;
}

const TopLink = ({
  href,
  children,
  className,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn("text-[12px] md:text-[13px] text-white/90 hover:text-white transition", className)}
  >
    {children}
  </Link>
);

function NavLink({
  href,
  label,
  active,
  onClick,
}: {
  href: string;
  label: string;
  active?: boolean;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative px-2 py-2 text-[12px] md:text-[13px] font-semibold tracking-wide text-black/80 hover:text-black transition",
        active && "text-[#f26b1d]"
      )}
    >
      {label}
      <span
        className={cn(
          "absolute left-2 right-2 -bottom-[10px] h-[2px] bg-[#f26b1d] transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
    </Link>
  );
}

function highlightTenYears(text: string) {
  const t = (text || "").trim();
  if (!t) return null;

  // Try common variants to match screenshot behavior
  const needles = ["10 Years", "10 years", "10YEAR", "10 Year", "10 year"];
  const found = needles
    .map((n) => ({ n, i: t.indexOf(n) }))
    .find((x) => x.i !== -1);

  if (!found) return t;

  const { n: needle, i } = found;
  return (
    <>
      {t.slice(0, i)}
      <span className="text-[#f26b1d]">{needle}</span>
      {t.slice(i + needle.length)}
    </>
  );
}

export function SiteShell({
  children,
  settings,
  socials,
  sponsors,
}: {
  children: React.ReactNode;
  settings?: any;
  socials?: Array<{ platform: string; url: string }>;
  sponsors?: Array<{ id: string; name: string; logo?: { url: string } | null; tier?: string }>;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const [openSquad, setOpenSquad] = useState(false);
  const squadRef = useRef<HTMLDivElement | null>(null);

  // Celebration banner (yellow/orange)
  const hasCelebration =
    !!settings?.celebrationText && String(settings.celebrationText).trim().length > 0;

  const [showCelebration, setShowCelebration] = useState(true);

  // Announcement banner
  const hasAnnouncement =
    !!settings?.announcementText && String(settings.announcementText).trim().length > 0;

  const [showAnnouncement, setShowAnnouncement] = useState(true);

  useEffect(() => {
    if (hasCelebration) setShowCelebration(true);
  }, [settings?.celebrationText, settings?.celebrationSubText]);

  const isAdmin = useMemo(
    () => !!user && ["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"].includes(user.role),
    [user]
  );

  // Robust logo mapping (supports multiple backend key styles)
  const clubLogo = resolveAssetUrl(
    settings?.headerLogo?.url ||
      settings?.headerLogoUrl ||
      settings?.clubLogo?.url ||
      settings?.clubLogoUrl ||
      settings?.logo?.url ||
      settings?.logoUrl
  );

  const partnerLogo = resolveAssetUrl(
    settings?.partnerLogo?.url || settings?.partnerLogoUrl || settings?.partner?.logo?.url
  );

  // Squad dropdown promo image + line text
  const squadPromoImage = resolveAssetUrl(
    settings?.squadPromoImage?.url || settings?.squadPromoImageUrl
  );
  const squadPromoLine =
    settings?.squadPromoLine ||
    "WHY JOIN?\nBECOME PART OF THE FAMILY. DIRECT SUPPORT TO THE TEAM AND EXCLUSIVE COMMUNITY";

  // Close squad dropdown on outside click / esc
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!openSquad) return;
      const t = e.target as Node;
      if (squadRef.current && !squadRef.current.contains(t)) setOpenSquad(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenSquad(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openSquad]);

  const activeKey = useMemo(() => {
    if (!pathname) return "";
    if (pathname.startsWith("/news")) return "news";
    if (pathname.startsWith("/fixtures")) return "fixtures";
    if (pathname.startsWith("/squad") || pathname.startsWith("/team")) return "squad";
    if (pathname.startsWith("/shop")) return "shop";
    if (pathname.startsWith("/club")) return "club";
    return "";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white">
      {/* Top thin orange line */}
      <div className="h-[3px] bg-[#f26b1d]" />

      {/* Top black utility bar (Membership | Tickets | Shop) */}
      <div className="bg-black text-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-9 flex items-center justify-end gap-3 text-[12px]">
            <TopLink href="/membership">Membership</TopLink>
            <span className="text-white/40">|</span>
            <TopLink href="/tickets">Tickets</TopLink>
            <span className="text-white/40">|</span>
            <TopLink href="/shop">Shop</TopLink>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="bg-white">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-[74px] flex items-center justify-between gap-4">
            {/* LEFT: Club logo */}
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={clubLogo || "/logos/club.png"}
                alt="Club logo"
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logos/club.png";
                }}
              />
            </Link>

            {/* CENTER NAV */}
            <nav className="hidden md:flex items-center gap-6">
              <NavLink href="/news" label="NEWS" active={activeKey === "news"} />
              <NavLink
                href="/fixtures"
                label="FIXTURES & RESULTS"
                active={activeKey === "fixtures"}
              />

              {/* SQUAD dropdown (click-to-open mega menu) */}
              <div ref={squadRef} className="relative">
                <button
                  type="button"
                  onClick={() => setOpenSquad((v) => !v)}
                  className={cn(
                    "relative px-2 py-2 text-[12px] md:text-[13px] font-semibold tracking-wide flex items-center gap-1",
                    activeKey === "squad" ? "text-[#f26b1d]" : "text-black/80 hover:text-black"
                  )}
                  aria-haspopup="dialog"
                  aria-expanded={openSquad}
                >
                  SQUAD <ChevronDown className="h-4 w-4" />
                  <span
                    className={cn(
                      "absolute left-2 right-2 -bottom-[10px] h-[2px] bg-[#f26b1d] transition-opacity",
                      activeKey === "squad" ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>

                {openSquad ? (
                  <div
                    role="dialog"
                    aria-label="Squad menu"
                    className="absolute left-1/2 -translate-x-1/2 top-[56px] z-50 w-[860px] max-w-[92vw] rounded-xl overflow-hidden shadow-2xl border border-black/10 bg-white"
                  >
                    <div
                      className="relative"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 1px 1px, rgba(0,0,0,.06) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                      }}
                    >
                      <div className="grid grid-cols-12">
                        {/* LEFT LIST */}
                        <div className="col-span-12 md:col-span-5 p-8">
                          <div className="space-y-5">
                            <div className="text-[12px] font-extrabold tracking-widest text-black/60">
                              TEAMS
                            </div>
                            <div className="space-y-3 text-[15px] text-black/80">
                              <Link
                                href="/squad?tab=teams&team=mens"
                                onClick={() => setOpenSquad(false)}
                                className="block hover:text-black"
                              >
                                Men&apos;s First Team
                              </Link>
                              <Link
                                href="/squad?tab=teams&team=womens"
                                onClick={() => setOpenSquad(false)}
                                className="block hover:text-black"
                              >
                                Women&apos;s First Team
                              </Link>
                              <Link
                                href="/squad?tab=teams&team=youth"
                                onClick={() => setOpenSquad(false)}
                                className="block hover:text-black"
                              >
                                Youth
                              </Link>
                            </div>

                            <div className="pt-4 text-[12px] font-extrabold tracking-widest text-black/60">
                              STAFF
                            </div>
                            <div className="space-y-3 text-[15px] text-black/80">
                              <Link
                                href="/squad?tab=staff"
                                onClick={() => setOpenSquad(false)}
                                className="block hover:text-black"
                              >
                                Men&apos;s Coaching Staff
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT PROMO IMAGE */}
                        <div className="col-span-12 md:col-span-7 p-8 flex items-center justify-center">
                          <div className="w-full max-w-[520px]">
                            <div className="rounded-xl overflow-hidden shadow-lg border border-black/10 bg-white">
                              <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                               <img
  src={squadPromoImage || "http://localhost:4000/media/images/squad-promo.png"}
  alt="Squad promo"
  className="w-full h-[280px] object-cover"
  onError={(e) => {
    (e.currentTarget as HTMLImageElement).style.display = "none";
  }}
/>
                                <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white px-4 py-3">
                                  <div className="text-[11px] leading-4 whitespace-pre-line font-semibold tracking-wide">
                                    {squadPromoLine}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* close button */}
                      <button
                        type="button"
                        onClick={() => setOpenSquad(false)}
                        className="absolute right-3 top-3 h-9 w-9 grid place-items-center rounded-full hover:bg-black/5 transition"
                        aria-label="Close squad menu"
                      >
                        <XIcon className="h-5 w-5 text-black/70" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <NavLink href="/shop" label="SHOP" active={activeKey === "shop"} />
              <NavLink href="/club" label="CLUB" active={activeKey === "club"} />
            </nav>

            {/* RIGHT: partnership logo */}
            <div className="hidden md:flex items-center gap-3">
              <div className="text-[12px] text-black/60">In partnership with</div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={partnerLogo || "/logos/partner.png"}
                alt="Partner logo"
                className="h-14 md:h-20 max-w-[200px] object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            {/* AUTH (mobile) */}
            <div className="md:hidden">
              {!user ? (
                <Link href="/login" className="text-sm font-semibold">
                  Log in
                </Link>
              ) : (
                <button onClick={logout} className="text-sm font-semibold">
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Announcement strip (from settings) */}
        <div className="yellow-strip min-h-[56px]">
          {hasAnnouncement && showAnnouncement ? (
            <div className="container-ms h-full flex items-center justify-center relative">
              <div className="text-center text-[13px] md:text-[14px] text-black/85 font-semibold leading-tight px-10">
                {settings?.announcementUrl ? (
                  <a
                    href={settings.announcementUrl}
                    className="underline underline-offset-4 hover:opacity-90"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {settings.announcementText}
                  </a>
                ) : (
                  <span>{settings.announcementText}</span>
                )}
              </div>

              <button
                onClick={() => setShowAnnouncement(false)}
                className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 h-9 w-9 grid place-items-center rounded-full hover:bg-black/10 transition"
                aria-label="Close announcement"
              >
                <XIcon size={18} className="text-black/70" />
              </button>
            </div>
          ) : (
            <div className="container-ms h-full" />
          )}
        </div>
      </header>

      {/* Page */}
      <main>{children}</main>

      {/* Partnerships section */}
      {sponsors?.length ? (
        <section className="bg-white border-t border-line">
          <div className="container-ms py-16 text-center">
            <div className="h-serif text-5xl md:text-6xl font-extrabold tracking-tight">
              PARTNERSHIPS
            </div>
            <div className="mx-auto mt-4 h-[3px] w-24 bg-brand" />

            {/* ✅ FIX: bigger logos + better spacing (matches reference) */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-x-16 gap-y-10">
              {sponsors.map((s) => {
                const sLogo = resolveAssetUrl(s.logo?.url);
                return (
                  <div key={s.id} className="w-[220px] flex items-center justify-center">
                    {sLogo ? (
                      <img
                        src={sLogo}
                        alt={s.name}
                        className="h-20 md:h-28 lg:h-32 max-w-[300px] object-contain block"
                        loading="lazy"
                        onError={(e) => {
                          // hide broken image icon entirely
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-sm text-muted">{s.name}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Footer */}
      <footer className="footer-surface">
        <div className="top-accent-line" />

        <div className="container-ms py-14">
          <div className="grid gap-10 md:grid-cols-3">
            {/* LEFT */}
            <div className="flex flex-col items-start">
              <img
                src={clubLogo || "/logos/club.png"}

                alt={settings?.clubName || "Club"}
                className="h-16 object-contain block"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logos/club.png";
                }}
              />

              <div className="mt-5 text-sm text-white/65 leading-relaxed max-w-sm">
                {settings?.tagline || "The Pride. The Community. The Future."}
              </div>

              <div className="mt-7">
                <div className="text-sm font-extrabold text-brand">Quick Links</div>
                <div className="mt-3 grid gap-3 text-sm text-white/75">
                  <Link href={settings?.membershipUrl || "/membership"} className="hover:text-white">
                    Membership
                  </Link>
                  <Link href={settings?.ticketsUrl || "/tickets"} className="hover:text-white">
                    Tickets
                  </Link>
                  <Link href={settings?.shopUrl || "/shop"} className="hover:text-white">
                    Shop
                  </Link>
                  <Link href="/fixtures" className="hover:text-white">
                    Match
                  </Link>
                  <Link href="/club" className="hover:text-white">
                    Club
                  </Link>
                </div>
              </div>
            </div>

            {/* MIDDLE */}
            <div>
              <div className="text-sm font-extrabold text-brand">Contact Information</div>

              <div className="mt-5 grid gap-5 text-sm text-white/80">
                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-brand mt-0.5" />
                  <div>
                    <div className="text-white/60 text-xs mb-0.5">Email:</div>
                    <div className="font-semibold">{settings?.email || "info@yourclub.com"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-brand mt-0.5" />
                  <div>
                    <div className="text-white/60 text-xs mb-0.5">Phone:</div>
                    <div className="font-semibold">{settings?.phone || "+254 700 000 000"}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-brand mt-0.5" />
                  <div>
                    <div className="text-white/60 text-xs mb-0.5">Stadium:</div>
                    <div className="font-semibold">
                      {settings?.stadium || "Your Stadium"}, {settings?.address || "Kenya"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-9">
                <button className="footer-directions">Get Directions</button>
              </div>
            </div>

            {/* RIGHT */}
            <div>
              <div className="text-sm font-extrabold text-brand">Follow Us</div>

              <div className="mt-5 flex items-center gap-4">
                {[...(socials || []).reduce((acc, s) => {
                  if (!acc.has(s.platform)) acc.set(s.platform, s);
                  return acc;
                }, new Map()).values()].map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="social-pill"
                    aria-label={s.platform}
                  >
                    <SocialIcon platform={s.platform} />
                  </a>
                ))}
              </div>

              <div className="mt-10">
                <div className="text-sm font-extrabold text-brand">Newsletter</div>
                <div className="mt-3 text-sm text-white/70 max-w-sm">
                  Stay updated with our latest news, match updates, and exclusive offers!
                </div>

                <div className="mt-4 newsletter-wrap">
                  <input placeholder="Enter your email" className="newsletter-input" />
                  <button className="newsletter-send" aria-label="Subscribe">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 text-center text-xs text-white/45">
            © {new Date().getFullYear()} {settings?.clubName || "Club"}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}