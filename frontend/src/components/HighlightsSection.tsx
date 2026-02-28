"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Play } from "lucide-react";

type Highlight = {
  id: string | number;
  title: string;
  subtitle?: string | null;
  videoUrl: string;
  publishedAt?: string | null;
  durationSec?: number | null;
  thumbnail?: { url?: string | null } | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function dur(sec?: number | null) {
  if (sec === null || sec === undefined) return "";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Try to extract score like "2-3" from title
function extractScore(title?: string | null) {
  if (!title) return "";
  const m = title.match(/(\d+)\s*-\s*(\d+)/);
  return m ? `${m[1]}-${m[2]}` : "";
}

export function HighlightsSection({ highlights }: { highlights: Highlight[] }) {
  const list = Array.isArray(highlights) ? highlights : [];

  const [selectedId, setSelectedId] = useState<string | number | null>(
    list?.[0]?.id ?? null
  );

  const main = useMemo(() => {
    if (!list.length) return null;
    return list.find((h) => h.id === selectedId) ?? list[0];
  }, [list, selectedId]);

  const recent = useMemo(() => {
    if (!list.length || !main) return [];
    return list.filter((h) => h.id !== main.id).slice(0, 3);
  }, [list, main]);

  // Avoid hydration mismatch for "x minutes ago"
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => setNow(Date.now()), []);

  function relTime(d?: string | null) {
    if (!d) return "";
    if (!now) return fmtDate(d); // server render fallback
    const ms = now - new Date(d).getTime();
    const min = Math.floor(ms / 60000);
    if (min < 60) return `about ${min} minutes ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `about ${hr} hours ago`;
    const day = Math.floor(hr / 24);
    return `${day} days ago`;
  }

  const [open, setOpen] = useState(false);

  if (!main) return null;

  const mainScore = extractScore(main.title);

  return (
    <section className="dark-section">
      <div className="mx-auto max-w-[1180px] px-4 py-14">
        {/* Title */}
        <div className="text-3xl font-extrabold text-white">
          Latest Highlights
          <div className="mt-2 h-[3px] w-12 bg-brand rounded-full" />
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-12">
          {/* Main highlight (poster style) */}
          <div className="md:col-span-8">
            <div className="rounded-[22px] overflow-hidden border border-white/10 bg-white/5 shadow-[0_18px_60px_rgba(0,0,0,.35)]">
              {/* Poster */}
              <div className="relative aspect-video bg-black/30">
                {main.thumbnail?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={main.thumbnail.url}
                    alt={main.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/0" />
                )}

                {/* overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                {/* centered play */}
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  className="absolute inset-0 grid place-items-center focus:outline-none"
                  aria-label="Play highlight"
                >
                  <div className="h-14 w-14 rounded-full bg-black/35 backdrop-blur-md border border-white/20 grid place-items-center shadow-lg hover:scale-[1.03] active:scale-[0.99] transition">
                    <Play className="h-6 w-6 text-white ml-0.5" fill="currentColor" />
                  </div>
                </button>

                {/* duration bottom-left */}
                {main.durationSec ? (
                  <div className="absolute bottom-3 left-3 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                    {dur(main.durationSec)}
                  </div>
                ) : null}

                {/* time badge bottom-right */}
                {main.publishedAt ? (
                  <div className="absolute bottom-3 right-3 rounded-full bg-emerald-500/15 border border-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-50">
                    {relTime(main.publishedAt)}
                  </div>
                ) : null}
              </div>

              {/* Title row */}
              <div className="px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="h-serif text-white font-extrabold text-2xl md:text-3xl leading-tight">
                      {main.title}
                    </div>
                    <div className="mt-3 text-xs font-bold tracking-[0.18em] text-brand uppercase">
                      {main.subtitle || "HIGHLIGHTS"}
                    </div>
                  </div>

                  {/* optional score pill (like screenshot) */}
                  {mainScore ? (
                    <div className="shrink-0 rounded-full bg-brand/15 border border-brand/25 px-3 py-1 text-xs font-extrabold text-brand">
                      {mainScore}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Most recent */}
          <div className="md:col-span-4">
            <div className="text-xs font-extrabold tracking-[0.2em] text-white/70">
              MOST RECENT
            </div>
            <div className="mt-4 h-px bg-white/10" />

            <div className="mt-5 space-y-4">
              {recent.map((h) => {
                const score = extractScore(h.title);
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setSelectedId(h.id)}
                    className={[
                      "w-full text-left rounded-[18px] border border-white/10 bg-white/5",
                      "hover:bg-white/10 transition shadow-sm overflow-hidden",
                      selectedId === h.id ? "ring-1 ring-brand/40" : "",
                    ].join(" ")}
                  >
                    <div className="grid grid-cols-[120px_1fr] gap-4 p-4">
                      {/* thumb */}
                      <div className="relative rounded-xl overflow-hidden bg-black/30 h-[72px]">
                        {h.thumbnail?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={h.thumbnail.url}
                            alt={h.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : null}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                        {/* play bubble */}
                        <div className="absolute inset-0 grid place-items-center">
                          <div className="h-8 w-8 rounded-full bg-brand/90 grid place-items-center shadow">
                            <Play className="h-4 w-4 text-black ml-0.5" fill="currentColor" />
                          </div>
                        </div>

                        {/* duration bottom-right */}
                        {h.durationSec ? (
                          <div className="absolute bottom-2 right-2 rounded-md bg-black/75 px-2 py-1 text-[10px] font-semibold text-white">
                            {dur(h.durationSec)}
                          </div>
                        ) : null}
                      </div>

                      {/* text */}
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          {score ? (
                            <div className="text-[11px] font-extrabold text-brand">
                              {score}
                            </div>
                          ) : (
                            <div className="text-[11px] font-extrabold text-white/50">
                              &nbsp;
                            </div>
                          )}
                        </div>

                        <div className="mt-1 text-sm font-extrabold leading-snug text-white line-clamp-2">
                          {h.title}
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-white/55">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="uppercase">{relTime(h.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <a
                href={main?.videoUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-extrabold tracking-[0.2em] text-white/70 hover:text-white transition inline-flex items-center gap-3"
              >
                MORE VIDEOS{" "}
                <span className="h-10 w-10 rounded-full border border-white/20 grid place-items-center">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Modal player */}
        {open ? (
          <div
            className="fixed inset-0 z-[999] bg-black/70 backdrop-blur-sm grid place-items-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-4xl rounded-2xl overflow-hidden border border-white/15 bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="text-white font-extrabold line-clamp-1">
                  {main.title}
                </div>
                <button
                  className="text-white/70 hover:text-white font-extrabold"
                  onClick={() => setOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="relative aspect-video bg-black">
                <video
                  className="w-full h-full"
                  controls
                  playsInline
                  autoPlay
                  preload="metadata"
                  poster={main.thumbnail?.url || undefined}
                  src={main.videoUrl}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}