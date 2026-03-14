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

function parseKickoffMs(raw?: string | null) {
  if (!raw) return NaN;

  const s = String(raw).trim();
  if (!s) return NaN;

  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : NaN;
}

export function MatchClock({
  kickoffISO,
  status,
  liveWindowMinutes = 135,
}: {
  kickoffISO: string;
  status?: string | null;
  liveWindowMinutes?: number;
}) {
  const kickoffMs = useMemo(() => parseKickoffMs(kickoffISO), [kickoffISO]);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());

    const t = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(t);
  }, []);

  const statusNorm = String(status || "").toUpperCase();

  const pillBase =
    "inline-flex items-center gap-2 bg-black/35 border border-white/25 rounded-sm " +
    "px-3 py-1.5 sm:px-4 sm:py-2";

  if (!Number.isFinite(kickoffMs)) {
    return (
      <div className={pillBase}>
        <span className="text-white font-extrabold text-[11px] sm:text-[12px] tracking-[0.18em] uppercase">
          TBC
        </span>
      </div>
    );
  }

  // Prevent hydration mismatch: render stable placeholder first
  if (now === null) {
    if (statusNorm === "FT" || statusNorm === "FULL_TIME") {
      return (
        <div className={pillBase}>
          <span className="text-white font-extrabold text-[11px] sm:text-[12px] tracking-[0.18em] uppercase">
            FT
          </span>
        </div>
      );
    }

    if (statusNorm === "LIVE" || statusNorm === "IN_PROGRESS") {
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
        <span className="text-white font-extrabold text-[11px] sm:text-[13px] tracking-[0.12em] tabular-nums">
          --:--:--
        </span>
      </div>
    );
  }

  let mode: Mode = "FT";

  if (statusNorm === "FT" || statusNorm === "FULL_TIME") {
    mode = "FT";
  } else if (statusNorm === "LIVE" || statusNorm === "IN_PROGRESS") {
    mode = "LIVE";
  } else if (now < kickoffMs) {
    mode = "COUNTDOWN";
  } else {
    const liveEnd = kickoffMs + liveWindowMinutes * 60 * 1000;
    mode = now >= kickoffMs && now <= liveEnd ? "LIVE" : "FT";
  }

  if (mode === "COUNTDOWN") {
    const ms = kickoffMs - now;

    return (
      <div className={pillBase}>
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