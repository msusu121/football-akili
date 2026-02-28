"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

export default function TicketEventClient({ id }: { id: string }) {
  const { token, refresh } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tierId, setTierId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<{ transactionId: string; amount: number; currency: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    apiJson<{ event: any }>(`/tickets/events/${id}`)
      .then((d) => {
        setEvent(d.event);
        setTierId(d.event?.tiers?.[0]?.id || "");
      })
      .catch((e: any) => setError(e?.message || "Failed"))
      .finally(() => setLoading(false));
  }, [id]);

  const tier = useMemo(() => (event?.tiers || []).find((t: any) => t.id === tierId), [event, tierId]);
  const total = useMemo(() => (tier ? tier.price * qty : 0), [tier, qty]);

  const start = async () => {
    setError(null);
    if (!token) return router.push(`/login?next=${encodeURIComponent(`/tickets/${id}`)}`);
    if (!tierId) return;
    setBusy(true);
    try {
      const data = await apiJson<any>("/payments/tickets/checkout", { method: "POST", token, body: { eventId: id, tierId, qty } });
      setTx({ transactionId: data.transactionId, amount: data.amount, currency: data.currency });
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!token || !tx) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson<any>("/payments/mock/confirm", { method: "POST", token, body: { transactionId: tx.transactionId } });
      await refresh();
      router.push("/account#tickets");
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="text-sm text-muted">Loading event…</div>;
  if (error) return <div className="text-sm text-red-300">{error}</div>;
  if (!event) return <div className="text-sm text-muted">Not found.</div>;

  return (
    <div>
      <Link href="/tickets" className="text-sm text-muted hover:text-white">← Back to tickets</Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="text-xs tracking-widest text-muted">TICKET EVENT</div>
          <h1 className="mt-2 text-3xl font-bold">{event.match?.isHome ? "HOME" : "AWAY"} vs {event.match?.opponent}</h1>
          <div className="mt-2 text-sm text-muted">{new Date(event.match?.kickoffAt).toDateString()} • {event.match?.venue || "Venue TBA"}</div>
          <div className="mt-4 text-sm text-muted">Sales close: {new Date(event.salesCloseAt).toDateString()}</div>

          <div className="mt-6 grid gap-3">
            <div className="text-sm font-semibold">Select tier</div>
            <div className="grid gap-2">
              {(event.tiers || []).map((t: any) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierId(t.id)}
                  className={`rounded-2xl border p-4 text-left ${tierId === t.id ? "border-brand/60 bg-white/5" : "border-line bg-black/20 hover:bg-white/5"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-sm">{t.price} {event.currency}</div>
                  </div>
                  <div className="mt-1 text-xs text-muted">Capacity: {t.capacity} • Sold: {t.sold}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-line bg-card p-6 h-fit sticky top-28">
          <div className="text-sm font-semibold">Checkout</div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-muted">Quantity</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-8 w-8 rounded-full border border-line bg-white/5 hover:bg-white/10">-</button>
              <div className="w-8 text-center">{qty}</div>
              <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="h-8 w-8 rounded-full border border-line bg-white/5 hover:bg-white/10">+</button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-muted">Tier</div>
            <div className="font-semibold">{tier?.name || "—"}</div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-muted">Total</div>
            <div className="font-semibold">{total} {event.currency}</div>
          </div>

          {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}

          <div className="mt-5 grid gap-2">
            {!tx ? (
              <button disabled={busy} onClick={start} className="w-full rounded-full bg-brand text-black font-semibold py-3 disabled:opacity-60">
                {busy ? "Starting…" : "Proceed to payment"}
              </button>
            ) : (
              <button disabled={busy} onClick={confirm} className="w-full rounded-full bg-brand text-black font-semibold py-3 disabled:opacity-60">
                {busy ? "Confirming…" : `DEV: Confirm payment (${tx.amount} ${tx.currency})`}
              </button>
            )}
            <div className="text-xs text-muted">Replace mock confirm with real payment callback (M-Pesa/Card).</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
