import Image from "next/image";
import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import MembershipCheckout from "@/components/MembershipCheckout";
import MembershipTiers from "@/components/MembershipTiers";

const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function resolveAssetUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (ASSET_BASE) {
    return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
  return url;
}

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
  const membershipImage = resolveAssetUrl(home.settings?.homeMembershipImage?.url);

  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="container-ms py-12 md:py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
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
              <span className="rounded-full bg-brand px-3 py-1 text-xs font-semibold text-white">
                25/26 SEASON
              </span>
            </div>

            <p className="mt-6 max-w-xl leading-relaxed text-muted">
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
                className="inline-flex items-center justify-center rounded-xl bg-ink px-7 py-3 font-semibold text-white transition hover:opacity-95"
              >
                JOIN NOW →
              </a>

              <span className="text-muted">OR</span>

              <a
                href={home.settings?.ticketsUrl || "/tickets"}
                className="inline-flex items-center justify-center rounded-xl border border-line bg-white px-7 py-3 font-semibold text-ink transition hover:bg-black/5"
              >
                BUY TICKETS? →
              </a>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative w-full max-w-[520px]">
              <div className="rounded-2xl border border-line bg-white/80 p-6 shadow-[0_18px_40px_rgba(0,0,0,.10)] backdrop-blur">
                {membershipImage ? (
                  <div className="relative h-[340px] w-full">
                    <Image
                      src={membershipImage}
                      alt="Membership"
                      fill
                      sizes="(max-width: 1023px) 100vw, 520px"
                      className="object-contain"
                      priority
                    />
                  </div>
                ) : (
                  <div className="h-[340px] rounded-xl bg-black/5" />
                )}
              </div>

              <div className="pointer-events-none absolute -bottom-5 left-1/2 h-8 w-[70%] -translate-x-1/2 rounded-full bg-black/20 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* TIER CARDS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-[#0a1628]">
            Choose Your Tier
          </h2>
          <p className="mt-2 text-gray-500">
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
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-[#0a1628]">
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
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-semibold text-[#0a1628]">
                {item.q}
                <span className="text-xl text-gray-400 transition-transform group-open:rotate-45">
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