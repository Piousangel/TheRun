"use client";

import { ReactNode } from "react";

interface SoccerFieldProps {
  children?: ReactNode;
}

export function SoccerField({ children }: SoccerFieldProps) {
  return (
    <div className="relative w-full aspect-[2/3] overflow-hidden rounded-[2rem] border border-emerald-900/60 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.18),transparent_22%),linear-gradient(180deg,#0d5827_0%,#0f6d31_28%,#11773a_52%,#0c5b2d_100%)] shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_12%,rgba(0,0,0,0.03)_24%,rgba(255,255,255,0.04)_36%,rgba(255,255,255,0.01)_48%,rgba(0,0,0,0.03)_60%,rgba(255,255,255,0.04)_72%,rgba(255,255,255,0.01)_84%,rgba(0,0,0,0.03)_100%)] opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_55%,rgba(0,0,0,0.22)_100%)]" />
      <div className="absolute inset-x-6 top-4 z-10 flex items-center justify-between rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/72 backdrop-blur-md">
        <span>Match Strategy</span>
        <span>Press & Move</span>
      </div>
      <svg
        viewBox="0 0 100 150"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="field-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="35%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
          </linearGradient>
          <pattern
            id="grass-stripes"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width="5"
              height="10"
              fill="rgba(255,255,255,0.035)"
            />
          </pattern>
          <pattern
            id="grass-noise"
            x="0"
            y="0"
            width="14"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="3" r="0.4" fill="rgba(255,255,255,0.05)" />
            <circle cx="11" cy="9" r="0.45" fill="rgba(0,0,0,0.05)" />
            <circle cx="6" cy="12" r="0.35" fill="rgba(255,255,255,0.04)" />
          </pattern>
          <filter id="field-glow">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          x="2"
          y="2"
          width="96"
          height="146"
          fill="url(#field-sheen)"
          opacity="0.45"
        />

        {/* Field border */}
        <rect
          x="2"
          y="2"
          width="96"
          height="146"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
          filter="url(#field-glow)"
        />

        {/* Center line */}
        <line
          x1="2"
          y1="75"
          x2="98"
          y2="75"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
          filter="url(#field-glow)"
        />

        {/* Center circle */}
        <circle
          cx="50"
          y="75"
          r="8"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
          filter="url(#field-glow)"
        />
        <circle cx="50" y="75" r="0.5" fill="rgba(255,255,255,0.95)" />

        {/* Top penalty area */}
        <rect
          x="20"
          y="2"
          width="60"
          height="18"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />

        {/* Top goal area */}
        <rect
          x="35"
          y="2"
          width="30"
          height="8"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />

        {/* Top goal */}
        <rect
          x="42"
          y="0"
          width="16"
          height="2"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.56"
        />

        {/* Top penalty arc */}
        <path
          d="M 35 20 Q 50 27 65 20"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />

        {/* Bottom penalty area */}
        <rect
          x="20"
          y="130"
          width="60"
          height="18"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />

        {/* Bottom goal area */}
        <rect
          x="35"
          y="140"
          width="30"
          height="8"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />

        {/* Bottom goal */}
        <rect
          x="42"
          y="148"
          width="16"
          height="2"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.56"
        />

        {/* Bottom penalty arc */}
        <path
          d="M 35 130 Q 50 123 65 130"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />

        {/* Corner arcs */}
        <path
          d="M 2 5 Q 2 2 5 2"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />
        <path
          d="M 95 2 Q 98 2 98 5"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />
        <path
          d="M 2 145 Q 2 148 5 148"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />
        <path
          d="M 95 148 Q 98 148 98 145"
          fill="none"
          stroke="rgba(255,255,255,0.96)"
          strokeWidth="0.34"
        />

        <rect x="2" y="2" width="96" height="146" fill="url(#grass-stripes)" />
        <rect
          x="2"
          y="2"
          width="96"
          height="146"
          fill="url(#grass-noise)"
          opacity="0.35"
        />
      </svg>

      {/* Children (player markers) */}
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}
