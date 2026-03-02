import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import ShopProductClient from "@/components/ShopProductClient";

export default async function ShopProductPage({ params }: { params: { slug: string } }) {
  const home = await apiGet<any>("/public/home");
  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <ShopProductClient slug={params.slug} />
      </section>
    </SiteShell>
  );
}
