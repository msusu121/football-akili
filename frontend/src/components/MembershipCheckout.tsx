"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Plan = {
  id: string;
  tier: "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
  name: string;
  price: number;
  currency: string;
  benefits: string[];
};

type CheckoutStep = "select" | "pending" | "success" | "error";

export default function MembershipCheckout({ plans }: { plans: Plan[] }) {
  const router = useRouter();

  const [selectedTier, setSelectedTier] = useState<Plan["tier"] | null>(null);
  const [step, setStep] = useState<CheckoutStep>("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [customerMessage, setCustomerMessage] = useState<string | null>(null);
  const [memberData, setMemberData] = useState<any>(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    city: "",
    jerseySize: "",
    nextOfKin: "",
  });

  const selectedPlan = useMemo(
    () => plans.find((p) => p.tier === selectedTier) || null,
    [plans, selectedTier]
  );

  useEffect(() => {
    const saved = localStorage.getItem("membership_selected_tier");
    if (saved && plans.some((p) => p.tier === saved)) {
      setSelectedTier(saved as Plan["tier"]);
    }

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ tier: Plan["tier"] }>;
      if (custom.detail?.tier) {
        setSelectedTier(custom.detail.tier);
      }
    };

    window.addEventListener("membership-tier-selected", handler as EventListener);
    return () => {
      window.removeEventListener("membership-tier-selected", handler as EventListener);
    };
  }, [plans]);

  useEffect(() => {
    if (!checkoutRequestId || step !== "pending") return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${API}/payments/membership/tx/status/${checkoutRequestId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (cancelled) return;

        if (data.status === "SUCCESS") {
          const token = localStorage.getItem("token") || "";
          const memberRes = await fetch(`${API}/membership/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          });

          const memberJson = await memberRes.json();

          if (!cancelled) {
            setMemberData(memberJson.member);
            setStep("success");
            setLoading(false);
          }
          return;
        }

        if (data.status === "FAILED" || data.status === "CANCELLED") {
          if (!cancelled) {
            setError("M-Pesa payment failed or was cancelled.");
            setStep("error");
            setLoading(false);
          }
          return;
        }

        setTimeout(poll, 4000);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed while checking payment status.");
          setStep("error");
          setLoading(false);
        }
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [checkoutRequestId, step]);

  const getHeaders = (): HeadersInit | null => {
    const token = localStorage.getItem("token") || "";
    if (!token) return null;

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const handleCheckout = async () => {
    if (!selectedTier) return;

    const headers = getHeaders();
    if (!headers) {
      alert("Please log in first.");
      router.push("/login?next=/membership");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/payments/membership/checkout/stk`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          tier: selectedTier,
          fullName: form.fullName,
          phone: form.phone,
          email: form.email,
          city: form.city || null,
          jerseySize: form.jerseySize || null,
          nextOfKin: form.nextOfKin || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to initiate STK push");
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setCustomerMessage(data.customerMessage || "STK Push sent. Please complete payment on your phone.");
      setStep("pending");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStep("error");
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedTier(null);
    setStep("select");
    setLoading(false);
    setError(null);
    setCheckoutRequestId(null);
    setCustomerMessage(null);
    setMemberData(null);
    localStorage.removeItem("membership_selected_tier");
  };

  return (
    <div className="max-w-4xl mx-auto">
      {step === "select" && (
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          <div className="rounded-2xl border border-line bg-white p-6">
            <h3 className="text-2xl font-bold text-ink">Online Registration</h3>
            <p className="mt-2 text-sm text-muted">
              Select a tier, fill your details, then pay via M-Pesa STK Push.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedTier(plan.tier)}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedTier === plan.tier
                      ? "border-brand bg-brand/5"
                      : "border-line hover:border-brand/30"
                  }`}
                >
                  <div className="font-bold text-ink">{plan.name}</div>
                  <div className="text-sm text-muted mt-1">
                    {plan.currency} {plan.price.toLocaleString()}
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                className="rounded-xl border border-line px-4 py-3"
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
              <input
                className="rounded-xl border border-line px-4 py-3"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <input
                className="rounded-xl border border-line px-4 py-3"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <input
                className="rounded-xl border border-line px-4 py-3"
                placeholder="City"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
              <input
                className="rounded-xl border border-line px-4 py-3"
                placeholder="Jersey Size"
                value={form.jerseySize}
                onChange={(e) => setForm((f) => ({ ...f, jerseySize: e.target.value }))}
              />
              <input
                className="rounded-xl border border-line px-4 py-3"
                placeholder="Next of Kin (optional)"
                value={form.nextOfKin}
                onChange={(e) => setForm((f) => ({ ...f, nextOfKin: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-6">
            <h4 className="text-lg font-bold text-ink">Summary</h4>

            {selectedPlan ? (
              <>
                <div className="mt-4 text-sm text-muted">Tier</div>
                <div className="text-xl font-bold text-ink">{selectedPlan.name}</div>

                <div className="mt-4 text-sm text-muted">Price</div>
                <div className="text-2xl font-extrabold text-ink">
                  {selectedPlan.currency} {selectedPlan.price.toLocaleString()}
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="mt-8 w-full rounded-xl bg-[#0a1628] px-6 py-3 text-white font-semibold disabled:opacity-60"
                >
                  {loading ? "Sending STK Push..." : "Pay with M-Pesa"}
                </button>
              </>
            ) : (
              <div className="mt-4 text-sm text-muted">Select a tier to continue.</div>
            )}
          </div>
        </div>
      )}

      {step === "pending" && (
        <div className="max-w-2xl mx-auto text-center rounded-2xl border border-yellow-200 bg-yellow-50 p-8">
          <h3 className="text-2xl font-bold text-[#0a1628]">Complete Payment on Your Phone</h3>
          <p className="mt-3 text-gray-700">
            {customerMessage || "An M-Pesa prompt has been sent to your phone."}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Waiting for Safaricom confirmation...
          </p>
          {checkoutRequestId ? (
            <p className="mt-4 text-xs text-gray-500 font-mono break-all">
              CheckoutRequestID: {checkoutRequestId}
            </p>
          ) : null}
        </div>
      )}

      {step === "success" && (
        <div className="max-w-2xl mx-auto text-center rounded-2xl border border-green-200 bg-green-50 p-8">
          <h3 className="text-2xl font-bold text-green-800">Membership Activated</h3>
          <p className="mt-3 text-green-700">
            Member Number:{" "}
            <span className="font-mono font-bold">
              {memberData?.memberNumber || "Generated"}
            </span>
          </p>

          <div className="mt-6 flex justify-center gap-4">
            <a
              href="/account/membership"
              className="rounded-xl bg-[#0a1628] px-6 py-3 font-semibold text-white"
            >
              Open My Dashboard
            </a>
            <button
              onClick={handleReset}
              className="rounded-xl border border-line px-6 py-3 font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="max-w-2xl mx-auto text-center rounded-2xl border border-red-200 bg-red-50 p-8">
          <h3 className="text-2xl font-bold text-red-800">Payment Failed</h3>
          <p className="mt-3 text-red-600">{error}</p>
          <button
            onClick={handleReset}
            className="mt-6 rounded-xl bg-[#0a1628] px-6 py-3 font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}