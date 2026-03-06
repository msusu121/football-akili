"use client";

import React, { useEffect, useMemo, useState } from "react";

type Mode = "COUNTDOWN" | "LIVE" | "FT";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hrs = Math.floor((total % 86400) / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (days > 0) return `${days}d ${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function MatchClock({
  kickoffISO,
  status,
  liveWindowMinutes = 135, // fallback if no live feed
}: {
  kickoffISO: string;
  status?: string | null;
  liveWindowMinutes?: number;
}) {
  const kickoffMs = useMemo(() => new Date(kickoffISO).getTime(), [kickoffISO]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const statusNorm = String(status || "").toUpperCase();

  const mode: Mode = useMemo(() => {
    if (statusNorm === "FT" || statusNorm === "FULL_TIME") return "FT";
    if (statusNorm === "LIVE" || statusNorm === "IN_PROGRESS") return "LIVE";

    if (now < kickoffMs) return "COUNTDOWN";
    const liveEnd = kickoffMs + liveWindowMinutes * 60 * 1000;
    if (now >= kickoffMs && now <= liveEnd) return "LIVE";
    return "FT";
  }, [statusNorm, now, kickoffMs, liveWindowMinutes]);

  const pillBase =
    "inline-flex items-center gap-2 bg-black/35 border border-white/25 rounded-sm " +
    "px-3 py-1.5 sm:px-4 sm:py-2";

  if (mode === "COUNTDOWN") {
    const ms = kickoffMs - now;
    return (
      <div className={pillBase}>
        <span className="text-white/85 text-[10px] sm:text-[11px] font-extrabold tracking-[0.18em] uppercase">
          KO IN
        </span>
        <span className="text-white font-extrabold text-[11px] sm:text-[13px] tracking-[0.12em] tabular-nums">
          {formatCountdown(ms)}
        </span>
      </div>
    );
  }

  if (mode === "LIVE") {
    return (
      <div className={pillBase}>
        <span className="inline-flex items-center gap-2 text-white font-extrabold text-[11px] sm:text-[12px] tracking-[0.18em] uppercase">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          LIVE
        </span>
      </div>
    );
  }

  return (
    <div className={pillBase}>
      <span className="text-white font-extrabold text-[11px] sm:text-[12px] tracking-[0.18em] uppercase">
        FT
      </span>
    </div>
  );
}