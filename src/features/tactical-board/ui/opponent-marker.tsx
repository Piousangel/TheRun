"use client";

import type { PositionRole } from "@/shared/types/formation";

interface OpponentMarkerProps {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
}

const ROLE_COLORS = {
  GK: "from-slate-500 to-slate-700",
  DF: "from-slate-500 to-slate-700",
  MF: "from-slate-500 to-slate-700",
  FW: "from-slate-500 to-slate-700",
  SUB: "from-slate-400 to-slate-600",
};

export function OpponentMarker({ x, y, role }: OpponentMarkerProps) {
  return (
    <div
      className="absolute pointer-events-none z-0 opacity-55"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br ${ROLE_COLORS[role]} shadow-[0_10px_24px_rgba(0,0,0,0.18)]`}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/80">
          {role}
        </span>
      </div>
    </div>
  );
}
