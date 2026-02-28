"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";

export default function AccountClient() {
  const { token, user, refresh, logout } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const membershipActive = useMemo(() => {
    if (!user) return false;
    if (user.membership !== "ACTIVE") return false;
    if (!user.membershipUntil) return true;
    return new Date(user.membershipUntil).getTime() > Date.now();
  }, [user]);

  useEffect(() => {
    if (!token) return;
    refresh().catch(() => undefined);
    apiJson<{ items: any[] }>("/tickets/me", { token })
      .then((d) => setTickets(d.items || []))
      .catch((e: any) => setError(e?.message || "Failed"));

    if (membershipActive) {
      apiJson<{ items: any[] }>("/shop/orders/me", { token })
        .then((d) => setOrders(d.items || []))
        .catch(() => undefined);
    }
  }, [token, membershipActive]);

  if (!token) {
    return (
      <div className="rounded-3xl border border-line bg-card p-6">
        <h1 className="text-2xl font-bold">Account</h1>
        <div className="mt-2 text-sm text-muted">Sign in to view your membership, tickets, and orders.</div>
        <div className="mt-4">
          <Link href="/login?next=/account" className="px-5 py-3 rounded-full bg-brand text-black font-semibold">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Account</h1>
          <div className="mt-2 text-sm text-muted">{user?.email}</div>
        </div>
        <button onClick={logout} className="px-4 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Logout</button>
      </div>

      {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="text-sm font-semibold">Membership</div>
          <div className="mt-2 text-sm text-muted">Status: <span className="text-white font-semibold">{membershipActive ? "ACTIVE" : "NOT ACTIVE"}</span></div>
          {user?.membershipUntil ? (
            <div className="mt-1 text-sm text-muted">Valid until: {new Date(user.membershipUntil).toDateString()}</div>
          ) : null}
          <div className="mt-4">
            <Link href="/membership" className="px-4 py-2 rounded-full bg-brand text-black font-semibold">Manage</Link>
          </div>
        </div>

        <div id="tickets" className="rounded-3xl border border-line bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">My Tickets</div>
            <Link href="/tickets" className="text-sm text-muted hover:text-white">Buy tickets</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">{t.event?.match?.isHome ? "HOME" : "AWAY"} vs {t.event?.match?.opponent}</div>
                    <div className="mt-1 text-xs text-muted">{new Date(t.event?.match?.kickoffAt).toDateString()} • {t.tier?.name} • Qty {t.quantity}</div>
                    <div className="mt-2 text-xs text-muted">Code: <span className="text-white">{t.code}</span> • Status: <span className="text-white">{t.status}</span></div>
                  </div>
                  {t.qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.qrDataUrl} alt="QR" className="h-24 w-24 rounded-xl border border-line bg-white" />
                  ) : (
                    <div className="text-xs text-muted">QR appears after payment.</div>
                  )}
                </div>
              </div>
            ))}
            {!tickets.length ? <div className="text-sm text-muted">No tickets yet.</div> : null}
          </div>
        </div>
      </div>

      <div id="orders" className="mt-6 rounded-3xl border border-line bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Shop Orders</div>
          <Link href="/shop" className="text-sm text-muted hover:text-white">Shop</Link>
        </div>
        {!membershipActive ? (
          <div className="mt-3 text-sm text-muted">Activate membership to access shop orders.</div>
        ) : (
          <div className="mt-4 grid gap-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Order #{o.id.slice(-6)}</div>
                  <div className="text-xs text-muted">{new Date(o.createdAt).toDateString()} • {o.status}</div>
                </div>
                <div className="mt-2 text-sm text-muted">Total: <span className="text-white font-semibold">{o.total} {o.currency}</span></div>
                <div className="mt-3 text-xs text-muted">Items: {(o.items || []).length}</div>
              </div>
            ))}
            {!orders.length ? <div className="text-sm text-muted">No orders yet.</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
