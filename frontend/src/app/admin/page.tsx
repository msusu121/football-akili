import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import AdminClient from "@/components/AdminClient";

export default async function AdminPage() {
  const home = await apiGet<any>("/public/home");
  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="mx-auto max-w-7xl px-4 py-10">
        <AdminClient />
      </section>
    </SiteShell>
  );
}
