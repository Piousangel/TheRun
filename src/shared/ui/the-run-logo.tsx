import { useId } from "react";
import { cn } from "@/shared/lib/utils";

interface TheRunLogoProps {
  className?: string;
  tone?: "brand" | "light" | "dark";
}

export function TheRunLogo({
  className,
  tone = "brand",
}: TheRunLogoProps) {
  const gradientId = useId();
  const fillId = `${gradientId}-fill`;
  const strokeId = `${gradientId}-stroke`;
  const isBrand = tone === "brand";
  const stroke =
    tone === "light"
      ? "#F8F7F3"
      : tone === "dark"
        ? "#111114"
        : `url(#${strokeId})`;
  const fill =
    tone === "light"
      ? "#F8F7F3"
      : tone === "dark"
        ? "#111114"
        : `url(#${fillId})`;
  const glowClass =
    tone === "brand"
      ? "drop-shadow-[0_12px_24px_rgba(200,168,88,0.28)]"
      : tone === "light"
        ? "drop-shadow-[0_10px_20px_rgba(255,255,255,0.18)]"
        : "drop-shadow-[0_10px_20px_rgba(15,23,42,0.12)]";

  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={cn(glowClass, className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isBrand ? (
        <defs>
          <linearGradient id={fillId} x1="24" y1="16" x2="72" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8E7A4" />
            <stop offset="0.45" stopColor="#D4AF54" />
            <stop offset="1" stopColor="#8F6820" />
          </linearGradient>
          <linearGradient id={strokeId} x1="18" y1="22" x2="82" y2="76" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFF3C4" />
            <stop offset="0.5" stopColor="#D4AF54" />
            <stop offset="1" stopColor="#956B1E" />
          </linearGradient>
        </defs>
      ) : null}

      <path
        d="M17 48C24 45 30 41 35 35"
        stroke={stroke}
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.34"
      />
      <path
        d="M12 60C20 58 28 54 36 47"
        stroke={stroke}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.2"
      />
      <circle cx="60" cy="18" r="8" fill={fill} />
      <path
        d="M45 33L58 27L72 36"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M58 27L48 46L33 58"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M49 46L67 50L81 40"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 46L42 74"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M67 50L76 74"
        stroke={stroke}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M43 35L53 39"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M42 74H52"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M75 74H83"
        stroke={stroke}
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}
