"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson, apiUpload } from "@/lib/apiClient";
import Link from "next/link";

type Section = "overview" | "news" | "matches" | "team" | "products" | "sponsors" | "media" | "highlights" | "settings" | "faqs";

const SECTIONS: Array<{ key: Section; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "news", label: "News" },
  { key: "matches", label: "Matches" },
  { key: "team", label: "Team & Staff" },
  { key: "products", label: "Shop Products" },
  { key: "sponsors", label: "Sponsors" },
  { key: "media", label: "Media Library" },
  { key: "highlights", label: "Highlights" },
  { key: "faqs", label: "FAQs" },
  { key: "settings", label: "Site Settings" },
];

export default function AdminClient() {
  const { token, user } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(() => !!user && ["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"].includes(user.role), [user]);

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (section === "overview") setData(await apiJson("/admin/overview", { token }));
      if (section === "news") setData(await apiJson("/admin/news", { token }));
      if (section === "matches") setData(await apiJson("/admin/matches", { token }));
      if (section === "team") setData(await apiJson("/admin/team", { token }));
      if (section === "products") setData(await apiJson("/admin/products", { token }));
      if (section === "sponsors") setData(await apiJson("/admin/sponsors", { token }));
      if (section === "media") setData(await apiJson("/admin/media", { token }));
      if (section === "highlights") setData(await apiJson("/admin/highlights", { token }));
      if (section === "faqs") setData(await apiJson("/admin/faqs", { token }));
      if (section === "settings") setData(await apiJson("/admin/settings", { token }));
    } catch (e: any) {
      setError(e?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, section]);

  if (!token) {
    return (
      <div className="rounded-3xl border border-line bg-card p-6">
        <div className="text-sm font-semibold">Admin</div>
        <div className="mt-2 text-sm text-muted">Sign in with an admin account to access CMS.</div>
        <div className="mt-4"><Link href="/login?next=/admin" className="px-5 py-3 rounded-full bg-brand text-black font-semibold">Sign in</Link></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-line bg-card p-6">
        <div className="text-sm font-semibold">Forbidden</div>
        <div className="mt-2 text-sm text-muted">Your role doesn’t have CMS access.</div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-3xl border border-line bg-card p-4 h-fit sticky top-28">
        <div className="text-sm font-semibold px-2">CMS</div>
        <div className="mt-3 grid gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`text-left px-3 py-2 rounded-2xl text-sm ${section === s.key ? "bg-white/10" : "hover:bg-white/5"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-4 px-2 text-xs text-muted">Media uploads: use /uploads/presign then POST /admin/media to register.</div>
      </aside>

      <div className="rounded-3xl border border-line bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs tracking-widest text-muted">ADMIN</div>
            <h1 className="text-2xl font-bold mt-1">{SECTIONS.find((s) => s.key === section)?.label}</h1>
          </div>
          <button onClick={load} className="px-4 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Refresh</button>
        </div>

        {loading ? <div className="mt-6 text-sm text-muted">Loading…</div> : null}
        {error ? <div className="mt-6 text-sm text-red-300">{error}</div> : null}

        {!loading ? (
          <div className="mt-6">
            {section === "overview" ? <OverviewPanel data={data} /> : null}
            {section === "news" ? <NewsPanel token={token} data={data} onChange={load} /> : null}
            {section === "matches" ? <MatchesPanel token={token} data={data} onChange={load} /> : null}
            {section === "team" ? <TeamPanel token={token} data={data} onChange={load} /> : null}
            {section === "products" ? <ProductsPanel token={token} data={data} onChange={load} /> : null}
            {section === "sponsors" ? <SponsorsPanel token={token} data={data} onChange={load} /> : null}
            {section === "media" ? <MediaPanel token={token} data={data} onChange={load} /> : null}
            {section === "highlights" ? <HighlightsPanel token={token} data={data} onChange={load} /> : null}
            {section === "faqs" ? <FAQsPanel token={token} data={data} onChange={load} /> : null}
            {section === "settings" ? <SettingsPanel token={token} data={data} onChange={load} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function OverviewPanel({ data }: { data: any }) {
  const counts = data?.counts || {};
  const cards = [
    { k: "news", label: "News" },
    { k: "matches", label: "Matches" },
    { k: "team", label: "Team" },
    { k: "products", label: "Products" },
    { k: "sponsors", label: "Sponsors" },
    { k: "media", label: "Media" },
    { k: "tickets", label: "Ticket Events" },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <div key={c.k} className="rounded-2xl border border-line bg-black/20 p-5">
          <div className="text-sm text-muted">{c.label}</div>
          <div className="mt-2 text-3xl font-extrabold">{counts[c.k] ?? 0}</div>
        </div>
      ))}
    </div>
  );
}

function NewsPanel({ token, data, onChange }: { token: string; data: any; onChange: () => void }) {
  const [draft, setDraft] = useState({ slug: "", title: "", excerpt: "", contentHtml: "<p></p>", isFeatured: false, publishedAt: new Date().toISOString() });
  const items = data?.items || [];
  const create = async () => {
    await apiJson("/admin/news", { method: "POST", token, body: { ...draft, publishedAt: draft.publishedAt } });
    setDraft({ slug: "", title: "", excerpt: "", contentHtml: "<p></p>", isFeatured: false, publishedAt: new Date().toISOString() });
    onChange();
  };
  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await apiJson(`/admin/news/${id}`, { method: "DELETE", token });
    onChange();
  };
  const togglePublish = async (item: any) => {
    await apiJson(`/admin/news/${item.id}`, { method: "PUT", token, body: { publishedAt: item.publishedAt ? null : new Date().toISOString() } });
    onChange();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Create post</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="slug" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3 md:col-span-2" placeholder="excerpt" value={draft.excerpt} onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))} />
          <textarea className="rounded-2xl border border-line bg-black/30 px-4 py-3 md:col-span-2 min-h-[140px]" placeholder="contentHtml" value={draft.contentHtml} onChange={(e) => setDraft((d) => ({ ...d, contentHtml: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={draft.isFeatured} onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))} /> Featured
          </label>
        </div>
        <button onClick={create} className="mt-4 px-5 py-3 rounded-full bg-brand text-black font-semibold">Create</button>
      </div>

      <div className="grid gap-3">
        {items.map((n: any) => (
          <div key={n.id} className="rounded-2xl border border-line bg-black/20 p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold line-clamp-1">{n.title}</div>
              <div className="mt-1 text-xs text-muted">/{n.slug} • {n.publishedAt ? "Published" : "Draft"}</div>
              <div className="mt-2 text-sm text-muted line-clamp-2">{n.excerpt}</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => togglePublish(n)} className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">
                {n.publishedAt ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => del(n.id)} className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Delete</button>
            </div>
          </div>
        ))}
        {!items.length ? <div className="text-sm text-muted">No posts yet.</div> : null}
      </div>
    </div>
  );
}

function MatchesPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [draft, setDraft] = useState({
    competition: "Premier League",
    season: "2025/26",
    kickoffAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    venue: "",
    isHome: true,
    opponent: "",
    status: "SCHEDULED",
  });
  const create = async () => {
    await apiJson("/admin/matches", { method: "POST", token, body: draft });
    setDraft((d) => ({ ...d, opponent: "" }));
    onChange();
  };
  const del = async (id: string) => {
    if (!confirm("Delete match?")) return;
    await apiJson(`/admin/matches/${id}`, { method: "DELETE", token });
    onChange();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Create match</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" value={draft.competition} onChange={(e) => setDraft((d) => ({ ...d, competition: e.target.value }))} placeholder="competition" />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" value={draft.season} onChange={(e) => setDraft((d) => ({ ...d, season: e.target.value }))} placeholder="season" />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" value={draft.kickoffAt} onChange={(e) => setDraft((d) => ({ ...d, kickoffAt: e.target.value }))} placeholder="kickoffAt (ISO)" />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" value={draft.venue} onChange={(e) => setDraft((d) => ({ ...d, venue: e.target.value }))} placeholder="venue" />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" value={draft.opponent} onChange={(e) => setDraft((d) => ({ ...d, opponent: e.target.value }))} placeholder="opponent" />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={draft.isHome} onChange={(e) => setDraft((d) => ({ ...d, isHome: e.target.checked }))} /> Home match
          </label>
        </div>
        <button onClick={create} className="mt-4 px-5 py-3 rounded-full bg-brand text-black font-semibold">Create</button>
      </div>

      <div className="grid gap-3">
        {items.map((m: any) => (
          <div key={m.id} className="rounded-2xl border border-line bg-black/20 p-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">{m.isHome ? "HOME" : "AWAY"} vs {m.opponent}</div>
              <div className="mt-1 text-xs text-muted">{new Date(m.kickoffAt).toDateString()} • {m.competition} • {m.season}</div>
              <div className="mt-1 text-xs text-muted">{m.venue || "Venue TBA"} • {m.status}</div>
            </div>
            <button onClick={() => del(m.id)} className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [draft, setDraft] = useState({ slug: "", fullName: "", jerseyNo: "", position: "ST", team: "Men's First Team", isStaff: false });
  const create = async () => {
    await apiJson("/admin/team", { method: "POST", token, body: { ...draft, jerseyNo: draft.jerseyNo || null } });
    setDraft({ slug: "", fullName: "", jerseyNo: "", position: "ST", team: "Men's First Team", isStaff: false });
    onChange();
  };
  const del = async (id: string) => {
    if (!confirm("Delete member?")) return;
    await apiJson(`/admin/team/${id}`, { method: "DELETE", token });
    onChange();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Add member</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="slug" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="full name" value={draft.fullName} onChange={(e) => setDraft((d) => ({ ...d, fullName: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="jersey no" value={draft.jerseyNo} onChange={(e) => setDraft((d) => ({ ...d, jerseyNo: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="position" value={draft.position} onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3 md:col-span-2" placeholder="team" value={draft.team} onChange={(e) => setDraft((d) => ({ ...d, team: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={draft.isStaff} onChange={(e) => setDraft((d) => ({ ...d, isStaff: e.target.checked }))} /> Staff
          </label>
        </div>
        <button onClick={create} className="mt-4 px-5 py-3 rounded-full bg-brand text-black font-semibold">Create</button>
      </div>

      <div className="grid gap-3">
        {items.map((m: any) => (
          <div key={m.id} className="rounded-2xl border border-line bg-black/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{m.fullName} {m.jerseyNo ? `#${m.jerseyNo}` : ""}</div>
              <div className="text-xs text-muted">{m.isStaff ? "Staff" : m.team} • {m.position} • /{m.slug}</div>
            </div>
            <button onClick={() => del(m.id)} className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [draft, setDraft] = useState({ slug: "", title: "", price: 0, currency: "KES", isActive: true });
  const create = async () => {
    await apiJson("/admin/products", { method: "POST", token, body: draft });
    setDraft({ slug: "", title: "", price: 0, currency: "KES", isActive: true });
    onChange();
  };
  const del = async (id: string) => {
    if (!confirm("Delete product?")) return;
    await apiJson(`/admin/products/${id}`, { method: "DELETE", token });
    onChange();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Add product</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="slug" value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="price" type="number" value={draft.price} onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="currency" value={draft.currency} onChange={(e) => setDraft((d) => ({ ...d, currency: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))} /> Active
          </label>
        </div>
        <button onClick={create} className="mt-4 px-5 py-3 rounded-full bg-brand text-black font-semibold">Create</button>
      </div>

      <div className="grid gap-3">
        {items.map((p: any) => (
          <div key={p.id} className="rounded-2xl border border-line bg-black/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="text-xs text-muted">/{p.slug} • {p.price} {p.currency} • {p.isActive ? "Active" : "Hidden"}</div>
            </div>
            <button onClick={() => del(p.id)} className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SponsorsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [draft, setDraft] = useState({ name: "", tier: "Official Partner", website: "", sort: 0, isActive: true });
  const create = async () => {
    await apiJson("/admin/sponsors", { method: "POST", token, body: { ...draft, website: draft.website || null } });
    setDraft({ name: "", tier: "Official Partner", website: "", sort: 0, isActive: true });
    onChange();
  };
  const del = async (id: string) => {
    if (!confirm("Delete sponsor?")) return;
    await apiJson(`/admin/sponsors/${id}`, { method: "DELETE", token });
    onChange();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Add sponsor</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="tier" value={draft.tier} onChange={(e) => setDraft((d) => ({ ...d, tier: e.target.value }))} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3 md:col-span-2" placeholder="website" value={draft.website} onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))} />
        </div>
        <button onClick={create} className="mt-4 px-5 py-3 rounded-full bg-brand text-black font-semibold">Create</button>
      </div>
      <div className="grid gap-3">
        {items.map((s: any) => (
          <div key={s.id} className="rounded-2xl border border-line bg-black/20 p-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{s.name}</div>
              <div className="text-xs text-muted">{s.tier} • {s.website || "—"}</div>
            </div>
            <button onClick={() => del(s.id)} className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MediaPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [folder, setFolder] = useState("images");
  const [type, setType] = useState<"IMAGE" | "VIDEO" | "DOC">("IMAGE");
  const [title, setTitle] = useState("");

  const uploadFile = async (file: File) => {
    const form = new FormData();
    form.append("folder", folder);
    form.append("file", file);

    const up = await apiUpload<{ key: string; publicUrl: string; mimeType: string; bytes: number }>("/uploads/local", { token, form });

    await apiJson("/admin/media", {
      method: "POST",
      token,
      body: {
        type,
        title: title || file.name,
        path: up.key,
        mimeType: up.mimeType,
        bytes: up.bytes,
      },
    });

    setTitle("");
    onChange();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Upload Media</div>
        <div className="mt-2 text-sm text-muted">Uploads are saved to the backend public folder and served from <span className="font-mono">/media/...</span>. The DB stores only the path/key.</div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="folder e.g. news/2026/02" value={folder} onChange={(e) => setFolder(e.target.value)} />
          <select className="rounded-2xl border border-line bg-black/30 px-4 py-3" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="IMAGE">IMAGE</option>
            <option value="VIDEO">VIDEO</option>
            <option value="DOC">DOC</option>
          </select>
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="optional title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="mt-4">
          <input type="file" onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadFile(f);
          }} />
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((m: any) => (
          <div key={m.id} className="rounded-2xl border border-line bg-black/20 p-4">
            <div className="text-sm font-semibold">{m.title || m.path}</div>
            <div className="mt-1 text-xs text-muted">{m.type} • {m.mimeType || "—"}</div>
            <div className="mt-1 text-xs text-muted">{m.path}</div>
            <div className="mt-3">
              <a className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm" href={`http://localhost:4000/media/${m.path}`} target="_blank" rel="noreferrer">Open</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HighlightsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [folder, setFolder] = useState("highlights");
  const [draft, setDraft] = useState<any>({
    title: "",
    videoUrl: "",
    durationSec: undefined,
    publishedAt: undefined,
    thumbnailId: undefined,
    sort: 0,
    isActive: true,
  });

  const uploadAndRegister = async (file: File, type: "IMAGE" | "VIDEO") => {
    const form = new FormData();
    form.append("folder", folder);
    form.append("file", file);
    const up = await apiUpload<{ key: string; publicUrl: string; mimeType: string; bytes: number }>("/uploads/local", { token, form });
    const created = await apiJson<{ item: any }>("/admin/media", {
      method: "POST",
      token,
      body: { type, title: file.name, path: up.key, mimeType: up.mimeType, bytes: up.bytes },
    });
    return { ...up, media: created.item };
  };

  const uploadVideo = async (file: File) => {
    const r = await uploadAndRegister(file, "VIDEO");
    setDraft((d: any) => ({ ...d, videoUrl: r.publicUrl }));
  };

  const uploadThumb = async (file: File) => {
    const r = await uploadAndRegister(file, "IMAGE");
    setDraft((d: any) => ({ ...d, thumbnailId: r.media.id }));
  };
  const create = async () => {
    await apiJson("/admin/highlights", { method: "POST", token, body: draft });
    setDraft({ title: "", videoUrl: "", durationSec: undefined, publishedAt: undefined, thumbnailId: undefined, sort: 0, isActive: true });
    onChange();
  };
  const del = async (id: string) => {
    if (!confirm("Delete highlight?")) return;
    await apiJson(`/admin/highlights/${id}`, { method: "DELETE", token });
    onChange();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Add highlight</div>
        <div className="mt-4 grid gap-3">
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="folder e.g. highlights/2026/02" value={folder} onChange={(e) => setFolder(e.target.value)} />
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="title" value={draft.title} onChange={(e) => setDraft((d: any) => ({ ...d, title: e.target.value }))} />

          <div className="grid gap-2">
            <div className="text-xs text-muted">Video file (mp4/webm). This replaces YouTube links.</div>
            <input type="file" accept="video/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadVideo(f);
            }} />
            <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="videoUrl (auto-filled after upload)" value={draft.videoUrl || ""} onChange={(e) => setDraft((d: any) => ({ ...d, videoUrl: e.target.value }))} />
          </div>

          <div className="grid gap-2">
            <div className="text-xs text-muted">Thumbnail image (optional, recommended)</div>
            <input type="file" accept="image/*" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadThumb(f);
            }} />
            <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="thumbnailId (auto-filled after upload)" value={draft.thumbnailId || ""} onChange={(e) => setDraft((d: any) => ({ ...d, thumbnailId: e.target.value }))} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="durationSec (optional)" value={draft.durationSec ?? ""} onChange={(e) => setDraft((d: any) => ({ ...d, durationSec: e.target.value ? Number(e.target.value) : undefined }))} />
            <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="publishedAt ISO (optional)" value={draft.publishedAt ?? ""} onChange={(e) => setDraft((d: any) => ({ ...d, publishedAt: e.target.value || undefined }))} />
          </div>
        </div>
        <button onClick={create} className="mt-4 px-5 py-3 rounded-full bg-brand text-black font-semibold">Create</button>
      </div>
      <div className="grid gap-3">
        {items.map((h: any) => (
          <div key={h.id} className="rounded-2xl border border-line bg-black/20 p-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">{h.title}</div>
              <div className="mt-1 text-xs text-muted">{h.videoUrl}</div>
            </div>
            <button onClick={() => del(h.id)} className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [draft, setDraft] = useState({ question: "", answerHtml: "<p></p>", sort: 0, isActive: true });
  const create = async () => {
    await apiJson("/admin/faqs", { method: "POST", token, body: draft });
    setDraft({ question: "", answerHtml: "<p></p>", sort: 0, isActive: true });
    onChange();
  };
  const del = async (id: string) => {
    if (!confirm("Delete FAQ?")) return;
    await apiJson(`/admin/faqs/${id}`, { method: "DELETE", token });
    onChange();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Add FAQ</div>
        <div className="mt-4 grid gap-3">
          <input className="rounded-2xl border border-line bg-black/30 px-4 py-3" placeholder="question" value={draft.question} onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))} />
          <textarea className="rounded-2xl border border-line bg-black/30 px-4 py-3 min-h-[110px]" placeholder="answerHtml" value={draft.answerHtml} onChange={(e) => setDraft((d) => ({ ...d, answerHtml: e.target.value }))} />
        </div>
        <button onClick={create} className="mt-4 px-5 py-3 rounded-full bg-brand text-black font-semibold">Create</button>
      </div>
      <div className="grid gap-3">
        {items.map((f: any) => (
          <div key={f.id} className="rounded-2xl border border-line bg-black/20 p-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">{f.question}</div>
              <div className="mt-2 text-sm text-muted" dangerouslySetInnerHTML={{ __html: f.answerHtml }} />
            </div>
            <button onClick={() => del(f.id)} className="px-3 py-2 rounded-full border border-line bg-white/5 hover:bg-white/10 text-sm">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel({ token, data, onChange }: any) {
  const s = data?.settings;
  const [form, setForm] = useState<any>(s || {});
  useEffect(() => setForm(s || {}), [s]);

  const save = async () => {
    await apiJson("/admin/settings", { method: "PUT", token, body: form });
    onChange();
    alert("Saved");
  };

  const uploadSettingMedia = async (
    field: "headerLogoId" | "partnerLogoId" | "heroMediaId" | "homeShopImageId" | "homeMembershipImageId",
    file: File
  ) => {
    const formData = new FormData();
    formData.append("folder", "site");
    formData.append("file", file);
    const up = await apiUpload<{ key: string; publicUrl: string; mimeType: string; bytes: number }>("/uploads/local", { token, form: formData });
    const created = await apiJson<{ item: any }>("/admin/media", {
      method: "POST",
      token,
      body: { type: "IMAGE", title: file.name, path: up.key, mimeType: up.mimeType, bytes: up.bytes },
    });
    setForm((f: any) => ({ ...f, [field]: created.item.id }));
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Club name"><input className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3" value={form.clubName || ""} onChange={(e) => setForm((f: any) => ({ ...f, clubName: e.target.value }))} /></Field>
        <Field label="Tagline"><input className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3" value={form.tagline || ""} onChange={(e) => setForm((f: any) => ({ ...f, tagline: e.target.value }))} /></Field>
        <Field label="Email"><input className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3" value={form.email || ""} onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))} /></Field>
        <Field label="Phone"><input className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3" value={form.phone || ""} onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))} /></Field>
        <Field label="Stadium"><input className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3" value={form.stadium || ""} onChange={(e) => setForm((f: any) => ({ ...f, stadium: e.target.value }))} /></Field>
        <Field label="Address"><input className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3" value={form.address || ""} onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))} /></Field>
        <Field label="Hero title"><input className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3" value={form.heroTitle || ""} onChange={(e) => setForm((f: any) => ({ ...f, heroTitle: e.target.value }))} /></Field>
        <Field label="Hero subtitle"><textarea className="w-full rounded-2xl border border-line bg-black/30 px-4 py-3 min-h-[90px]" value={form.heroSubtitle || ""} onChange={(e) => setForm((f: any) => ({ ...f, heroSubtitle: e.target.value }))} /></Field>
      </div>

      <div className="rounded-2xl border border-line bg-black/20 p-5">
        <div className="text-sm font-semibold">Site media (upload & bind)</div>
        <div className="mt-2 text-xs text-muted">Upload an image here and it will be stored in the public folder and automatically saved to the correct setting field.</div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm text-muted">Header logo</div>
            <input type="file" accept="image/*" className="mt-2" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSettingMedia("headerLogoId", f); }} />
            <div className="mt-2 text-xs text-muted">headerLogoId: {form.headerLogoId || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Partner logo</div>
            <input type="file" accept="image/*" className="mt-2" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSettingMedia("partnerLogoId", f); }} />
            <div className="mt-2 text-xs text-muted">partnerLogoId: {form.partnerLogoId || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Homepage hero image</div>
            <input type="file" accept="image/*" className="mt-2" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSettingMedia("heroMediaId", f); }} />
            <div className="mt-2 text-xs text-muted">heroMediaId: {form.heroMediaId || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Homepage shop image</div>
            <input type="file" accept="image/*" className="mt-2" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSettingMedia("homeShopImageId", f); }} />
            <div className="mt-2 text-xs text-muted">homeShopImageId: {form.homeShopImageId || "—"}</div>
          </div>
          <div>
            <div className="text-sm text-muted">Homepage membership image</div>
            <input type="file" accept="image/*" className="mt-2" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSettingMedia("homeMembershipImageId", f); }} />
            <div className="mt-2 text-xs text-muted">homeMembershipImageId: {form.homeMembershipImageId || "—"}</div>
          </div>
        </div>
      </div>

      <button onClick={save} className="px-5 py-3 rounded-full bg-brand text-black font-semibold w-fit">Save settings</button>
      <div className="text-xs text-muted">Tip: Upload media above to auto-fill IDs, then Save settings.</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm text-muted">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}
