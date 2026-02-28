"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

// Replica-style shell for the tickets subdomain UI (clean white canvas, minimal nav)
export default function TicketsShell({
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
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* thin orange accent */}
      <div className="h-1 bg-brand" />

      {/* top black strip */}
      <div className="bg-black">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {settings?.headerLogo?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.headerLogo.url}
                alt={settings?.clubName || "Club"}
                className="h-10 w-10 object-contain"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10" />
            )}
          </Link>

          <nav className="flex items-center gap-8 text-sm font-semibold tracking-wide">
            <Link href="/tickets" className="text-brand hover:opacity-90">HOME</Link>
            <Link href={settings?.membershipUrl || "/membership"} className="text-brand hover:opacity-90">MEMBERSHIP</Link>
            <Link href="/club" className="text-brand hover:opacity-90">SUPPORT</Link>
          </nav>

          <div className="w-10" />
        </div>
      </div>

      <main className="flex-1">{children}</main>

      {/* Footer kept consistent with main site */}
      <footer className="border-t border-line dark-section">
        {sponsors?.length ? (
          <div className="mx-auto max-w-6xl px-4 pt-10">
            <div className="text-sm font-semibold tracking-wide">PARTNERSHIPS</div>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {sponsors.map((s) => (
                <div key={s.id} className="rounded-2xl border border-line bg-white/5 p-4 flex items-center justify-center">
                  {s.logo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.logo.url} alt={s.name} className="max-h-10 object-contain" />
                  ) : (
                    <span className="text-sm text-white/70">{s.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-6xl px-4 py-10 grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              {settings?.headerLogo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.headerLogo.url} alt={settings?.clubName || "Club"} className="h-10 w-10 object-contain" />
              ) : null}
              <div className="text-sm font-semibold">{settings?.clubName || "Club"}</div>
            </div>
            <div className="text-sm text-white/70 mt-4">{settings?.tagline || "We are more than a football club; we are a community united by passion."}</div>
          </div>

          <div>
            <div className="text-sm font-semibold">Quick Links</div>
            <div className="mt-3 grid gap-2 text-sm text-white/70">
              <Link href={settings?.membershipUrl || "/membership"} className="hover:text-white">Membership</Link>
              <Link href={settings?.ticketsUrl || "/tickets"} className="hover:text-white">Tickets</Link>
              <Link href={settings?.shopUrl || "/shop"} className="hover:text-white">Shop</Link>
              <Link href="/fixtures" className="hover:text-white">Match</Link>
              <Link href="/club" className="hover:text-white">Club</Link>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Contact Information</div>
            <div className="mt-3 text-sm text-white/70 grid gap-1">
              <div>Email: {settings?.email || "info@club.com"}</div>
              <div>Phone: {settings?.phone || "+254 700 000 000"}</div>
              <div>Stadium: {settings?.stadium || "Stadium"}</div>
            </div>
            <div className="mt-5 flex items-center gap-3 text-white/70">
              {(socials || []).map((s) => (
                <a key={s.platform} href={s.url} target="_blank" rel="noreferrer" className="hover:text-white">
                  {s.platform === "Facebook" ? <Facebook size={18} /> : null}
                  {s.platform === "Instagram" ? <Instagram size={18} /> : null}
                  {s.platform === "YouTube" ? <Youtube size={18} /> : null}
                  {s.platform === "X" ? <Twitter size={18} /> : null}
                </a>
              ))}
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">Newsletter</div>
              <div className="mt-2 text-sm text-white/70">Stay updated with our latest news, match updates, and exclusive offers!</div>
              <div className="mt-3 flex gap-2">
                <input placeholder="Enter your email" className="flex-1 rounded-xl bg-white/5 border border-line px-3 py-2 text-sm outline-none focus:border-white/30" />
                <button className="rounded-xl bg-brand text-black px-4 py-2 text-sm font-semibold">Join</button>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-white/60 pb-8">© {new Date().getFullYear()} {settings?.clubName || "Club"}. All rights reserved.</div>
      </footer>
    </div>
  );
}
