import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const home = await apiGet<any>("/public/home");
  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-3 text-muted">Login / register, token storage, and session refresh are wired.</p>

        <LoginForm />
      </section>
    </SiteShell>
  );
}
