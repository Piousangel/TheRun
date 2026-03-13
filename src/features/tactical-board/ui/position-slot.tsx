"use client";

import type { PositionRole } from "@/shared/types/formation";

interface PositionSlotProps {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
  isEmpty: boolean;
  onClick?: () => void;
  isVisible?: boolean;
  isActive?: boolean;
}

const ROLE_BORDER_COLORS = {
  GK: "border-yellow-300/90",
  DF: "border-sky-300/90",
  MF: "border-emerald-300/90",
  FW: "border-rose-300/90",
  SUB: "border-slate-300/90",
};

export function PositionSlot({
  x,
  y,
  role,
  isEmpty,
  onClick,
  isVisible = isEmpty,
  isActive = false,
}: PositionSlotProps) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute z-0 cursor-pointer"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={onClick}
    >
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed ${ROLE_BORDER_COLORS[role]} transition-all ${
          isActive
            ? "scale-110 opacity-100 bg-white/16 ring-4 ring-primary/40 shadow-[0_0_0_6px_rgba(200,168,88,0.14)] animate-pulse"
            : isEmpty
              ? "opacity-50 hover:opacity-80 bg-black/10 backdrop-blur-sm"
              : "opacity-80 bg-white/18 backdrop-blur-sm"
        }`}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/72">
          {role}
        </span>
      </div>
    </div>
  );
}
