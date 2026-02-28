import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";

function toTitle(s: string) {
  return (s || "").toUpperCase();
}

export default async function SquadPage({
  searchParams,
}: {
  searchParams?: { tab?: string; team?: string };
}) {
  const home = await apiGet<any>("/public/home");

  const isStaff = searchParams?.tab === "staff";
  const teamParam = searchParams?.team;

  const team =
    teamParam === "womens"
      ? "Women's First Team"
      : teamParam === "youth"
      ? "Youth"
      : "Men's First Team";

  const data = isStaff
    ? await apiGet<any>("/team?isStaff=true")
    : await apiGet<any>(`/team?team=${encodeURIComponent(team)}`);

  const sections = Object.entries(data.grouped || {});

  return (
    <SiteShell settings={home.settings} socials={home.socials} sponsors={home.sponsors}>
      <section className="container-ms py-12">
        {/* Tabs */}
        <div className="flex items-center gap-3">
          <Link
            href="/squad"
            className={`px-6 py-3 font-extrabold text-sm border-b-[3px] ${
              !isStaff ? "border-[#f58a1f] text-ink" : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            TEAMS
          </Link>
          <Link
            href="/squad?tab=staff"
            className={`px-6 py-3 font-extrabold text-sm border-b-[3px] ${
              isStaff ? "border-[#f58a1f] text-ink" : "border-transparent text-ink/60 hover:text-ink"
            }`}
          >
            STAFF
          </Link>
        </div>

        <div className="mt-3 text-sm text-muted">
          {isStaff ? "Men's Coaching Staff" : team}
        </div>

        {/* Sections like reference: GOALKEEPERS, DEFENDERS ... */}
        <div className="mt-12 space-y-16">
          {sections.map(([label, members]: any) => (
            <div key={label}>
              <div className="h-serif text-4xl md:text-5xl font-extrabold text-ink">
                {toTitle(label)}
              </div>
              <div className="mt-3 h-[4px] w-16 bg-[#f4c11a] rounded-full" />

              <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m: any) => (
                  <Link
                    key={m.slug}
                    href={`/team/${m.slug}`}
                    className="bg-white rounded-2xl border border-line shadow-sm hover:shadow-md transition overflow-hidden"
                  >
                    {/* portrait area */}
                    <div className="relative h-[340px] bg-gradient-to-b from-black/5 to-black/10">
                      {m.portraitUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.portraitUrl} alt={m.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" />
                      )}

                      {/* jersey badge top-right */}
                      {m.jerseyNo ? (
                        <div className="absolute top-4 right-4 h-12 w-12 rounded-full bg-white shadow grid place-items-center font-extrabold text-ink">
                          {m.jerseyNo}
                        </div>
                      ) : null}
                    </div>

                    {/* bottom details */}
                    <div className="p-6">
                      <div className="text-xl font-extrabold text-ink leading-tight">
                        {m.fullName?.split(" ").slice(-1)[0] || m.fullName}
                      </div>
                      <div className="mt-1 text-sm text-muted">
                        {m.fullName?.split(" ").slice(0, -1).join(" ") || ""}
                      </div>

                      <div className="mt-4 h-[3px] w-7 bg-[#f58a1f] rounded-full" />

                      <div className="mt-4 text-xs font-extrabold tracking-[0.25em] text-muted">
                        {m.position || ""}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}