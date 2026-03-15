"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";
import { useRouter } from "next/navigation";

type TicketTxState = {
  ticketId: string;
  orderId: string;
  transactionId: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  amount: number;
  currency: string;
  customerMessage?: string | null;
};

function fmtDateTime(value?: string | null) {
  if (!value) return "Date TBA";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Date TBA";
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketEventClient({ id }: { id: string }) {
  const { token, refresh } = useAuth();
  const router = useRouter();

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tierId, setTierId] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [phone, setPhone] = useState("");

  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<TicketTxState | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    apiJson<{ event: any }>(`/tickets/events/${id}`)
      .then((d) => {
        setEvent(d.event);
        setTierId(d.event?.tiers?.[0]?.id || "");
      })
      .catch((e: any) => setError(e?.message || "Failed to load ticket event"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const tier = useMemo(
    () => (event?.tiers || []).find((t: any) => t.id === tierId),
    [event, tierId]
  );

  const total = useMemo(() => {
    if (!tier) return 0;
    return Number(tier.price || 0) * qty;
  }, [tier, qty]);

  const kickoffAt =
    event?.match?.kickoffAt ||
    event?.match?.kickoff ||
    event?.match?.date ||
    event?.match?.scheduledAt ||
    null;

  const homeName =
    event?.match?.homeTeamName ||
    (event?.match?.isHome ? "Mombasa United" : event?.match?.opponent) ||
    "Home";

  const awayName =
    event?.match?.awayTeamName ||
    (event?.match?.isHome ? event?.match?.opponent : "Mombasa United") ||
    "Away";

  function stopPolling() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    setPolling(false);
  }

  async function handlePaidRedirect() {
    stopPolling();
    try {
      await refresh();
    } catch {
      // ignore
    }
    router.push("/account#tickets");
  }

  async function checkTicketStatus(checkoutRequestId: string) {
    try {
      const data = await apiJson<{
        status: string;
        orderId?: string | null;
        ticketId?: string | null;
      }>(`/payments/tickets/tx/status/${encodeURIComponent(checkoutRequestId)}`);

      const status = String(data?.status || "").toUpperCase();
      setTxStatus(status);

      if (status === "SUCCESS") {
        await handlePaidRedirect();
        return;
      }

      if (status === "FAILED" || status === "CANCELLED") {
        stopPolling();
        setError("Payment failed or was cancelled. Please try again.");
      }
    } catch (e: any) {
      console.error("Ticket payment status check failed:", e?.message || e);
    }
  }

  function startPolling(checkoutRequestId: string) {
    stopPolling();
    setPolling(true);
    setTxStatus("PENDING");

    checkTicketStatus(checkoutRequestId);

    pollIntervalRef.current = setInterval(() => {
      checkTicketStatus(checkoutRequestId);
    }, 3000);

    pollTimeoutRef.current = setTimeout(() => {
      stopPolling();
    }, 2 * 60 * 1000);
  }

  async function startCheckout() {
    setError(null);

    if (!token) {
      router.push(`/login?next=${encodeURIComponent(`/tickets/${id}`)}`);
      return;
    }

    if (!tierId) {
      setError("Please select a ticket tier.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter the M-Pesa phone number.");
      return;
    }

    setBusy(true);
    try {
      const data = await apiJson<any>("/payments/tickets/checkout/stk", {
        method: "POST",
        token,
        body: {
          eventId: id,
          tierId,
          qty,
          phone,
        },
      });

      const nextTx: TicketTxState = {
        ticketId: data.ticketId,
        orderId: data.orderId,
        transactionId: data.transactionId,
        checkoutRequestId: data.checkoutRequestId,
        merchantRequestId: data.merchantRequestId,
        amount: data.amount,
        currency: data.currency,
        customerMessage: data.customerMessage ?? null,
      };

      setTx(nextTx);
      startPolling(nextTx.checkoutRequestId);
    } catch (e: any) {
      setError(e?.message || "Failed to start ticket payment");
    } finally {
      setBusy(false);
    }
  }

  async function manualCheckStatus() {
    if (!tx?.checkoutRequestId) return;
    setError(null);
    await checkTicketStatus(tx.checkoutRequestId);
  }

  function resetPaymentState() {
    stopPolling();
    setTx(null);
    setTxStatus(null);
    setError(null);
  }

  if (loading) {
    return <div className="text-sm text-muted">Loading event…</div>;
  }

  if (error && !event) {
    return <div className="text-sm text-red-600">{error}</div>;
  }

  if (!event) {
    return <div className="text-sm text-muted">Not found.</div>;
  }

  return (
    <div>
      <Link href="/tickets" className="text-sm text-muted hover:text-ink">
        ← Back to tickets
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="text-xs tracking-widest text-muted">TICKET EVENT</div>

          <h1 className="mt-2 text-3xl font-bold text-ink">
            {homeName} vs {awayName}
          </h1>

          <div className="mt-2 text-sm text-muted">
            {fmtDateTime(kickoffAt)} • {event.match?.venue || "Venue TBA"}
          </div>

          <div className="mt-4 text-sm text-muted">
            Sales close: {fmtDateTime(event.salesCloseAt)}
          </div>

          <div className="mt-6 grid gap-3">
            <div className="text-sm font-semibold text-ink">Select tier</div>

            <div className="grid gap-2">
              {(event.tiers || []).map((t: any) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierId(t.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    tierId === t.id
                      ? "border-brand/60 bg-black/5"
                      : "border-line bg-white hover:bg-black/5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-semibold text-ink">{t.name}</div>
                    <div className="text-sm text-ink">
                      {t.price} {event.currency}
                    </div>
                  </div>

                  <div className="mt-1 text-xs text-muted">
                    Capacity: {t.capacity} • Sold: {t.sold}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-3xl border border-line bg-card p-6 h-fit sticky top-28">
          <div className="text-sm font-semibold text-ink">Checkout</div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-muted">Quantity</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-8 w-8 rounded-full border border-line bg-white hover:bg-black/5"
              >
                -
              </button>
              <div className="w-8 text-center text-ink">{qty}</div>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(20, q + 1))}
                className="h-8 w-8 rounded-full border border-line bg-white hover:bg-black/5"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-muted">Tier</div>
            <div className="font-semibold text-ink">{tier?.name || "—"}</div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="text-muted">Total</div>
            <div className="font-semibold text-ink">
              {total} {event.currency}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm text-muted">
              M-Pesa phone number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XXXXXXXX or 2547XXXXXXXX"
              className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand/60"
            />
          </div>

          {tx ? (
            <div className="mt-4 rounded-2xl border border-line bg-black/[0.03] p-4">
              <div className="text-xs uppercase tracking-wider text-muted">
                STK push sent
              </div>

              <div className="mt-2 text-sm text-ink">
                {tx.customerMessage || "Check your phone and complete the M-Pesa prompt."}
              </div>

              <div className="mt-3 text-xs text-muted break-all">
                Checkout ID: {tx.checkoutRequestId}
              </div>

              <div className="mt-1 text-xs text-muted">
                Status: {txStatus || "PENDING"}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 text-sm text-red-600">{error}</div>
          ) : null}

          <div className="mt-5 grid gap-2">
            {!tx ? (
              <button
                type="button"
                disabled={busy}
                onClick={startCheckout}
                className="w-full rounded-full bg-brand text-black font-semibold py-3 disabled:opacity-60"
              >
                {busy ? "Starting…" : "Proceed to M-Pesa"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy || polling}
                  onClick={manualCheckStatus}
                  className="w-full rounded-full bg-brand text-black font-semibold py-3 disabled:opacity-60"
                >
                  {polling ? "Waiting for payment…" : "Check payment status"}
                </button>

                <button
                  type="button"
                  onClick={resetPaymentState}
                  className="w-full rounded-full border border-line bg-white font-semibold py-3 hover:bg-black/5"
                >
                  Start again
                </button>
              </>
            )}

            <div className="text-xs text-muted">
              Success redirects to your account tickets section.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}