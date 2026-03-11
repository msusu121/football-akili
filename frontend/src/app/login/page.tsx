import { apiGet } from "@/lib/api";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const home = await apiGet<any>("/public/home");

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 text-center">
      <h1 className="text-3xl font-bold"></h1>
      <p className="mt-3 text-muted">
       
      </p>

      <div className="mt-8 flex justify-center">
        <LoginForm
          logoUrl="https://mombasaunited.com/club-media/logos/club.png"
          clubName="Mombasa United FC"
        />
      </div>
    </section>
  );
}