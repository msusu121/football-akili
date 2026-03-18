"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

export default function TicketsClient() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    apiJson<{ items: any[] }>("/tickets/events/featured")
      .then((d) => setItems(d.items || []))
      .catch((e: any) => setError(e?.message || "Failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-ink">
          Featured Events
        </h1>
        <p className="mt-3 text-base text-muted">
          Get your tickets for upcoming Mombasa United matches.
        </p>
      </div>

      {loading ? <div className="mt-6 text-sm text-muted text-center">Loading events…</div> : null}
      {error ? <div className="mt-6 text-sm text-red-600 text-center">{error}</div> : null}

      {!loading && !items.length ? (
        <div className="mt-12 text-center">
          <div className="text-base text-muted">No featured ticket events yet.</div>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/tickets"
              className="px-8 py-3 rounded-xl border border-line bg-white hover:bg-black/5 transition text-ink font-semibold"
            >
              Refresh Tickets
            </Link>
            {token ? (
              <Link href="/account#tickets" className="text-sm text-muted hover:text-ink">
                My tickets →
              </Link>
            ) : (
              <Link href="/login?next=/tickets" className="text-sm text-muted hover:text-ink">
                Log in →
              </Link>
            )}
          </div>
        </div>
      ) : null}

      {!!items.length ? (
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((e) => (
            <Link
              key={e.id}
              href={e.ticketUrl || `/tickets/${e.id}`}
              className="rounded-2xl border border-line bg-white hover:bg-black/5 transition p-5"
            >
              <div className="text-xs text-muted">
                {new Date(e.match?.kickoffAt || e.salesOpenAt).toDateString()}
              </div>

              <div className="mt-3 flex items-center gap-3">
                {e.match?.opponentLogoUrl ? (
                  <Image
  src={e.match.opponentLogoUrl}
  width={48}
  height={48}
  alt={e.match?.opponent || "Opponent"}
  className="rounded-full object-contain bg-black/5 p-1"
/>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-black/5" />
                )}

                <div className="min-w-0">
                  <div className="font-semibold line-clamp-1 text-ink">
                    {e.match?.isHome ? "HOME" : "AWAY"} vs {e.match?.opponent || "TBA"}
                  </div>
                  <div className="mt-1 text-sm text-muted line-clamp-1">
                    {e.match?.venue || "Venue TBA"}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(e.tiers || []).slice(0, 3).map((t: any) => (
                  <span
                    key={t.id}
                    className="text-xs rounded-full border border-line bg-black/5 px-3 py-1 text-ink"
                  >
                    {t.name}: {t.price} {e.currency}
                  </span>
                ))}
              </div>

              <div className="mt-5 text-sm text-brand font-semibold">Buy tickets →</div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}