import Image from "next/image";
import Link from "next/link";
import { SiteShell } from "@/components/SiteShell";
import { apiGet } from "@/lib/api";

const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function resolveAssetUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (ASSET_BASE) {
    return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
  return url;
}

export default async function TeamMemberPage({
  params,
}: {
  params: { slug: string };
}) {
  const home = await apiGet<any>("/public/home");
  const m = await apiGet<any>(`/team/${params.slug}`);

  const portraitUrl = resolveAssetUrl(m?.portraitUrl);

  return (
    <SiteShell settings={home.settings} socials={home.socials}>
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Link
          href="/squad"
          className="text-sm text-muted transition hover:text-white"
        >
          ← Back to squad
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-line bg-black/30">
            {portraitUrl ? (
              <div className="relative min-h-[420px] w-full sm:min-h-[520px] lg:min-h-[680px]">
                <Image
                  src={portraitUrl}
                  alt={m?.fullName || "Team member"}
                  fill
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="flex min-h-[420px] items-center justify-center p-10 text-muted sm:min-h-[520px] lg:min-h-[680px]">
                Portrait
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-line bg-card p-6">
            <div className="text-xs tracking-widest text-muted">
              {m?.isStaff ? "STAFF" : m?.team}
            </div>

            <h1 className="mt-2 text-4xl font-extrabold">
              {m?.fullName}
            </h1>

            <div className="mt-3 text-sm text-muted">
              {m?.jerseyNo ? `#${m.jerseyNo} • ` : ""}
              {m?.position}
            </div>

            {m?.funFact ? (
              <div className="mt-4 text-sm text-muted">
                Fun fact: <span className="text-white">{m.funFact}</span>
              </div>
            ) : null}

            {m?.bioHtml ? (
              <div
                className="prose prose-invert mt-6 max-w-none"
                dangerouslySetInnerHTML={{ __html: m.bioHtml }}
              />
            ) : null}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}