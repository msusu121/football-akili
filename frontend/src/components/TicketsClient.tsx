"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiJson } from "@/lib/apiClient";
import { useAuth } from "@/lib/auth";

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
    <div className="mx-auto max-w-3xl text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-ink">Featured Events</h1>

      {loading ? <div className="mt-6 text-sm text-muted">Loading events…</div> : null}
      {error ? <div className="mt-6 text-sm text-red-600">{error}</div> : null}

      {!loading && !items.length ? (
        <>
          <div className="mt-4 text-base text-muted">No matches scheduled yet</div>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/tickets"
              className="px-8 py-3 rounded-xl border border-line bg-white hover:bg-black/5 transition text-ink font-semibold"
            >
              Check All Events
            </Link>
            {token ? (
              <Link href="/account#tickets" className="text-sm text-muted hover:text-ink">My tickets →</Link>
            ) : (
              <Link href="/login?next=/tickets" className="text-sm text-muted hover:text-ink">Log in →</Link>
            )}
          </div>
        </>
      ) : null}

      {!!items.length ? (
        <div className="mt-10 grid gap-4 text-left md:grid-cols-2">
          {items.map((e) => (
            <Link
              key={e.id}
              href={`/tickets/${e.id}`}
              className="rounded-2xl border border-line bg-white hover:bg-black/5 transition p-5"
            >
              <div className="text-xs text-muted">{new Date(e.match?.kickoffAt || e.salesOpenAt).toDateString()}</div>
              <div className="mt-1 font-semibold line-clamp-1 text-ink">
                {e.match?.isHome ? "HOME" : "AWAY"} vs {e.match?.opponent || "TBA"}
              </div>
              <div className="mt-1 text-sm text-muted line-clamp-1">{e.match?.venue || "Venue TBA"}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(e.tiers || []).slice(0, 3).map((t: any) => (
                  <span key={t.id} className="text-xs rounded-full border border-line bg-black/5 px-3 py-1 text-ink">
                    {t.name}: {t.price} {e.currency}
                  </span>
                ))}
              </div>
              <div className="mt-4 text-sm text-brand font-semibold">Buy tickets →</div>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
