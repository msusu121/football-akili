// FILE: frontend/src/app/history/page.tsx

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

function TimelineCard({
  year,
  title,
  body,
}: {
  year: string;
  title: string;
  body: string;
}) {
  return (
    <div className="relative rounded-[28px] border border-line bg-white p-6 shadow-soft">
      <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-brand/60 via-brand/25 to-transparent" />
      <div className="relative pl-8">
        <span className="absolute left-[-2px] top-1 inline-flex h-5 w-5 rounded-full border-4 border-white bg-brand shadow-[0_0_0_2px_rgba(244,180,0,.15)]" />
        <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand">
          {year}
        </div>
        <h3 className="mt-2 text-2xl font-extrabold text-ink">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
      </div>
    </div>
  );
}

function Milestone({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand">
        {kicker}
      </div>
      <h3 className="mt-2 text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-muted">{body}</p>
    </div>
  );
}

export default async function HistoryPage() {
  const home = await apiGet<any>("/public/home");

  const clubName = String(home?.settings?.clubName || "Mombasa United");
  const heroBg =
    resolveAssetUrl(home?.featured?.heroMedia?.url) ||
    resolveAssetUrl(home?.settings?.heroMedia?.url) ||
    "https://mombasaunited.com/club-media/images/back3.jpeg";

  const timeline = [
    {
      year: "2020",
      title: "Origins",
      body:
        "The vision began with a long-term ambition: build a serious football project rooted in Mombasa, with identity, structure and the potential to grow into a true club for the city.",
    },
    {
      year: "2021",
      title: "The Competitive Foundation",
      body:
        "The project took its clearest early competitive shape through Mombasa Elite, giving the football plan a defined identity in the second tier and providing the platform for what would follow.",
    },
    {
      year: "2024",
      title: "Rebirth As Mombasa United",
      body:
        "A new identity brought sharper direction. The Mombasa United name signalled a club with stronger community meaning, bigger ambition and a clearer public face for the future.",
    },
    {
      year: "2024/25",
      title: "A Season That Tested Character",
      body:
        "The campaign demanded resilience. The club had to fight through difficult moments, hold its nerve and preserve its place while learning what it would take to grow into something stronger.",
    },
    {
      year: "2026",
      title: "Rise",
      body:
        "The response was powerful. Momentum returned, belief deepened and the club moved from survival mentality to promotion belief — proof that the project had entered a new phase.",
    },
  ];

  return (
    <SiteShell
      settings={home?.settings}
      socials={home?.socials}
      sponsors={home?.sponsors}
    >
      <div className="bg-white">
        {/* HERO */}
        

        {/* TIMELINE */}
        <section className="container-ms py-14 md:py-20">
          <SectionHeading
            eyebrow="From Vision To Momentum"
            title={
              <>
                Five chapters that shaped the
                <span className="text-brand"> modern story</span>.
              </>
            }
            copy="The club’s path has not been straight. It has been built through restructuring, belief, difficult seasons and the determination to keep moving forward."
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {timeline.map((item) => (
              <TimelineCard
                key={item.year + item.title}
                year={item.year}
                title={item.title}
                body={item.body}
              />
            ))}
          </div>
        </section>

        {/* KEY MILESTONES */}
        <section className="border-y border-line bg-[#faf8f2]">
          <div className="container-ms py-14 md:py-20">
            <SectionHeading
              eyebrow="Key Milestones"
              title={
                <>
                  Early wins, turning points and
                  <span className="text-brand"> defining moments</span>.
                </>
              }
              copy="Every club story is carried by moments that reveal identity. For Mombasa United, those moments have come through first steps, tough tests and a rise that changed the mood around the badge."
            />

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              <Milestone
                kicker="First Documented Early Statement"
                title="A coastal derby win that showed direction"
                body="One of the earliest reported milestones in the wider project era was a 1–0 victory over Coastal Heroes under the Mombasa Elite identity — an early sign of competitiveness and organisation."
              />
              <Milestone
                kicker="First Verified Win As Mombasa United"
                title="Samwest Blackboots 1–2 Mombasa United"
                body="The September 2024 victory over Samwest Blackboots stands as the clearest publicly traceable first win under the Mombasa United name in the current era."
              />
              <Milestone
                kicker="Momentum Shift"
                title="From survival pressure to promotion belief"
                body="What followed was bigger than one result. The club moved from battling at the lower end of the table to building the kind of consistency that puts serious pressure on the promotion race."
              />
            </div>
          </div>
        </section>

        {/* SURVIVAL */}
        <section className="container-ms py-14 md:py-20">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
            <div className="rounded-[30px] border border-line bg-ink p-8 text-white shadow-soft md:p-10">
              <Eyebrow>Survival</Eyebrow>
              <h2 className="mt-4 h-serif text-3xl font-extrabold tracking-tight md:text-5xl">
                Pressure revealed the club’s
                <span className="text-brand"> character</span>.
              </h2>

              <div className="mt-6 space-y-4 text-sm leading-7 text-white/72 md:text-base">
                <p>
                  The 2024/25 campaign was not a comfort season. It forced the club
                  to fight, respond and protect its place.
                </p>
                <p>
                  Those difficult stretches matter in football history because they
                  test whether a club has only noise around it — or real substance
                  within it.
                </p>
                <p>
                  Mombasa United came through that pressure and used it as a base
                  for the rise that followed.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                  League Finish
                </div>
                <div className="mt-2 text-4xl font-extrabold text-ink">16th</div>
                <p className="mt-3 text-sm leading-7 text-muted">
                  The season ended with the club preserving its place in the National
                  Super League — a moment that became a launch point, not an ending.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6 shadow-soft">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                  Meaning
                </div>
                <p className="mt-3 text-sm leading-7 text-muted">
                  Survival matters because it kept the project alive at a crucial
                  stage and created the space for the next phase of growth.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* RISE */}
        <section className="bg-ink">
          <div className="container-ms py-14 md:py-20">
            <SectionHeading
              eyebrow="Rise"
              title={
                <>
                  The story changed when belief turned into
                  <span className="text-brand"> results</span>.
                </>
              }
              copy="By 2026, the club had begun writing a very different chapter — one shaped by winning momentum, stronger belief and genuine promotion conversation."
              light
            />

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                  Winning Run
                </div>
                <div className="mt-3 text-4xl font-extrabold text-white">5</div>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  A first-ever five-match winning streak in the NSL signalled that
                  the club had moved into a more serious competitive phase.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                  Table Position
                </div>
                <div className="mt-3 text-4xl font-extrabold text-white">Top</div>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  The rise was not symbolic only. It translated into position,
                  pressure and belief in the promotion race.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">
                  What Comes Next
                </div>
                <p className="mt-3 text-sm leading-7 text-white/68">
                  The next pages of the story are still being written — but now they
                  are being written with momentum.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/about-us"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white transition hover:bg-white/10"
              >
                About The Club
              </Link>
              <Link
                href={home?.settings?.ticketsUrl || "/tickets"}
                className="inline-flex items-center justify-center rounded-xl bg-brand px-7 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink shadow-glow transition hover:bg-brand-dark"
              >
                Follow The Journey
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}