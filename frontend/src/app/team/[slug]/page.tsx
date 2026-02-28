import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import Link from "next/link";

export default async function TeamMemberPage({ params }: { params: { slug: string } }) {
  const home = await apiGet<any>("/public/home");
  const m = await apiGet<any>(`/team/${params.slug}`);

  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/squad" className="text-sm text-muted hover:text-white">← Back to squad</Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-line bg-black/30 overflow-hidden">
            {m.portraitUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.portraitUrl} alt={m.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="p-10 text-muted">Portrait</div>
            )}
          </div>
          <div className="rounded-3xl border border-line bg-card p-6">
            <div className="text-xs tracking-widest text-muted">{m.isStaff ? "STAFF" : m.team}</div>
            <h1 className="mt-2 text-4xl font-extrabold">{m.fullName}</h1>
            <div className="mt-3 text-sm text-muted">{m.jerseyNo ? `#${m.jerseyNo} • ` : ""}{m.position}</div>
            {m.funFact ? <div className="mt-4 text-sm text-muted">Fun fact: <span className="text-white">{m.funFact}</span></div> : null}
            {m.bioHtml ? <div className="mt-6 prose-invert" dangerouslySetInnerHTML={{ __html: m.bioHtml }} /> : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
