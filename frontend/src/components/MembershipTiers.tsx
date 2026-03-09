"use client";

type Plan = {
  id: string;
  tier: string;
  name: string;
  price: number;
  currency: string;
  benefits: string[];
};

const colors: Record<string, string> = {
  SILVER: "#94a3b8",
  GOLD: "#d4a017",
  PLATINUM: "#64748b",
  DIAMOND: "#1e293b",
};

export default function MembershipTiers({ plans }: { plans: Plan[] }) {
  const selectTier = (tier: string) => {
    localStorage.setItem("membership_selected_tier", tier);
    window.dispatchEvent(new CustomEvent("membership-tier-selected", { detail: { tier } }));
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {plans.map((plan) => {
        const color = colors[plan.tier] || "#0a1628";

        return (
          <div
            key={plan.id}
            className="relative flex flex-col rounded-2xl border border-line bg-white p-6 transition-all hover:shadow-lg"
          >
            <div className="h-2 w-16 rounded-full mb-5" style={{ backgroundColor: color }} />

            <h3 className="text-2xl font-bold text-ink">{plan.name}</h3>

            <div className="mt-3">
              <span className="text-3xl font-extrabold text-ink">
                {plan.currency} {plan.price.toLocaleString()}
              </span>
              <span className="text-sm text-muted ml-2">per season</span>
            </div>

            <ul className="mt-6 flex-1 space-y-3">
              {(plan.benefits || []).map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-ink">
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white text-[10px]"
                    style={{ backgroundColor: color }}
                  >
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <button
              onClick={() => selectTier(plan.tier)}
              className="mt-6 w-full rounded-xl py-3 font-semibold text-sm tracking-wide text-center bg-brand/10 text-brand hover:bg-brand hover:text-white transition-colors"
            >
              JOIN
            </button>
          </div>
        );
      })}
    </div>
  );
}