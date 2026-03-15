import { apiGet } from "@/lib/api";
import TicketEventClient from "@/components/TicketEventClient";
import SiteShell from "@/components/SiteShell";

export default async function TicketEventPage({ params }: { params: { id: string } }) {
  const home = await apiGet<any>("/public/home");
  return (
    <SiteShell settings={home.settings} socials={home.socials} sponsors={home.sponsors}>
      <section className="mx-auto max-w-6xl px-4 py-20">
        <TicketEventClient id={params.id} />
      </section>
    </SiteShell>
  );
}
