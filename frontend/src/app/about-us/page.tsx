// FILE: frontend/src/app/about-us/page.tsx

import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";

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

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-[2px] w-10 bg-brand" />
      <span className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-brand">
        {children}
      </span>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
  light = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  copy?: string;
  light?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        className={`mt-4 h-serif text-3xl font-extrabold tracking-tight md:text-5xl ${
          light ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {copy ? (
        <p
          className={`mt-4 max-w-2xl text-sm leading-7 md:text-base ${
            light ? "text-white/70" : "text-muted"
          }`}
        >
          {copy}
        </p>
      ) : null}
    </div>
  );
}

function MetricCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-5 backdrop-blur">
      <div className="text-3xl font-extrabold text-white md:text-4xl">{value}</div>
      <div className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/45">
        {label}
      </div>
    </div>
  );
}

function ValueCard({
  index,
  title,
  body,
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="group rounded-2xl border border-line bg-white p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink text-sm font-extrabold text-white">
          {index}
        </div>
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
            Club Value
          </div>
          <h3 className="mt-1 text-xl font-extrabold text-ink">{title}</h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">{body}</p>
    </div>
  );
}

function Pill({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] ${
        dark ? "bg-white/10 text-white/70" : "bg-black/5 text-ink/70"
      }`}
    >
      {children}
    </span>
  );
}

export default async function AboutUsPage() {
  const home = await apiGet<any>("/public/home");

  const clubName = String(home?.settings?.clubName || "Mombasa United");
  const heroBg =
    resolveAssetUrl(home?.featured?.heroMedia?.url) ||
    resolveAssetUrl(home?.settings?.heroMedia?.url) ||
    "https://mombasaunited.com/club-media/images/back3.jpeg";

  return (
    <SiteShell
      settings={home?.settings}
      socials={home?.socials}
      sponsors={home?.sponsors}
    >
      <div className="bg-white">
        {/* HERO */}
       

        {/* WHO WE ARE */}
        <section className="container-ms py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
            <div>
              <SectionHeading
                eyebrow="Who We Are"
                title={
                  <>
                    A club shaped by
                    <span className="text-brand"> belonging</span>,
                    <span className="text-brand"> ambition</span> and
                    <span className="text-brand"> standards</span>.
                  </>
                }
                copy="Everything about the club should feel deliberate — from the football on the pitch to the experience around it. We are building a premium football institution with local soul, modern structure and a long-term vision."
              />

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white p-6">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                    Identity
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Proudly rooted in Mombasa and the coast, with an identity that
                    reflects the city’s energy, confidence and football culture.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-white p-6">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                    Football
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Competitive, disciplined and ambitious — building a side that
                    can inspire supporters and compete with purpose every week.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-white p-6">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                    Fans
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    The club is strongest when supporters feel ownership. We want
                    the city to see itself in the badge, the voice and the matchday.
                  </p>
                </div>

                <div className="rounded-2xl border border-line bg-white p-6">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                    Legacy
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted">
                    Not just chasing moments — building foundations, standards and
                    memories that can carry the club for years to come.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-line bg-ink p-7 text-white shadow-soft">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand">
                Our Purpose
              </div>

              <div className="mt-4 h-serif text-3xl font-extrabold leading-tight">
                To build a football club Mombasa can truly call its own.
              </div>

              <div className="mt-6 space-y-4 text-sm leading-7 text-white/70">
                <p>
                  We want every supporter, every family, every young player and
                  every partner to feel that this is their club.
                </p>
                <p>
                  That means competitive football, stronger community connection,
                  better matchday experiences and a professional culture worthy of
                  the city we represent.
                </p>
                <p>
                  It also means thinking bigger — not only about where we are, but
                  where this club can go.
                </p>
              </div>

              <div className="mt-8 grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-white">
                    Represent the city
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-white">
                    Raise standards
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
                  <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-white">
                    Build for the future
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="border-y border-line bg-[#faf8f2]">
          <div className="container-ms py-14 md:py-20">
            <SectionHeading
              eyebrow="What We Stand For"
              title={
                <>
                  The standards behind the
                  <span className="text-brand"> badge</span>.
                </>
              }
              copy="A strong club identity is not built by words alone. It is built by values that show up in football decisions, supporter experience, partnerships and culture."
            />

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              <ValueCard
                index="01"
                title="Ambition"
                body="We expect growth, progress and courage. The club should always carry the mentality of moving forward."
              />
              <ValueCard
                index="02"
                title="Belonging"
                body="We want supporters to feel seen, heard and represented. This club must feel local in heart and big in outlook."
              />
              <ValueCard
                index="03"
                title="Excellence"
                body="From presentation to preparation, details matter. Standards shape perception, trust and performance."
              />
            </div>
          </div>
        </section>

        {/* MATCHDAY / COMMUNITY */}
        <section className="container-ms py-14 md:py-20">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[28px] border border-line bg-white shadow-soft">
              <div className="border-b border-line px-6 py-5">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                  Matchday Experience
                </div>
                <h3 className="mt-2 h-serif text-3xl font-extrabold text-ink">
                  Football should feel bigger when you arrive.
                </h3>
              </div>
              <div className="px-6 py-6 text-sm leading-7 text-muted">
                A modern club must create atmosphere, emotion and identity around
                the ninety minutes. From the first look of the badge to the last
                whistle, every detail should make supporters feel part of something
                serious, proud and growing.
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-line bg-ink shadow-soft">
              <div className="border-b border-white/10 px-6 py-5">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                  Community Connection
                </div>
                <h3 className="mt-2 h-serif text-3xl font-extrabold text-white">
                  The city is not around the club.
                  <span className="text-brand"> The city is in it.</span>
                </h3>
              </div>
              <div className="px-6 py-6 text-sm leading-7 text-white/68">
                Clubs grow stronger when their roots are real. Our identity is not
                meant to be distant. It should be visible in the fans, the culture,
                the stories, the young talent and the pride that follows the team.
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-ink">
          <div className="container-ms py-14 md:py-20">
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur md:p-10">
              <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
                <div>
                  <Eyebrow>Join The Journey</Eyebrow>
                  <h2 className="mt-4 h-serif text-3xl font-extrabold tracking-tight text-white md:text-5xl">
                    This is not just about where the club is.
                    <span className="text-brand"> It is about where it is going.</span>
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                    Explore our story, back the club, follow the fixtures and be
                    part of what Mombasa United is becoming.
                  </p>
                </div>

                <div className="grid gap-3">
                  <Link
                    href="/history"
                    className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                  >
                    Club History <span className="text-brand">›</span>
                  </Link>
                  <Link
                    href={home?.settings?.ticketsUrl || "/tickets"}
                    className="inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
                  >
                    Fixtures & Tickets <span className="text-brand">›</span>
                  </Link>
                  <Link
                    href={home?.settings?.membershipUrl || "/membership"}
                    className="inline-flex items-center justify-between rounded-2xl bg-brand px-5 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-ink transition hover:bg-brand-dark"
                  >
                    Membership <span>›</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}