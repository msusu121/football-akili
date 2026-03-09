"use client";

import { useEffect, useState } from "react";
import MembershipCard from "@/components/MembershipCard";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function MemberDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API}/membership/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const json = await res.json();
    setData(json.member);
    setLoading(false);
  };

  const redeem = async (rewardId: string) => {
    const token = localStorage.getItem("token") || "";
    const res = await fetch(`${API}/membership/redeem`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rewardId }),
    });

    const json = await res.json();
    if (!res.ok) return alert(json.error || "Redeem failed");

    alert(json.message || "Reward redeemed");
    fetchMe();
  };

  useEffect(() => {
    fetchMe();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">No membership data found.</div>;

  const tier = String(data.membershipTier || "SILVER").toLowerCase();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 grid gap-10">
      <div>
        <h1 className="text-3xl font-bold text-ink">Welcome {data.name}</h1>
        <p className="text-muted mt-2">
          Membership: {data.membershipTier} • Status: {data.membership}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <MembershipCard
          tier={tier as any}
          memberName={data.name || "Member"}
          memberNumber={data.memberNumber || "PENDING"}
          since={data.memberSince ? new Date(data.memberSince).toLocaleDateString() : "-"}
          expires={data.membershipUntil ? new Date(data.membershipUntil).toLocaleDateString() : "-"}
          qrUrl={
            data.profile?.qrToken
              ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                  `https://mombasaunited.com/member/${data.profile.qrToken}`
                )}`
              : undefined
          }
        />

        <div className="grid gap-6">
          <div className="rounded-2xl border border-line bg-white p-6">
            <div className="text-sm text-muted">Points</div>
            <div className="mt-2 text-4xl font-extrabold text-ink">
              {data.wallet?.balancePoints ?? 0}
            </div>
            <div className="mt-2 text-sm text-muted">
              Lifetime Earned: {data.wallet?.lifetimeEarned ?? 0}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xl font-bold text-ink">Redeem Points</h2>
            <div className="mt-4 grid gap-3">
              {(data.rewards || []).map((r: any) => (
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
                    className="rounded-xl bg-[#0a1628] px-4 py-2 text-white text-sm font-semibold"
                  >
                    Redeem
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xl font-bold text-ink">Recent Activity</h2>
            <div className="mt-4 grid gap-3">
              {(data.entries || []).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-line p-4">
                  <div>
                    <div className="font-semibold text-ink">{e.description || e.type}</div>
                    <div className="text-sm text-muted">{new Date(e.createdAt).toLocaleString()}</div>
                  </div>
                  <div className={`font-bold ${e.points >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {e.points >= 0 ? "+" : ""}
                    {e.points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}