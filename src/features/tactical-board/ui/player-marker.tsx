"use client";

import {
  useRef,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { Member } from "@/shared/types/member";
import type { PositionRole } from "@/shared/types/formation";

interface PlayerMarkerProps {
  id: string;
  member: Member | null;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  role: PositionRole;
  onPositionChange: (id: string, x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onClick?: (e: React.MouseEvent) => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  isMoveMode?: boolean;
}

const ROLE_COLORS = {
  GK: "from-amber-300 to-yellow-500",
  DF: "from-sky-300 to-blue-500",
  MF: "from-emerald-300 to-green-500",
  FW: "from-rose-300 to-red-500",
  SUB: "from-slate-300 to-slate-500",
};

const ROLE_BADGES = {
  GK: "GK",
  DF: "DF",
  MF: "MF",
  FW: "FW",
  SUB: "SUB",
};

export function PlayerMarker({
  member,
  x,
  y,
  role,
  onClick,
  onLongPress,
  isSelected = false,
  isMoveMode = false,
}: PlayerMarkerProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldSuppressClickRef = useRef(false);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    shouldSuppressClickRef.current = false;
    clearLongPressTimer();

    if (!onLongPress) {
      return;
    }

    longPressTimerRef.current = setTimeout(() => {
      shouldSuppressClickRef.current = true;
      onLongPress();
    }, 420);
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
  };

  const handleClick = (e: ReactMouseEvent) => {
    // Prevent event bubbling
    e.stopPropagation();

    if (shouldSuppressClickRef.current) {
      shouldSuppressClickRef.current = false;
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  const initials = member?.name.slice(0, 1) ?? role;

  return (
    <div
      ref={markerRef}
      className={`group absolute cursor-pointer transition-all duration-500 ease-out opacity-100 z-10 ${
        isSelected ? "ring-4 ring-primary ring-offset-2 rounded-full" : ""
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerEnd}
      onPointerLeave={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={handleClick}
    >
      <div className="relative">
        {/* Player avatar/marker */}
        {member ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${ROLE_COLORS[role]} blur-md opacity-80`}
              />
              <div className="relative flex h-[4rem] w-[3.2rem] flex-col items-center rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.34),rgba(255,255,255,0.08))] px-1 pt-1 shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-1">
                <div className="relative flex h-7 w-7 items-center justify-center rounded-full border border-black/5 bg-[#ffd8b5] shadow-inner">
                  <span className="text-[11px] font-bold text-slate-700">
                    {initials}
                  </span>
                  <span className="absolute left-[7px] top-[10px] h-[2px] w-[2px] rounded-full bg-slate-700" />
                  <span className="absolute right-[7px] top-[10px] h-[2px] w-[2px] rounded-full bg-slate-700" />
                  <span className="absolute bottom-[6px] left-1/2 h-[2px] w-[8px] -translate-x-1/2 rounded-full bg-rose-400/80" />
                  <div className="absolute -top-1 left-1/2 h-3 w-6 -translate-x-1/2 rounded-t-full bg-slate-800" />
                </div>
                <div
                  className={`mt-1 flex h-5 w-8 items-center justify-center rounded-t-[0.65rem] rounded-b-[0.95rem] bg-gradient-to-br ${ROLE_COLORS[role]} shadow-sm`}
                >
                  <span className="text-[9px] font-black uppercase tracking-[0.08em] text-white">
                    {ROLE_BADGES[role]}
                  </span>
                </div>
                <div className="mt-[2px] flex w-full items-center justify-center gap-2 px-1">
                  <span className="h-2 w-[2px] rounded-full bg-white/85" />
                  <span className="h-2 w-[2px] rounded-full bg-white/85" />
                </div>
                <div className="mt-[1px] flex w-full items-center justify-center gap-2 px-1">
                  <span className="h-[6px] w-[2px] rounded-full bg-slate-900/60" />
                  <span className="h-[6px] w-[2px] rounded-full bg-slate-900/60" />
                </div>
              </div>
              <div className="absolute -right-1 -top-1 rounded-full border border-white/60 bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-md">
                {ROLE_BADGES[role]}
              </div>
            </div>
            {isMoveMode ? (
              <div className="absolute -inset-3 rounded-full border-2 border-dashed border-primary/90 animate-pulse" />
            ) : null}
            <div className="rounded-full border border-white/10 bg-black/72 px-2.5 py-1 text-[11px] font-medium tracking-tight text-white shadow-lg backdrop-blur-md whitespace-nowrap">
              {member.name}
            </div>
          </div>
        ) : (
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 bg-gradient-to-br ${ROLE_COLORS[role]} shadow-[0_10px_30px_rgba(0,0,0,0.28)]`}
          >
            <span className="text-[11px] font-bold text-white">{role}</span>
          </div>
        )}
      </div>
    </div>
  );
}
