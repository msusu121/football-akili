"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";

export default function MembershipCheckout() {
  const { user, token, refresh } = useAuth();
  const router = useRouter();
  const [months, setMonths] = useState(1);
  const [busy, setBusy] = useState(false);
  const [tx, setTx] = useState<{ transactionId: string; amount: number; currency: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isActive = useMemo(() => {
    if (!user) return false;
    if (user.membership !== "ACTIVE") return false;
    if (!user.membershipUntil) return true;
    return new Date(user.membershipUntil).getTime() > Date.now();
  }, [user]);

  const start = async () => {
    setError(null);
    if (!token) return router.push(`/login?next=${encodeURIComponent("/membership")}`);
    setBusy(true);
    try {
      const data = await apiJson<any>("/payments/membership/checkout", { method: "POST", token, body: { months } });
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
      setTx(null);
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-line bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold">2025/26 MEMBERSHIP</div>
          <div className="mt-2 text-sm text-muted">Unlock members-only shop access and priority ticket windows.</div>
        </div>
        {isActive ? (
          <div className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-200">
            ACTIVE
          </div>
        ) : (
          <div className="rounded-full border border-line bg-black/20 px-3 py-1 text-xs text-muted">Not active</div>
        )}
      </div>

      {user?.membershipUntil ? (
        <div className="mt-3 text-xs text-muted">Valid until: {new Date(user.membershipUntil).toDateString()}</div>
      ) : null}

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setMonths(1)}
          className={`rounded-2xl border p-4 text-left ${months === 1 ? "border-brand/60 bg-white/5" : "border-line bg-black/20 hover:bg-white/5"}`}
        >
          <div className="text-sm font-semibold">1 Month</div>
          <div className="mt-1 text-xs text-muted">Quick entry</div>
        </button>
        <button
          type="button"
          onClick={() => setMonths(6)}
          className={`rounded-2xl border p-4 text-left ${months === 6 ? "border-brand/60 bg-white/5" : "border-line bg-black/20 hover:bg-white/5"}`}
        >
          <div className="text-sm font-semibold">6 Months</div>
          <div className="mt-1 text-xs text-muted">Best value</div>
        </button>
        <button
          type="button"
          onClick={() => setMonths(12)}
          className={`rounded-2xl border p-4 text-left ${months === 12 ? "border-brand/60 bg-white/5" : "border-line bg-black/20 hover:bg-white/5"}`}
        >
          <div className="text-sm font-semibold">12 Months</div>
          <div className="mt-1 text-xs text-muted">Season pass</div>
        </button>
      </div>

      {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!tx ? (
          <button disabled={busy} onClick={start} className="px-5 py-3 rounded-full bg-brand text-black font-semibold disabled:opacity-60">
            {busy ? "Starting…" : "Proceed to payment"}
          </button>
        ) : (
          <>
            <div className="text-sm text-muted">Pending payment: <span className="text-white font-semibold">{tx.amount} {tx.currency}</span></div>
            <button disabled={busy} onClick={confirm} className="px-5 py-3 rounded-full bg-brand text-black font-semibold disabled:opacity-60">
              {busy ? "Confirming…" : "DEV: Confirm payment"}
            </button>
          </>
        )}
        <div className="text-xs text-muted">(Payment integration hook is ready; replace mock confirm with M-Pesa webhook.)</div>
      </div>
    </div>
  );
}
