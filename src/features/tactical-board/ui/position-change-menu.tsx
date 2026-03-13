"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/shared/ui/card";
import type { PositionRole } from "@/shared/types/formation";

interface PositionChangeMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  currentRole: PositionRole;
  onSelectRole: (role: PositionRole) => void;
  onClose: () => void;
}

const ROLE_LABELS: Record<PositionRole, string> = {
  GK: "골키퍼 (GK)",
  DF: "수비수 (DF)",
  MF: "미드필더 (MF)",
  FW: "공격수 (FW)",
  SUB: "후보",
};

const ROLE_COLORS: Record<PositionRole, string> = {
  GK: "from-amber-300 to-yellow-500",
  DF: "from-sky-300 to-blue-500",
  MF: "from-emerald-300 to-green-500",
  FW: "from-rose-300 to-red-500",
  SUB: "from-slate-300 to-slate-500",
};

const ROLE_SHORT: Record<PositionRole, string> = {
  GK: "수문장",
  DF: "수비 축",
  MF: "연결 축",
  FW: "마무리",
  SUB: "벤치",
};

export function PositionChangeMenu({
  isOpen,
  position,
  currentRole,
  onSelectRole,
  onClose,
}: PositionChangeMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roles: PositionRole[] = ["GK", "DF", "MF", "FW"];

  return (
    <div className="fixed inset-0 z-[95]" style={{ pointerEvents: "none" }}>
      <Card
        ref={menuRef}
        className="absolute w-[220px] overflow-hidden border border-white/12 bg-[linear-gradient(180deg,rgba(12,16,20,0.96),rgba(19,24,28,0.94))] text-white shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
        style={{
          top: position.y,
          left: position.x,
          pointerEvents: "auto",
          transform: "translate(-50%, -20%)",
        }}
      >
        <div className="space-y-2 p-3">
          <div className="px-1 py-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
              Position Shift
            </p>
            <p className="mt-1 text-sm font-medium text-white/80">
              원하는 역할 슬롯을 선택하세요
            </p>
          </div>
          <div className="grid gap-2">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all ${
                  role === currentRole
                    ? "border-primary/40 bg-primary/14 shadow-[0_12px_24px_rgba(200,168,88,0.14)]"
                    : "border-white/8 bg-white/5 hover:border-white/14 hover:bg-white/8"
                }`}
                onClick={() => {
                  onSelectRole(role);
                  onClose();
                }}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${ROLE_COLORS[role]} shadow-sm`}
                >
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-white">
                    {role}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {ROLE_LABELS[role]}
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    {ROLE_SHORT[role]}
                  </p>
                </div>
                {role === currentRole ? (
                  <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                    현재
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/5 px-3 py-2 text-[11px] leading-5 text-white/52">
            포지션 변경
            <span className="ml-1 text-white/34">·</span>
            <span className="ml-1">
              빈 슬롯이 있으면 그 자리로 이동하고, 없으면 같은 역할 선수와
              교체됩니다.
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
