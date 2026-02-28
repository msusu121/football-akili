import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";

export default async function FixturesPage() {
  const home = await apiGet<any>("/public/home");
  const upcoming = await apiGet<any>("/matches/upcoming?take=10");
  const results = await apiGet<any>("/matches/results?take=10");

  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold">Fixtures & Results</h1>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="text-sm font-semibold">Upcoming</div>
            <div className="mt-4 grid gap-3">
              {upcoming.items.map((m: any) => (
                <div key={m.id} className="rounded-2xl border border-line bg-black/20 p-4">
                  <div className="text-xs text-muted">{new Date(m.kickoffAt).toLocaleString()}</div>
                  <div className="mt-1 font-semibold">{m.isHome ? "HOME" : "AWAY"} vs {m.opponent}</div>
                  <div className="text-sm text-muted">{m.competition} • {m.venue || "TBA"}</div>
                </div>
              ))}
              {upcoming.items.length === 0 ? <div className="text-sm text-muted">No upcoming fixtures.</div> : null}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="text-sm font-semibold">Most Recent Results</div>
            <div className="mt-4 grid gap-3">
              {results.items.map((m: any) => (
                <div key={m.id} className="rounded-2xl border border-line bg-black/20 p-4">
                  <div className="text-xs text-muted">{new Date(m.kickoffAt).toLocaleString()}</div>
                  <div className="mt-1 font-semibold">{m.isHome ? "HOME" : "AWAY"} vs {m.opponent}</div>
                  <div className="text-sm text-muted">FT • {m.homeScore ?? "-"} - {m.awayScore ?? "-"} • {m.competition}</div>
                </div>
              ))}
              {results.items.length === 0 ? <div className="text-sm text-muted">No results yet.</div> : null}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
