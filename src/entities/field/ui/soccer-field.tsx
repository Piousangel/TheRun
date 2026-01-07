'use client';

import { ReactNode } from 'react';

interface SoccerFieldProps {
  children?: ReactNode;
}

export function SoccerField({ children }: SoccerFieldProps) {
  return (
    <div className="relative w-full aspect-[2/3] bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden shadow-lg">
      <svg
        viewBox="0 0 100 150"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Field border */}
        <rect
          x="2"
          y="2"
          width="96"
          height="146"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Center line */}
        <line
          x1="2"
          y1="75"
          x2="98"
          y2="75"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Center circle */}
        <circle
          cx="50"
          y="75"
          r="8"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />
        <circle
          cx="50"
          y="75"
          r="0.5"
          fill="white"
        />

        {/* Top penalty area */}
        <rect
          x="20"
          y="2"
          width="60"
          height="18"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Top goal area */}
        <rect
          x="35"
          y="2"
          width="30"
          height="8"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Top goal */}
        <rect
          x="42"
          y="0"
          width="16"
          height="2"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
        />

        {/* Top penalty arc */}
        <path
          d="M 35 20 Q 50 27 65 20"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Bottom penalty area */}
        <rect
          x="20"
          y="130"
          width="60"
          height="18"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Bottom goal area */}
        <rect
          x="35"
          y="140"
          width="30"
          height="8"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Bottom goal */}
        <rect
          x="42"
          y="148"
          width="16"
          height="2"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
        />

        {/* Bottom penalty arc */}
        <path
          d="M 35 130 Q 50 123 65 130"
          fill="none"
          stroke="white"
          strokeWidth="0.3"
        />

        {/* Corner arcs */}
        <path d="M 2 5 Q 2 2 5 2" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 95 2 Q 98 2 98 5" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 2 145 Q 2 148 5 148" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 95 148 Q 98 148 98 145" fill="none" stroke="white" strokeWidth="0.3" />

        {/* Grass stripes for visual effect */}
        <defs>
          <pattern id="grass-stripes" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="5" height="10" fill="rgba(0,0,0,0.03)" />
          </pattern>
        </defs>
        <rect x="2" y="2" width="96" height="146" fill="url(#grass-stripes)" />
      </svg>

      {/* Children (player markers) */}
      <div className="absolute inset-0">
        {children}
      </div>
    </div>
  );
}
