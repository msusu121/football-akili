"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson } from "@/lib/apiClient";
import MembershipCard from "@/components/MembershipCard";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AccountClient() {
  const { token, user, refresh, logout } = useAuth();

  const [tickets, setTickets] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [membershipData, setMembershipData] = useState<any>(null);

  const [loadingMembership, setLoadingMembership] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const membershipActive = useMemo(() => {
    const source = membershipData || user;
    if (!source) return false;
    if (source.membership !== "ACTIVE") return false;
    if (!source.membershipUntil) return true;
    return new Date(source.membershipUntil).getTime() > Date.now();
  }, [membershipData, user]);

  const fetchMembership = async (authToken: string) => {
    setLoadingMembership(true);
    try {
      const res = await fetch(`${API}/membership/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || "Failed to load membership");
      }

      setMembershipData(json.member || null);
      return json.member || null;
    } finally {
      setLoadingMembership(false);
    }
  };

  const fetchAccountData = async () => {
    if (!token) return;

    setError(null);

    try {
      await refresh().catch(() => undefined);

      const [ticketsRes, membership] = await Promise.all([
        apiJson<{ items: any[] }>("/tickets/me", { token }),
        fetchMembership(token).catch(() => null),
      ]);

      setTickets(ticketsRes.items || []);

      const source = membership || user;
      const isActive =
        !!source &&
        source.membership === "ACTIVE" &&
        (!source.membershipUntil ||
          new Date(source.membershipUntil).getTime() > Date.now());

      if (isActive) {
        const ordersRes = await apiJson<{ items: any[] }>("/shop/orders/me", { token });
        setOrders(ordersRes.items || []);
      } else {
        setOrders([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed");
    }
  };

  const redeem = async (rewardId: string) => {
    if (!token) return;

    setRedeemingId(rewardId);
    try {
      const res = await fetch(`${API}/membership/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rewardId }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.error || "Redeem failed");
      }

      await fetchMembership(token);
      alert(json?.message || "Reward redeemed");
    } catch (e: any) {
      alert(e?.message || "Redeem failed");
    } finally {
      setRedeemingId(null);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchAccountData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <div className="rounded-3xl border border-line bg-card p-6">
        <h1 className="text-2xl font-bold">Account</h1>
        <div className="mt-2 text-sm text-muted">
          Sign in to view your membership, tickets, and orders.
        </div>
        <div className="mt-4">
          <Link
            href="/login?next=/account"
            className="rounded-full bg-brand px-5 py-3 font-semibold text-black"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const tier = String(
    membershipData?.membershipTier || user?.membership || "SILVER"
  ).toLowerCase();

  const qrUrl =
    membershipData?.profile?.qrToken
      ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
          `https://mombasaunited.com/member/${membershipData.profile.qrToken}`
        )}`
      : undefined;

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Account</h1>
          <div className="mt-2 text-sm text-muted">{user?.email}</div>
        </div>
        <button
          onClick={logout}
          className="rounded-full border border-line bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          Logout
        </button>
      </div>

      {error ? <div className="mt-4 text-sm text-red-300">{error}</div> : null}

      <div className="mt-8 rounded-3xl border border-line bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Membership Dashboard</div>
            <div className="mt-1 text-sm text-muted">
              Status:{" "}
              <span className="font-semibold text-white">
                {membershipActive ? "ACTIVE" : "NOT ACTIVE"}
              </span>
            </div>
            {(membershipData?.membershipUntil || user?.membershipUntil) ? (
              <div className="mt-1 text-sm text-muted">
                Valid until:{" "}
                {new Date(
                  membershipData?.membershipUntil || user?.membershipUntil
                ).toDateString()}
              </div>
            ) : null}
          </div>

          {!membershipActive ? (
            <Link
              href="/membership"
              className="rounded-full bg-brand px-4 py-2 font-semibold text-black"
            >
              Activate Membership
            </Link>
          ) : null}
        </div>

        {loadingMembership ? (
          <div className="mt-6 text-sm text-muted">Loading membership dashboard...</div>
        ) : membershipActive && membershipData ? (
          <div className="mt-8 grid gap-8 lg:grid-cols-[420px_1fr]">
            <MembershipCard
              tier={tier as any}
              memberName={membershipData.name || user?.name || "Member"}
              memberNumber={membershipData.memberNumber || "PENDING"}
              since={
                membershipData.memberSince
                  ? new Date(membershipData.memberSince).toLocaleDateString()
                  : "-"
              }
              expires={
                membershipData.membershipUntil
                  ? new Date(membershipData.membershipUntil).toLocaleDateString()
                  : "-"
              }
              qrUrl={qrUrl}
            />

            <div className="grid gap-6">
              <div className="rounded-2xl border border-line bg-white p-6">
                <div className="text-sm text-muted">Points</div>
                <div className="mt-2 text-4xl font-extrabold text-ink">
                  {membershipData.wallet?.balancePoints ?? 0}
                </div>
                <div className="mt-2 text-sm text-muted">
                  Lifetime Earned: {membershipData.wallet?.lifetimeEarned ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <h2 className="text-xl font-bold text-ink">Redeem Points</h2>
                <div className="mt-4 grid gap-3">
                  {(membershipData.rewards || []).map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-xl border border-line p-4"
                    >
                      <div>
                        <div className="font-semibold text-ink">{r.title}</div>
                        <div className="text-sm text-muted">{r.pointsCost} pts</div>
                      </div>
                      <button
                        onClick={() => redeem(r.id)}
                        disabled={redeemingId === r.id}
                        className="rounded-xl bg-[#0a1628] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {redeemingId === r.id ? "Redeeming..." : "Redeem"}
                      </button>
                    </div>
                  ))}
                  {!membershipData.rewards?.length ? (
                    <div className="text-sm text-muted">No rewards available yet.</div>
                  ) : null}
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <h2 className="text-xl font-bold text-ink">Recent Activity</h2>
                <div className="mt-4 grid gap-3">
                  {(membershipData.entries || []).map((e: any) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-xl border border-line p-4"
                    >
                      <div>
                        <div className="font-semibold text-ink">
                          {e.description || e.type}
                        </div>
                        <div className="text-sm text-muted">
                          {new Date(e.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={`font-bold ${
                          e.points >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {e.points >= 0 ? "+" : ""}
                        {e.points}
                      </div>
                    </div>
                  ))}
                  {!membershipData.entries?.length ? (
                    <div className="text-sm text-muted">No recent activity yet.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-line bg-black/20 p-6">
            <div className="text-lg font-semibold">Your membership is not active yet.</div>
            <div className="mt-2 text-sm text-muted">
              Activate membership to unlock your digital card, points, rewards, and member-only access.
            </div>
            <div className="mt-4">
              <Link
                href="/membership"
                className="rounded-full bg-brand px-5 py-3 font-semibold text-black"
              >
                Activate Now
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div id="tickets" className="rounded-3xl border border-line bg-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">My Tickets</div>
            <Link href="/tickets" className="text-sm text-muted hover:text-white">
              Buy tickets
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold">
                      {t.event?.match?.isHome ? "HOME" : "AWAY"} vs {t.event?.match?.opponent}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {new Date(t.event?.match?.kickoffAt).toDateString()} • {t.tier?.name} • Qty{" "}
                      {t.quantity}
                    </div>
                    <div className="mt-2 text-xs text-muted">
                      Code: <span className="text-white">{t.code}</span> • Status:{" "}
                      <span className="text-white">{t.status}</span>
                    </div>
                  </div>
                  {t.qrDataUrl ? (
                    <Image
                      src={t.qrDataUrl}
                      fill
                      alt="QR"
                      className="h-24 w-24 rounded-xl border border-line bg-white"
                    />
                  ) : (
                    <div className="text-xs text-muted">QR appears after payment.</div>
                  )}
                </div>
              </div>
            ))}
            {!tickets.length ? <div className="text-sm text-muted">No tickets yet.</div> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-card p-6">
          <div className="text-sm font-semibold">Membership</div>
          <div className="mt-2 text-sm text-muted">
            Status:{" "}
            <span className="font-semibold text-white">
              {membershipActive ? "ACTIVE" : "NOT ACTIVE"}
            </span>
          </div>
          {(membershipData?.membershipUntil || user?.membershipUntil) ? (
            <div className="mt-1 text-sm text-muted">
              Valid until:{" "}
              {new Date(
                membershipData?.membershipUntil || user?.membershipUntil
              ).toDateString()}
            </div>
          ) : null}
          <div className="mt-4">
            <a
              href="#membership-dashboard"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#membership-dashboard")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded-full bg-brand px-4 py-2 font-semibold text-black"
            >
              Open Dashboard
            </a>
          </div>
        </div>
      </div>

      <div id="orders" className="mt-6 rounded-3xl border border-line bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Shop Orders</div>
          <Link href="/shop" className="text-sm text-muted hover:text-white">
            Shop
          </Link>
        </div>
        {!membershipActive ? (
          <div className="mt-3 text-sm text-muted">
            Activate membership to access shop orders.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {orders.map((o) => (
              <div key={o.id} className="rounded-2xl border border-line bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Order #{o.id.slice(-6)}</div>
                  <div className="text-xs text-muted">
                    {new Date(o.createdAt).toDateString()} • {o.status}
                  </div>
                </div>
                <div className="mt-2 text-sm text-muted">
                  Total: <span className="font-semibold text-white">{o.total} {o.currency}</span>
                </div>
                <div className="mt-3 text-xs text-muted">
                  Items: {(o.items || []).length}
                </div>
              </div>
            ))}
            {!orders.length ? <div className="text-sm text-muted">No orders yet.</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
