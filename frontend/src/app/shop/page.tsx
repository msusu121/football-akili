import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import ShopClient from "@/components/ShopClient";

export default async function ShopPage() {
  const home = await apiGet<any>("/public/home");

  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <ShopClient />
      </section>
    </SiteShell>
  );
}
