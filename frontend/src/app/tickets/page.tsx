import { apiGet } from "@/lib/api";
import TicketsClient from "@/components/TicketsClient";
import  { SiteShell } from "@/components/SiteShell";

export default async function TicketsPage() {
  const home = await apiGet<any>("/public/home");

  return (
    <SiteShell settings={home.settings} socials={home.socials} sponsors={home.sponsors}>
      <section className="mx-auto max-w-6xl px-4 py-24">
        <TicketsClient />
      </section>
    </SiteShell>
  );
}
