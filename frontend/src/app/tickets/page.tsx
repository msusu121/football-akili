import { apiGet } from "@/lib/api";
import TicketsClient from "@/components/TicketsClient";
import TicketsShell from "@/components/TicketsShell";

export default async function TicketsPage() {
  const home = await apiGet<any>("/public/home");

  return (
    <TicketsShell settings={home.settings} socials={home.socials} sponsors={home.sponsors}>
      <section className="mx-auto max-w-6xl px-4 py-24">
        <TicketsClient />
      </section>
    </TicketsShell>
  );
}
