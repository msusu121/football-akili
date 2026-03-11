"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { apiJson, apiUpload } from "@/lib/apiClient";
import Link from "next/link";

const MEDIA_BASE =
  (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "https://mombasaunited.com/club-media").replace(/\/+$/g, "");

type Section =
  | "overview"
  | "news"
  | "matches"
  | "team"
  | "products"
  | "sponsors"
  | "media"
  | "highlights"
  | "settings"
  | "faqs"
  | "ads";

const SECTIONS: Array<{ key: Section; label: string; icon: string }> = [
  { key: "overview", label: "Overview", icon: "📊" },
  { key: "news", label: "News", icon: "📰" },
  { key: "matches", label: "Matches", icon: "⚽" },
  { key: "team", label: "Team & Staff", icon: "👥" },
  { key: "products", label: "Shop Products", icon: "🛍️" },
  { key: "sponsors", label: "Sponsors", icon: "🤝" },
  { key: "media", label: "Media Library", icon: "🖼️" },
  { key: "highlights", label: "Highlights", icon: "🎬" },
  { key: "ads", label: "Ads / Banners", icon: "📢" },
  { key: "faqs", label: "FAQs", icon: "❓" },
  { key: "settings", label: "Site Settings", icon: "⚙️" },
];

type UploadResponse = {
  key: string;
  publicUrl: string;
  mimeType: string;
  bytes: number;
  filename?: string;
};

function mediaUrlFromKey(key?: string | null) {
  if (!key) return "";
  return `${MEDIA_BASE}/${String(key).replace(/^\/+/g, "")}`;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toIsoOrNull(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

async function uploadFileToBucket(
  token: string,
  file: File,
  folder: string
): Promise<UploadResponse> {
  const form = new FormData();
  form.append("folder", folder);
  form.append("file", file);
  return apiUpload("/upload/upload", { token, form });
}

async function uploadAndRegisterMedia(
  token: string,
  file: File,
  folder: string,
  type: "IMAGE" | "VIDEO" | "DOC",
  title?: string
) {
  const up = await uploadFileToBucket(token, file, folder);
  const created = await apiJson<{ item: any }>("/admin/media", {
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
  return { ...up, media: created.item };
}

/* ─── Shared input style ─── */
const inputCls =
  "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/40 transition-colors";
const btnPrimary =
  "px-4 py-2.5 rounded-xl bg-brand hover:opacity-90 active:opacity-80 text-brand-foreground text-sm font-semibold transition-opacity";
const btnOutline =
  "px-3 py-2 rounded-xl border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 text-sm transition-colors";
const btnDanger =
  "px-3 py-2 rounded-xl border border-destructive/30 bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm transition-colors";
const cardCls =
  "rounded-xl border border-border bg-card p-4";

export default function AdminClient() {
  const { token, user } = useAuth();
  const [section, setSection] = useState<Section>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = useMemo(
    () => !!user && ["SUPER_ADMIN", "CLUB_ADMIN", "EDITOR"].includes(user.role),
    [user]
  );

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const endpoints: Record<Section, string> = {
        overview: "/admin/overview",
        news: "/admin/news",
        matches: "/admin/matches",
        team: "/admin/team",
        products: "/admin/products",
        sponsors: "/admin/sponsors",
        media: "/admin/media",
        highlights: "/admin/highlights",
        ads: "/admin/ads",
        faqs: "/admin/faqs",
        settings: "/admin/settings",
      };
      setData(await apiJson(endpoints[section], { token }));
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

  // Close sidebar on section change (mobile)
  const selectSection = (s: Section) => {
    setSection(s);
    setSidebarOpen(false);
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold text-foreground">Admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with an admin account to access CMS.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Forbidden</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your role doesn&apos;t have CMS access.
          </p>
        </div>
      </div>
    );
  }

  const currentLabel = SECTIONS.find((s) => s.key === section)?.label;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ═══ MOBILE OVERLAY ═══ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/70 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══ SIDEBAR ═══ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border p-4 transition-transform duration-200 ease-in-out
          md:static md:translate-x-0 md:z-auto
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold tracking-wide text-foreground">CMS</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 rounded-lg hover:bg-accent"
            aria-label="Close sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="grid gap-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => selectSection(s.key)}
              className={`flex items-center gap-2.5 text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                section === s.key
                  ? "bg-brand/15 text-brand font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <span className="text-base">{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>

        <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed">
          Media uploads: use /uploads/presign then POST /admin/media to register.
        </p>
      </aside>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/95 backdrop-blur px-4 py-3 md:px-6">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-accent"
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Admin
            </p>
            <h1 className="text-base font-bold truncate text-foreground">{currentLabel}</h1>
          </div>

          <button onClick={load} className={btnOutline}>
            Refresh
          </button>
        </header>

        {/* Content area */}
        <div className="p-4 md:p-6 max-w-5xl">
          {loading && (
            <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
          )}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          {!loading && (
            <>
              {section === "overview" && <OverviewPanel data={data} />}
              {section === "news" && (
                <NewsPanel token={token} data={data} onChange={load} />
              )}
              {section === "matches" && (
                <MatchesPanel token={token} data={data} onChange={load} />
              )}
              {section === "team" && (
                <TeamPanel token={token} data={data} onChange={load} />
              )}
              {section === "products" && (
                <ProductsPanel token={token} data={data} onChange={load} />
              )}
              {section === "sponsors" && (
                <SponsorsPanel token={token} data={data} onChange={load} />
              )}
              {section === "media" && (
                <MediaPanel token={token} data={data} onChange={load} />
              )}
              {section === "highlights" && (
                <HighlightsPanel token={token} data={data} onChange={load} />
              )}
              {section === "ads" && (
                <AdsPanel token={token} data={data} onChange={load} />
              )}
              {section === "faqs" && (
                <FaqsPanel token={token} data={data} onChange={load} />
              )}
              {section === "settings" && (
                <SettingsPanel token={token} data={data} onChange={load} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   OVERVIEW
   ═══════════════════════════════════════════════════════════ */
function OverviewPanel({ data }: { data: any }) {
  const counts = data?.counts || {};
  const cards = [
    { k: "news", label: "News", icon: "📰" },
    { k: "matches", label: "Matches", icon: "⚽" },
    { k: "team", label: "Team", icon: "👥" },
    { k: "products", label: "Products", icon: "🛍️" },
    { k: "sponsors", label: "Sponsors", icon: "🤝" },
    { k: "media", label: "Media", icon: "🖼️" },
    { k: "tickets", label: "Ticket Events", icon: "🎟️" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.k} className={cardCls + " text-center"}>
          <div className="text-2xl mb-1">{c.icon}</div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{c.label}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{counts[c.k] ?? 0}</p>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   NEWS
   ═══════════════════════════════════════════════════════════ */
function NewsPanel({
  token,
  data,
  onChange,
}: {
  token: string;
  data: any;
  onChange: () => void;
}) {
  const [draft, setDraft] = useState({
    slug: "",
    title: "",
    excerpt: "",
    contentHtml: "<p></p>",
    isFeatured: false,
    publishedAt: new Date().toISOString(),
  });
  const items = data?.items || [];

  const create = async () => {
    await apiJson("/admin/news", {
      method: "POST",
      token,
      body: { ...draft },
    });
    setDraft({
      slug: "",
      title: "",
      excerpt: "",
      contentHtml: "<p></p>",
      isFeatured: false,
      publishedAt: new Date().toISOString(),
    });
    onChange();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    await apiJson(`/admin/news/${id}`, { method: "DELETE", token });
    onChange();
  };

  const togglePublish = async (item: any) => {
    await apiJson(`/admin/news/${item.id}`, {
      method: "PUT",
      token,
      body: { publishedAt: item.publishedAt ? null : new Date().toISOString() },
    });
    onChange();
  };

  return (
    <div className="grid gap-6">
      {/* Create form */}
      <div className={cardCls}>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Create post</h3>
        <div className="grid gap-3">
          <input
            className={inputCls}
            placeholder="slug"
            value={draft.slug}
            onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="title"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="excerpt"
            value={draft.excerpt}
            onChange={(e) => setDraft((d) => ({ ...d, excerpt: e.target.value }))}
          />
          <textarea
            className={inputCls + " min-h-[80px] resize-y"}
            placeholder="contentHtml"
            value={draft.contentHtml}
            onChange={(e) => setDraft((d) => ({ ...d, contentHtml: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.isFeatured}
              onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
            />
            Featured
          </label>
        </div>
        <button onClick={create} className={btnPrimary + " mt-4"}>
          Create
        </button>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {items.map((n: any) => (
          <div
            key={n.id}
            className={cardCls + " flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"}
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold line-clamp-1 text-foreground">{n.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                /{n.slug} • {n.publishedAt ? "Published" : "Draft"}
              </div>
              <div className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {n.excerpt}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => togglePublish(n)} className={btnOutline}>
                {n.publishedAt ? "Unpublish" : "Publish"}
              </button>
              <button onClick={() => del(n.id)} className={btnDanger}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {!items.length && (
          <p className="text-sm text-muted-foreground">No posts yet.</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MATCHES
   ═══════════════════════════════════════════════════════════ */
function MatchesPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  const makeDraft = () => ({
    competition: "Premier League",
    matchType: "LEAGUE",
    season: "2025/26",
    kickoffAt: toDateTimeLocal(
      new Date(Date.now() + 7 * 86400000).toISOString()
    ),
    venue: "",
    isHome: true,
    opponent: "",
    opponentLogoId: "",
    homeScore: "",
    awayScore: "",
    status: "SCHEDULED",
  });

  const [draft, setDraft] = useState<any>(makeDraft());

  const resetForm = () => {
    setDraft(makeDraft());
    setEditingId(null);
    setLogoPreview("");
  };

  const uploadOpponentLogo = async (file: File) => {
    try {
      setUploadingLogo(true);
      const created = await uploadAndRegisterMedia(
        token,
        file,
        "matches/opponents",
        "IMAGE",
        file.name
      );
      setDraft((d: any) => ({ ...d, opponentLogoId: created.media.id }));
      setLogoPreview(created.publicUrl);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Opponent logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const create = async () => {
    try {
      setSaving(true);

      await apiJson("/admin/matches", {
        method: "POST",
        token,
        body: {
          competition: draft.competition,
          matchType: draft.matchType,
          season: draft.season,
          kickoffAt: toIsoOrNull(draft.kickoffAt),
          venue: draft.venue || null,
          isHome: !!draft.isHome,
          opponent: draft.opponent,
          opponentLogoId: draft.opponentLogoId || null,
          homeScore: draft.homeScore === "" ? null : Number(draft.homeScore),
          awayScore: draft.awayScore === "" ? null : Number(draft.awayScore),
          status: draft.status || "SCHEDULED",
        },
      });

      resetForm();
      onChange();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to create match");
    } finally {
      setSaving(false);
    }
  };

  const update = async () => {
    if (!editingId) return;

    try {
      setSaving(true);

      await apiJson(`/admin/matches/${editingId}`, {
        method: "PUT",
        token,
        body: {
          competition: draft.competition,
          matchType: draft.matchType,
          season: draft.season,
          kickoffAt: toIsoOrNull(draft.kickoffAt),
          venue: draft.venue || null,
          isHome: !!draft.isHome,
          opponent: draft.opponent,
          opponentLogoId: draft.opponentLogoId || null,
          homeScore: draft.homeScore === "" ? null : Number(draft.homeScore),
          awayScore: draft.awayScore === "" ? null : Number(draft.awayScore),
          status: draft.status || "SCHEDULED",
        },
      });

      resetForm();
      onChange();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to update match");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setDraft({
      competition: m.competition || "Premier League",
      matchType: m.matchType || "LEAGUE",
      season: m.season || "2025/26",
      kickoffAt: toDateTimeLocal(m.kickoffAt),
      venue: m.venue || "",
      isHome: !!m.isHome,
      opponent: m.opponent || "",
      opponentLogoId: m.opponentLogoId || "",
      homeScore: m.homeScore ?? "",
      awayScore: m.awayScore ?? "",
      status: m.status || "SCHEDULED",
    });
    setLogoPreview(
      m.opponentLogoUrl ||
        m?.opponentLogo?.publicUrl ||
        (m?.opponentLogo?.path ? mediaUrlFromKey(m.opponentLogo.path) : "") ||
        ""
    );
  };

  const del = async (id: string) => {
    if (!confirm("Delete match?")) return;
    await apiJson(`/admin/matches/${id}`, { method: "DELETE", token });
    if (editingId === id) resetForm();
    onChange();
  };

  return (
    <div className="grid gap-6">
      <div className={cardCls}>
        <h3 className="text-sm font-semibold text-foreground">
          {editingId ? "Edit match" : "Create match"}
        </h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className={inputCls}
            value={draft.competition}
            onChange={(e) => setDraft((d: any) => ({ ...d, competition: e.target.value }))}
            placeholder="competition"
          />
          <select
            className={inputCls}
            value={draft.matchType}
            onChange={(e) => setDraft((d: any) => ({ ...d, matchType: e.target.value }))}
          >
            <option value="LEAGUE">LEAGUE</option>
            <option value="CUP">CUP</option>
            <option value="FRIENDLY">FRIENDLY</option>
          </select>
          <input
            className={inputCls}
            value={draft.season}
            onChange={(e) => setDraft((d: any) => ({ ...d, season: e.target.value }))}
            placeholder="season"
          />
          <input
            type="datetime-local"
            className={inputCls}
            value={draft.kickoffAt}
            onChange={(e) => setDraft((d: any) => ({ ...d, kickoffAt: e.target.value }))}
          />
          <input
            className={inputCls}
            value={draft.venue}
            onChange={(e) => setDraft((d: any) => ({ ...d, venue: e.target.value }))}
            placeholder="venue"
          />
          <input
            className={inputCls}
            value={draft.opponent}
            onChange={(e) => setDraft((d: any) => ({ ...d, opponent: e.target.value }))}
            placeholder="opponent"
          />
          <input
            type="number"
            className={inputCls}
            value={draft.homeScore}
            onChange={(e) => setDraft((d: any) => ({ ...d, homeScore: e.target.value }))}
            placeholder="home score"
          />
          <input
            type="number"
            className={inputCls}
            value={draft.awayScore}
            onChange={(e) => setDraft((d: any) => ({ ...d, awayScore: e.target.value }))}
            placeholder="away score"
          />
          <select
            className={inputCls}
            value={draft.status}
            onChange={(e) => setDraft((d: any) => ({ ...d, status: e.target.value }))}
          >
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="LIVE">LIVE</option>
            <option value="FT">FT</option>
            <option value="POSTPONED">POSTPONED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.isHome}
              onChange={(e) => setDraft((d: any) => ({ ...d, isHome: e.target.checked }))}
            />
            Home match
          </label>
        </div>

        {/* Opponent logo upload */}
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">Opponent logo</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload logo, register in media, saves as{" "}
            <span className="font-mono">opponentLogoId</span>.
          </p>
          <div className="mt-3">
            <input
              type="file"
              accept="image/*"
              disabled={uploadingLogo}
              className="text-sm text-foreground/60"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadOpponentLogo(f);
              }}
            />
          </div>
          {uploadingLogo && (
            <p className="mt-2 text-xs text-muted-foreground animate-pulse">Uploading…</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground break-all">
            opponentLogoId: {draft.opponentLogoId || "—"}
          </p>
          {logoPreview && (
            <img
              src={logoPreview}
              alt="opponent logo"
              className="mt-3 h-16 w-16 rounded-lg object-contain bg-muted"
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {editingId ? (
            <>
              <button onClick={update} className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Update"}
              </button>
              <button onClick={resetForm} className={btnOutline}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={create} className={btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Create"}
            </button>
          )}
        </div>
      </div>

      {/* Match list */}
      <div className="grid gap-3">
        {items.map((m: any) => {
          const preview =
            m.opponentLogoUrl ||
            m?.opponentLogo?.publicUrl ||
            (m?.opponentLogo?.path ? mediaUrlFromKey(m.opponentLogo.path) : null);
          return (
            <div
              key={m.id}
              className={cardCls + " flex flex-col sm:flex-row gap-3"}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {preview ? (
                  <img
                    src={preview}
                    alt={m.opponent}
                    className="h-10 w-10 rounded-lg object-contain bg-muted shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {m.isHome ? "HOME" : "AWAY"} vs {m.opponent}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.kickoffAt
                      ? new Date(m.kickoffAt).toLocaleString()
                      : "No kickoff date"}{" "}
                    • {m.competition} • {m.matchType || "—"} • {m.season}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {m.venue || "Venue TBA"} • {m.status || "SCHEDULED"}
                  </p>
                  <p className="text-xs text-foreground/60 mt-0.5">
                    Score: {m.homeScore ?? "-"} : {m.awayScore ?? "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(m)} className={btnOutline}>
                  Edit
                </button>
                <button onClick={() => del(m.id)} className={btnDanger}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {!items.length && (
          <p className="text-sm text-muted-foreground">No matches yet.</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TEAM
   ═══════════════════════════════════════════════════════════ */
function TeamPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [portraitPreview, setPortraitPreview] = useState("");

  const emptyDraft = {
    slug: "",
    fullName: "",
    jerseyNo: "",
    position: "ST",
    team: "Men's First Team",
    isStaff: false,
    portraitId: "",
  };

  const [draft, setDraft] = useState<any>(emptyDraft);

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setPortraitPreview("");
  };

  const uploadPortrait = async (file: File) => {
    try {
      setUploadingPortrait(true);
      const created = await uploadAndRegisterMedia(token, file, "team", "IMAGE", file.name);
      setDraft((d: any) => ({ ...d, portraitId: created.media.id }));
      setPortraitPreview(created.publicUrl);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Portrait upload failed");
    } finally {
      setUploadingPortrait(false);
    }
  };

  const create = async () => {
    try {
      setSaving(true);

      await apiJson("/admin/team", {
        method: "POST",
        token,
        body: {
          ...draft,
          jerseyNo: draft.jerseyNo || null,
          portraitId: draft.portraitId || null,
        },
      });

      resetForm();
      onChange();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to create member");
    } finally {
      setSaving(false);
    }
  };

  const update = async () => {
    if (!editingId) return;

    try {
      setSaving(true);

      await apiJson(`/admin/team/${editingId}`, {
        method: "PUT",
        token,
        body: {
          ...draft,
          jerseyNo: draft.jerseyNo || null,
          portraitId: draft.portraitId || null,
        },
      });

      resetForm();
      onChange();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to update member");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (m: any) => {
    setEditingId(m.id);
    setDraft({
      slug: m.slug || "",
      fullName: m.fullName || "",
      jerseyNo: m.jerseyNo || "",
      position: m.position || "ST",
      team: m.team || "Men's First Team",
      isStaff: !!m.isStaff,
      portraitId: m.portraitId || "",
    });
    setPortraitPreview(m.portraitUrl || "");
  };

  const del = async (id: string) => {
    if (!confirm("Delete member?")) return;
    await apiJson(`/admin/team/${id}`, { method: "DELETE", token });
    if (editingId === id) resetForm();
    onChange();
  };

  return (
    <div className="grid gap-6">
      <div className={cardCls}>
        <h3 className="text-sm font-semibold text-foreground">
          {editingId ? "Edit member" : "Add member"}
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="slug" value={draft.slug} onChange={(e) => setDraft((d: any) => ({ ...d, slug: e.target.value }))} />
          <input className={inputCls} placeholder="full name" value={draft.fullName} onChange={(e) => setDraft((d: any) => ({ ...d, fullName: e.target.value }))} />
          <input className={inputCls} placeholder="jersey #" value={draft.jerseyNo} onChange={(e) => setDraft((d: any) => ({ ...d, jerseyNo: e.target.value }))} />
          <input className={inputCls} placeholder="position" value={draft.position} onChange={(e) => setDraft((d: any) => ({ ...d, position: e.target.value }))} />
          <input className={inputCls} placeholder="team" value={draft.team} onChange={(e) => setDraft((d: any) => ({ ...d, team: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={draft.isStaff} onChange={(e) => setDraft((d: any) => ({ ...d, isStaff: e.target.checked }))} />
            Staff
          </label>
        </div>

        {/* Portrait upload */}
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">Portrait</p>
          <p className="mt-1 text-xs text-muted-foreground">Upload portrait, register in media, saves as portraitId.</p>
          <div className="mt-3">
            <input type="file" accept="image/*" disabled={uploadingPortrait} className="text-sm text-foreground/60" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPortrait(f); }} />
          </div>
          {uploadingPortrait && <p className="mt-2 text-xs text-muted-foreground animate-pulse">Uploading…</p>}
          <p className="mt-2 text-xs text-muted-foreground break-all">portraitId: {draft.portraitId || "—"}</p>
          {portraitPreview && (
            <img src={portraitPreview} alt="portrait" className="mt-3 h-20 w-20 rounded-xl object-cover bg-muted" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {editingId ? (
            <>
              <button onClick={update} className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Update"}
              </button>
              <button onClick={resetForm} className={btnOutline}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={create} className={btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Create"}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {items.map((m: any) => (
          <div key={m.id} className={cardCls + " flex flex-col sm:flex-row gap-3"}>
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {m.portraitUrl ? (
                <img src={m.portraitUrl} alt={m.fullName} className="h-12 w-12 rounded-xl object-cover bg-muted shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {m.fullName} {m.jerseyNo ? `#${m.jerseyNo}` : ""}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {m.isStaff ? "Staff" : m.team} • {m.position} • /{m.slug}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => startEdit(m)} className={btnOutline}>Edit</button>
              <button onClick={() => del(m.id)} className={btnDanger}>Delete</button>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">No team members yet.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PRODUCTS
   ═══════════════════════════════════════════════════════════ */
function ProductsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [uploadingHero, setUploadingHero] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [heroPreview, setHeroPreview] = useState("");

  const emptyDraft = {
    slug: "",
    title: "",
    description: "",
    price: 0,
    currency: "KES",
    isActive: true,
    heroMediaId: "",
  };

  const [draft, setDraft] = useState<any>(emptyDraft);

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setHeroPreview("");
  };

  const uploadHeroImage = async (file: File) => {
    try {
      setUploadingHero(true);
      const created = await uploadAndRegisterMedia(token, file, "products", "IMAGE", file.name);
      setDraft((d: any) => ({ ...d, heroMediaId: created.media.id }));
      setHeroPreview(created.publicUrl);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Hero image upload failed");
    } finally {
      setUploadingHero(false);
    }
  };

  const create = async () => {
    try {
      setSaving(true);

      await apiJson("/admin/products", {
        method: "POST",
        token,
        body: {
          ...draft,
          description: draft.description || null,
          price: Number(draft.price) || 0,
          heroMediaId: draft.heroMediaId || null,
        },
      });

      resetForm();
      onChange();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const update = async () => {
    if (!editingId) return;

    try {
      setSaving(true);

      await apiJson(`/admin/products/${editingId}`, {
        method: "PUT",
        token,
        body: {
          ...draft,
          description: draft.description || null,
          price: Number(draft.price) || 0,
          heroMediaId: draft.heroMediaId || null,
        },
      });

      resetForm();
      onChange();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setDraft({
      slug: p.slug || "",
      title: p.title || "",
      description: p.description || "",
      price: p.price ?? 0,
      currency: p.currency || "KES",
      isActive: !!p.isActive,
      heroMediaId: p.heroMediaId || "",
    });
    setHeroPreview(
      p?.heroMedia?.publicUrl ||
        (p?.heroMedia?.path ? mediaUrlFromKey(p.heroMedia.path) : "") ||
        ""
    );
  };

  const del = async (id: string) => {
    if (!confirm("Delete product?")) return;
    await apiJson(`/admin/products/${id}`, { method: "DELETE", token });
    if (editingId === id) resetForm();
    onChange();
  };

  return (
    <div className="grid gap-6">
      <div className={cardCls}>
        <h3 className="text-sm font-semibold text-foreground">
          {editingId ? "Edit product" : "Add product"}
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="slug" value={draft.slug} onChange={(e) => setDraft((d: any) => ({ ...d, slug: e.target.value }))} />
          <input className={inputCls} placeholder="title" value={draft.title} onChange={(e) => setDraft((d: any) => ({ ...d, title: e.target.value }))} />
          <input className={inputCls} placeholder="description" value={draft.description} onChange={(e) => setDraft((d: any) => ({ ...d, description: e.target.value }))} />
          <input className={inputCls} placeholder="price" type="number" value={draft.price} onChange={(e) => setDraft((d: any) => ({ ...d, price: Number(e.target.value) || 0 }))} />
          <input className={inputCls} placeholder="currency" value={draft.currency} onChange={(e) => setDraft((d: any) => ({ ...d, currency: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
            <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((d: any) => ({ ...d, isActive: e.target.checked }))} />
            Active
          </label>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm font-semibold text-foreground">Hero product image</p>
          <p className="mt-1 text-xs text-muted-foreground">Upload image, register in media, saves as heroMediaId.</p>
          <div className="mt-3">
            <input type="file" accept="image/*" disabled={uploadingHero} className="text-sm text-foreground/60" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadHeroImage(f); }} />
          </div>
          {uploadingHero && <p className="mt-2 text-xs text-muted-foreground animate-pulse">Uploading…</p>}
          <p className="mt-2 text-xs text-muted-foreground break-all">heroMediaId: {draft.heroMediaId || "—"}</p>
          {heroPreview && (
            <img src={heroPreview} alt="hero" className="mt-3 h-20 w-20 rounded-xl object-cover bg-muted" />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {editingId ? (
            <>
              <button onClick={update} className={btnPrimary} disabled={saving}>
                {saving ? "Saving…" : "Update"}
              </button>
              <button onClick={resetForm} className={btnOutline}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={create} className={btnPrimary} disabled={saving}>
              {saving ? "Saving…" : "Create"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((p: any) => {
          const preview =
            p?.heroMedia?.publicUrl ||
            (p?.heroMedia?.path
              ? `${MEDIA_BASE}/${String(p.heroMedia.path).replace(/^\/+/g, "")}`
              : null);
          return (
            <div key={p.id} className={cardCls + " flex flex-col sm:flex-row gap-3"}>
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {preview ? (
                  <img src={preview} alt={p.title} className="h-12 w-12 rounded-xl object-cover bg-muted shrink-0" />
                ) : (
                  <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    /{p.slug} • {p.price} {p.currency} • {p.isActive ? "Active" : "Hidden"}
                  </p>
                  {p.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(p)} className={btnOutline}>Edit</button>
                <button onClick={() => del(p.id)} className={btnDanger}>Delete</button>
              </div>
            </div>
          );
        })}
        {!items.length && <p className="text-sm text-muted-foreground">No products yet.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SPONSORS
   ═══════════════════════════════════════════════════════════ */
function SponsorsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [draft, setDraft] = useState({
    name: "",
    tier: "Official Partner",
    website: "",
    sort: 0,
    isActive: true,
  });

  const create = async () => {
    await apiJson("/admin/sponsors", {
      method: "POST",
      token,
      body: { ...draft, website: draft.website || null },
    });
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
      <div className={cardCls}>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Add sponsor</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="name" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          <input className={inputCls} placeholder="tier" value={draft.tier} onChange={(e) => setDraft((d) => ({ ...d, tier: e.target.value }))} />
          <input className={inputCls + " sm:col-span-2"} placeholder="website" value={draft.website} onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))} />
        </div>
        <button onClick={create} className={btnPrimary + " mt-4"}>Create</button>
      </div>

      <div className="grid gap-3">
        {items.map((s: any) => (
          <div key={s.id} className={cardCls + " flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{s.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.tier} • {s.website || "—"}</p>
            </div>
            <button onClick={() => del(s.id)} className={btnDanger}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MEDIA
   ═══════════════════════════════════════════════════════════ */
function MediaPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [folder, setFolder] = useState("images");
  const [type, setType] = useState<"IMAGE" | "VIDEO" | "DOC">("IMAGE");
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const mediaUrl = (key?: string) => {
    if (!key) return "#";
    return `${MEDIA_BASE}/${String(key).replace(/^\/+/g, "")}`;
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const form = new FormData();
      form.append("folder", folder);
      form.append("file", file);

      const up = await apiUpload<{
        key: string;
        publicUrl: string;
        mimeType: string;
        bytes: number;
        filename: string;
      }>("/uploads/upload", { token, form });

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
      if (fileRef.current) fileRef.current.value = "";
      onChange();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete media item?")) return;
    await apiJson(`/admin/media/${id}`, { method: "DELETE", token });
    onChange();
  };

  return (
    <div className="grid gap-6">
      <div className={cardCls}>
        <h3 className="text-sm font-semibold text-foreground">Upload Media</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Uploads are sent to the S3/MinIO bucket. The DB stores only the object key/path.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <input className={inputCls} placeholder="folder" value={folder} onChange={(e) => setFolder(e.target.value)} />
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="IMAGE">IMAGE</option>
            <option value="VIDEO">VIDEO</option>
            <option value="DOC">DOC</option>
          </select>
          <input className={inputCls} placeholder="title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="mt-4">
          <input
            ref={fileRef}
            type="file"
            className="text-sm text-foreground/60"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadFile(f);
            }}
          />
        </div>
        {uploading && <p className="mt-3 text-xs text-muted-foreground animate-pulse">Uploading to media bucket…</p>}
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((m: any) => {
          const url = m.publicUrl || mediaUrl(m.path);
          const isImage = m.type === "IMAGE" || m.mimeType?.startsWith("image/");
          return (
            <div key={m.id} className={cardCls + " flex flex-col gap-2"}>
              {isImage ? (
                <img
                  src={url}
                  alt={m.title || m.path}
                  className="w-full h-28 object-cover rounded-lg bg-muted"
                />
              ) : (
                <div className="w-full h-28 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">
                  {m.type}
                </div>
              )}
              <p className="text-xs font-medium line-clamp-1 text-foreground">{m.title || m.path}</p>
              <p className="text-[10px] text-muted-foreground break-all line-clamp-1">{m.path}</p>
              <button onClick={() => del(m.id)} className={btnDanger + " mt-auto text-xs"}>
                Delete
              </button>
            </div>
          );
        })}
      </div>
      {!items.length && <p className="text-sm text-muted-foreground">No media yet.</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HIGHLIGHTS
   ═══════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════
   HIGHLIGHTS
   ═══════════════════════════════════════════════════════════ */
function HighlightsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [saving, setSaving] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");

  const emptyDraft = {
    title: "",
    videoUrl: "",
    matchId: "",
    thumbnailId: "",
    videoMediaId: "",
  };

  const [draft, setDraft] = useState<any>(emptyDraft);

  const resetForm = () => {
    setDraft(emptyDraft);
    setEditingId(null);
    setThumbPreview("");
    setVideoPreview("");
  };

  const uploadThumbnail = async (file: File) => {
    try {
      setUploadingThumb(true);
      const created = await uploadAndRegisterMedia(
        token,
        file,
        "highlights/thumbnails",
        "IMAGE",
        file.name
      );
      setDraft((d: any) => ({ ...d, thumbnailId: created.media.id }));
      setThumbPreview(created.publicUrl);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Thumbnail upload failed");
    } finally {
      setUploadingThumb(false);
    }
  };

  const uploadVideo = async (file: File) => {
    try {
      setUploadingVideo(true);
      const created = await uploadAndRegisterMedia(
        token,
        file,
        "highlights/videos",
        "VIDEO",
        file.name
      );
      setDraft((d: any) => ({ ...d, videoMediaId: created.media.id, videoUrl: created.publicUrl }));
      setVideoPreview(created.publicUrl);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Video upload failed");
    } finally {
      setUploadingVideo(false);
    }
  };

  const create = async () => {
    try {
      setSaving(true);
      await apiJson("/admin/highlights", {
        method: "POST",
        token,
        body: {
          title: draft.title,
          videoUrl: draft.videoUrl || null,
          matchId: draft.matchId || null,
          thumbnailId: draft.thumbnailId || null,
          videoMediaId: draft.videoMediaId || null,
        },
      });
      resetForm();
      onChange();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to create highlight");
    } finally {
      setSaving(false);
    }
  };

  const update = async () => {
    if (!editingId) return;
    try {
      setSaving(true);
      await apiJson(`/admin/highlights/${editingId}`, {
        method: "PUT",
        token,
        body: {
          title: draft.title,
          videoUrl: draft.videoUrl || null,
          matchId: draft.matchId || null,
          thumbnailId: draft.thumbnailId || null,
          videoMediaId: draft.videoMediaId || null,
        },
      });
      resetForm();
      onChange();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to update highlight");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (h: any) => {
    setEditingId(h.id);
    setDraft({
      title: h.title || "",
      videoUrl: h.videoUrl || "",
      matchId: h.matchId || "",
      thumbnailId: h.thumbnailId || "",
      videoMediaId: h.videoMediaId || "",
    });
    setThumbPreview(
      h.thumbnailUrl ||
        h?.thumbnail?.publicUrl ||
        (h?.thumbnail?.path ? mediaUrlFromKey(h.thumbnail.path) : "") ||
        ""
    );
    setVideoPreview(
      h.videoMediaUrl ||
        h?.videoMedia?.publicUrl ||
        (h?.videoMedia?.path ? mediaUrlFromKey(h.videoMedia.path) : "") ||
        ""
    );
  };

  const del = async (id: string) => {
    if (!confirm("Delete highlight?")) return;
    await apiJson(`/admin/highlights/${id}`, { method: "DELETE", token });
    if (editingId === id) resetForm();
    onChange();
  };

  return (
    <div className="grid gap-6">
      <div className={cardCls}>
        <h3 className="text-sm font-semibold mb-3 text-foreground">
          {editingId ? "Edit highlight" : "Add highlight"}
        </h3>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className={inputCls}
            placeholder="title"
            value={draft.title}
            onChange={(e) => setDraft((d: any) => ({ ...d, title: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="video URL (YouTube, etc.)"
            value={draft.videoUrl}
            onChange={(e) => setDraft((d: any) => ({ ...d, videoUrl: e.target.value }))}
          />
          <input
            className={inputCls + " sm:col-span-2"}
            placeholder="match ID (optional)"
            value={draft.matchId}
            onChange={(e) => setDraft((d: any) => ({ ...d, matchId: e.target.value }))}
          />
        </div>

        {/* Thumbnail upload */}
        <div className="mt-5 rounded-2xl border border-input bg-muted/30 p-4">
          <div className="text-sm font-semibold text-foreground">Thumbnail</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Upload a thumbnail image for this highlight.
          </div>
          <div className="mt-4">
            <input
              type="file"
              accept="image/*"
              disabled={uploadingThumb}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadThumbnail(f);
              }}
            />
          </div>
          {uploadingThumb ? (
            <div className="mt-3 text-xs text-muted-foreground">Uploading thumbnail...</div>
          ) : null}
          <div className="mt-3 text-xs text-muted-foreground break-all">
            thumbnailId: {draft.thumbnailId || "—"}
          </div>
          {thumbPreview ? (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbPreview}
                alt="Thumbnail preview"
                className="h-24 w-auto rounded-lg object-cover border border-input"
              />
            </div>
          ) : null}
        </div>

        {/* Video upload */}
        <div className="mt-4 rounded-2xl border border-input bg-muted/30 p-4">
          <div className="text-sm font-semibold text-foreground">Video file</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Upload a video file directly, or use the video URL field above for YouTube/external links.
          </div>
          <div className="mt-4">
            <input
              type="file"
              accept="video/*"
              disabled={uploadingVideo}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadVideo(f);
              }}
            />
          </div>
          {uploadingVideo ? (
            <div className="mt-3 text-xs text-muted-foreground">Uploading video...</div>
          ) : null}
          <div className="mt-3 text-xs text-muted-foreground break-all">
            videoMediaId: {draft.videoMediaId || "—"}
          </div>
          {videoPreview ? (
            <div className="mt-4">
              <video
                src={videoPreview}
                controls
                className="h-32 w-auto rounded-lg border border-input"
              />
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {editingId ? (
            <>
              <button onClick={update} className={btnPrimary} disabled={saving}>
                {saving ? "Saving..." : "Update"}
              </button>
              <button onClick={resetForm} className={btnOutline}>
                Cancel
              </button>
            </>
          ) : (
            <button onClick={create} className={btnPrimary} disabled={saving}>
              {saving ? "Saving..." : "Create"}
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {items.map((h: any) => {
          const tPreview =
            h.thumbnailUrl ||
            h?.thumbnail?.publicUrl ||
            (h?.thumbnail?.path ? mediaUrlFromKey(h.thumbnail.path) : null);

          return (
            <div
              key={h.id}
              className={cardCls + " flex flex-col sm:flex-row sm:items-start gap-4"}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {tPreview ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={tPreview}
                    alt={h.title || "Thumbnail"}
                    className="h-16 w-24 rounded-lg object-cover border border-input flex-shrink-0"
                  />
                ) : (
                  <div className="h-16 w-24 rounded-lg bg-muted/50 border border-input flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">
                    No thumb
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 break-all line-clamp-1">
                    {h.videoUrl || "No video URL"}
                  </p>
                  {h.matchId ? (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Match: {h.matchId}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => startEdit(h)} className={btnOutline}>
                  Edit
                </button>
                <button onClick={() => del(h.id)} className={btnDanger}>
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        {!items.length && (
          <p className="text-sm text-muted-foreground">No highlights yet.</p>
        )}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ADS / BANNERS
   ═══════════════════════════════════════════════════════════ */
function AdsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [draft, setDraft] = useState({ title: "", imageUrl: "", linkUrl: "", placement: "homepage-hero", isActive: true });

  const create = async () => {
    await apiJson("/admin/ads", {
      method: "POST",
      token,
      body: { ...draft, linkUrl: draft.linkUrl || null },
    });
    setDraft({ title: "", imageUrl: "", linkUrl: "", placement: "homepage-hero", isActive: true });
    onChange();
  };

  const del = async (id: string) => {
    if (!confirm("Delete ad?")) return;
    await apiJson(`/admin/ads/${id}`, { method: "DELETE", token });
    onChange();
  };

  return (
    <div className="grid gap-6">
      <div className={cardCls}>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Add Ad / Banner</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <input className={inputCls} placeholder="image URL" value={draft.imageUrl} onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))} />
          <input className={inputCls} placeholder="link URL (optional)" value={draft.linkUrl} onChange={(e) => setDraft((d) => ({ ...d, linkUrl: e.target.value }))} />
          <input className={inputCls} placeholder="placement (e.g. homepage-hero)" value={draft.placement} onChange={(e) => setDraft((d) => ({ ...d, placement: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
            <input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))} />
            Active
          </label>
        </div>
        <button onClick={create} className={btnPrimary + " mt-4"}>Create</button>
      </div>

      <div className="grid gap-3">
        {items.map((a: any) => (
          <div key={a.id} className={cardCls + " flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"}>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{a.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{a.placement} • {a.isActive ? "Active" : "Hidden"}</p>
            </div>
            <button onClick={() => del(a.id)} className={btnDanger}>Delete</button>
          </div>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">No ads yet.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   FAQS
   ═══════════════════════════════════════════════════════════ */
function FaqsPanel({ token, data, onChange }: any) {
  const items = data?.items || [];
  const [draft, setDraft] = useState({ question: "", answer: "", sort: 0 });

  const create = async () => {
    await apiJson("/admin/faqs", { method: "POST", token, body: draft });
    setDraft({ question: "", answer: "", sort: 0 });
    onChange();
  };

  const del = async (id: string) => {
    if (!confirm("Delete FAQ?")) return;
    await apiJson(`/admin/faqs/${id}`, { method: "DELETE", token });
    onChange();
  };

  return (
    <div className="grid gap-6">
      <div className={cardCls}>
        <h3 className="text-sm font-semibold mb-3 text-foreground">Add FAQ</h3>
        <div className="grid gap-3">
          <input className={inputCls} placeholder="question" value={draft.question} onChange={(e) => setDraft((d) => ({ ...d, question: e.target.value }))} />
          <textarea className={inputCls + " min-h-[80px] resize-y"} placeholder="answer" value={draft.answer} onChange={(e) => setDraft((d) => ({ ...d, answer: e.target.value }))} />
        </div>
        <button onClick={create} className={btnPrimary + " mt-4"}>Create</button>
      </div>

      <div className="grid gap-3">
        {items.map((f: any) => (
          <div key={f.id} className={cardCls + " flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{f.question}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{f.answer}</p>
            </div>
            <button onClick={() => del(f.id)} className={btnDanger + " shrink-0"}>Delete</button>
          </div>
        ))}
        {!items.length && <p className="text-sm text-muted-foreground">No FAQs yet.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SETTINGS
   ═══════════════════════════════════════════════════════════ */
function SettingsPanel({ token, data, onChange }: any) {
  const settings = data?.settings || {};
  const [draft, setDraft] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({ ...settings });
  }, [data]);

  const save = async () => {
    try {
      setSaving(true);
      await apiJson("/admin/settings", { method: "PUT", token, body: draft });
      onChange();
    } catch (err: any) {
      alert(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: "clubName", label: "Club Name" },
    { key: "tagline", label: "Tagline" },
    { key: "logoUrl", label: "Logo URL" },
    { key: "partnerName", label: "Partner Name" },
    { key: "partnerLogoUrl", label: "Partner Logo URL" },
    { key: "ticketsUrl", label: "Tickets URL" },
    { key: "membershipUrl", label: "Membership URL" },
    { key: "shopUrl", label: "Shop URL" },
  ];

  return (
    <div className={cardCls}>
      <h3 className="text-sm font-semibold mb-4 text-foreground">Site Settings</h3>
      <div className="grid gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
            <input
              className={inputCls}
              value={draft[f.key] || ""}
              onChange={(e) => setDraft((d: any) => ({ ...d, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <button onClick={save} className={btnPrimary + " mt-6"} disabled={saving}>
        {saving ? "Saving…" : "Save Settings"}
      </button>
    </div>
  );
}
