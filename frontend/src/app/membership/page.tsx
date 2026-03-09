import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import MembershipCheckout from "@/components/MembershipCheckout";
import MembershipTiers from "@/components/MembershipTiers";

function Check() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white text-sm leading-none">
      ✓
    </span>
  );
}

export default async function MembershipPage() {
  const [home, plansRes] = await Promise.all([
    apiGet<any>("/public/home"),
    apiGet<any>("/membership/plans"),
  ]);

  const plans = plansRes?.items || [];

  const clubName = String(home.settings?.clubName || "CLUB");
  const first = clubName.split(" ")[0] || "CLUB";
  const rest = clubName.split(" ").slice(1).join(" ");

  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="container-ms py-12 md:py-16">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* LEFT CONTENT */}
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[0.95]">
              <span className="text-brand">{first}</span>{" "}
              <span className="text-ink">{rest}</span>
            </h1>

            <div className="mt-6 flex items-center gap-3">
              <div className="text-2xl md:text-3xl font-extrabold text-ink">
                Official Membership
              </div>
              <span className="rounded-full bg-brand text-white text-xs font-semibold px-3 py-1">
                25/26 SEASON
              </span>
            </div>

            <p className="mt-6 text-muted max-w-xl leading-relaxed">
              Join the pride and experience football like never before with exclusive member benefits including:
            </p>

            <div className="mt-7 grid gap-4 text-ink">
              <div className="flex items-start gap-3">
                <Check />
                <div className="pt-[2px]">Priority match ticket access</div>
              </div>
              <div className="flex items-start gap-3">
                <Check />
                <div className="pt-[2px]">Official merchandise discounts</div>
              </div>
              <div className="flex items-start gap-3">
                <Check />
                <div className="pt-[2px]">Members-only events with players</div>
              </div>
              <div className="flex items-start gap-3">
                <Check />
                <div className="pt-[2px]">Digital membership card</div>
              </div>
              <div className="flex items-start gap-3">
                <Check />
                <div className="pt-[2px]">Match day experiences</div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-5">
              <a
                href="#checkout"
                className="inline-flex items-center justify-center rounded-xl bg-ink text-white px-7 py-3 font-semibold hover:opacity-95 transition"
              >
                JOIN NOW →
              </a>

              <span className="text-muted">OR</span>

              <a
                href={home.settings?.ticketsUrl || "/tickets"}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-7 py-3 font-semibold text-ink hover:bg-black/5 transition"
              >
                BUY TICKETS? →
              </a>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[520px]">
              <div className="rounded-2xl border border-line bg-white/80 backdrop-blur shadow-[0_18px_40px_rgba(0,0,0,.10)] p-6">
                {home.settings?.homeMembershipImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={home.settings.homeMembershipImage.url}
                    alt="Membership"
                    className="w-full h-[340px] object-contain"
                  />
                ) : (
                  <div className="h-[340px] bg-black/5 rounded-xl" />
                )}
              </div>

              <div className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 w-[70%] h-8 blur-xl bg-black/20 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      

      {/* TIER CARDS */}
      <section className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#0a1628]">
            Choose Your Tier
          </h2>
          <p className="text-gray-500 mt-2">
            All memberships run for the full 2025/26 season
          </p>
        </div>

        <MembershipTiers plans={plans} />
      </section>

      {/* CHECKOUT */}
      <section id="checkout" className="bg-gray-50 px-4 py-16 sm:py-24">
        <MembershipCheckout plans={plans} />
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center mb-10 text-[#0a1628]">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {[
            {
              q: "Can I upgrade my membership later?",
              a: "Yes. You can move to a higher membership tier later through your account and payment flow.",
            },
            {
              q: "How do I get my digital membership card?",
              a: "Once your membership payment is confirmed, your dashboard will show your QR digital card automatically.",
            },
            {
              q: "What payment methods are accepted?",
              a: "Membership payments are processed through M-Pesa STK Push.",
            },
            {
              q: "When does my membership expire?",
              a: "Membership runs for the full active season based on the configured plan duration.",
            },
          ].map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-gray-200 bg-white"
            >
              <summary className="cursor-pointer px-6 py-4 font-semibold text-[#0a1628] flex items-center justify-between">
                {item.q}
                <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl">
                  +
                </span>
              </summary>
              <p className="px-6 pb-4 text-sm text-gray-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}