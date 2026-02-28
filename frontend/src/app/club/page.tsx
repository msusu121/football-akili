import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";

export default async function ClubPage() {
  const home = await apiGet<any>("/public/home");

  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="text-xs tracking-widest text-muted">EST. {home.settings?.foundedYear || ""}</div>
        <h1 className="mt-3 text-4xl font-extrabold">{home.settings?.clubName || "Club"}</h1>
        <p className="mt-4 text-muted leading-relaxed">
          From humble beginnings to the top flight — tell your story here. This page is designed to match the “chronicle / timeline” vibe.
        </p>

        <div className="mt-8 grid gap-4">
          {[{ year: 2016, title: "Foundation Year", text: "Founded with a vision to promote football excellence." },
            { year: 2018, title: "National Entry", text: "Promotion and national recognition." },
            { year: 2020, title: "Youth Academy Launch", text: "Nurturing the next generation." },
            { year: 2023, title: "Modern Era", text: "Facilities, staff, and professionalisation." }].map((i) => (
            <div key={i.title} className="rounded-2xl border border-line bg-card p-5">
              <div className="text-xs text-muted">{i.year}</div>
              <div className="mt-1 font-semibold">{i.title}</div>
              <div className="mt-2 text-sm text-muted">{i.text}</div>
            </div>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
