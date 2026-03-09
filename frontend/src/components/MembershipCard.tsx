"use client";

import { useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MembershipCardProps {
  tier: "basic" | "bronze" | "silver" | "gold" | "platinum" | "diamond";
  memberName: string;
  memberNumber: string;
  since: string;
  expires: string;
  qrUrl?: string;
  className?: string;
}

const tierConfig = {
  basic: {
    label: "BASIC MEMBER",
    bg: "linear-gradient(135deg, #1a5276 0%, #154360 50%, #0e2f44 100%)",
    textColor: "text-white",
  },
  bronze: {
    label: "BRONZE MEMBER",
    bg: "linear-gradient(135deg, #c0392b 0%, #96281b 50%, #6e1e14 100%)",
    textColor: "text-white",
  },
  silver: {
    label: "SILVER MEMBER",
    bg: "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)",
    textColor: "text-ink",
  },
  gold: {
    label: "GOLD MEMBER",
    bg: "linear-gradient(135deg, #f1c40f 0%, #d4a017 50%, #b8860b 100%)",
    textColor: "text-ink",
  },
  platinum: {
    label: "PLATINUM MEMBER",
    bg: "linear-gradient(135deg, #64748b 0%, #475569 50%, #334155 100%)",
    textColor: "text-white",
  },
  diamond: {
    label: "DIAMOND MEMBER",
    bg: "linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)",
    textColor: "text-white",
  },
};

export default function MembershipCard({
  tier,
  memberName,
  memberNumber,
  since,
  expires,
  qrUrl,
  className,
}: MembershipCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const config = tierConfig[tier];

  const qrSrc =
    qrUrl ||
    `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
      `https://mombasaunited.com/member/${memberNumber}`
    )}&bgcolor=00000000&color=ffffff`;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `membership-card-${memberNumber}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Download failed. Please try again.");
    }
  }, [memberNumber]);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        ref={cardRef}
        className="relative w-[380px] max-w-full aspect-[1.6/1] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.25)] p-6 flex flex-col justify-between"
        style={{ background: config.bg }}
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)",
            }}
          />
        </div>

        <div className="relative flex items-start justify-between">
          <div>
            <div
              className={cn("text-lg font-extrabold tracking-wider", config.textColor)}
              style={{ fontFamily: "'Bebas Neue', system-ui, sans-serif" }}
            >
              MOMBASA UNITED FC
            </div>
            <div
              className={cn("text-[10px] tracking-[0.25em] uppercase mt-0.5", config.textColor)}
              style={{ opacity: 0.7 }}
            >
              {config.label}
            </div>
          </div>

          <img
            src={qrSrc}
            alt="Member QR Code"
            className="w-16 h-16 rounded-lg"
            crossOrigin="anonymous"
          />
        </div>

        <div className="relative">
          <div
            className={cn("text-xl font-bold tracking-wide", config.textColor)}
            style={{ fontFamily: "'Bebas Neue', system-ui, sans-serif" }}
          >
            {memberName}
          </div>
          <div className="flex items-center gap-6 mt-2">
            <div>
              <div className={cn("text-[9px] uppercase tracking-widest", config.textColor)} style={{ opacity: 0.6 }}>
                Card No.
              </div>
              <div className={cn("text-xs font-semibold mt-0.5", config.textColor)}>{memberNumber}</div>
            </div>
            <div>
              <div className={cn("text-[9px] uppercase tracking-widest", config.textColor)} style={{ opacity: 0.6 }}>
                Member Since
              </div>
              <div className={cn("text-xs font-semibold mt-0.5", config.textColor)}>{since}</div>
            </div>
            <div>
              <div className={cn("text-[9px] uppercase tracking-widest", config.textColor)} style={{ opacity: 0.6 }}>
                Expires
              </div>
              <div className={cn("text-xs font-semibold mt-0.5", config.textColor)}>{expires}</div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-2 rounded-xl bg-ink text-white px-6 py-2.5 text-sm font-semibold hover:opacity-90 transition"
      >
        ↓ Download Card
      </button>
    </div>
  );
}