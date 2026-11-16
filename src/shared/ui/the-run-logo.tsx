import { cn } from "@/shared/lib/utils";
import { THE_RUN_COLORS, THE_RUN_MARK } from "@/shared/ui/the-run-mark";

interface TheRunLogoProps {
  className?: string;
  /**
   * brand: 금색(어두운 배경) · brandOnLight: 진한 금색(밝은 배경, 대비 확보)
   * light: 흰색 단색 · dark: 검정 단색
   */
  tone?: "brand" | "brandOnLight" | "light" | "dark";
  /** 옛 로그인·안내 화면의 어두운 히어로에서만 쓰는 drop-shadow. 셸(헤더·사이드바)에서는 끈다. */
  glow?: boolean;
}

const TONE_COLOR: Record<NonNullable<TheRunLogoProps["tone"]>, string> = {
  brand: THE_RUN_COLORS.gold,
  brandOnLight: THE_RUN_COLORS.goldDark,
  light: THE_RUN_COLORS.paper,
  dark: THE_RUN_COLORS.ink,
};

export function TheRunLogo({ className, tone = "brand", glow = false }: TheRunLogoProps) {
  const color = TONE_COLOR[tone];
  const glowClass = !glow
    ? undefined
    : tone === "light"
      ? "drop-shadow-[0_10px_20px_rgba(255,255,255,0.18)]"
      : tone === "dark"
        ? "drop-shadow-[0_10px_20px_rgba(15,23,42,0.12)]"
        : "drop-shadow-[0_12px_24px_rgba(200,168,88,0.28)]";
  const { rects, bowl, ball, leg, legWidth, viewBox } = THE_RUN_MARK;

  return (
    <svg
      viewBox={viewBox}
      aria-hidden="true"
      className={cn(glowClass, className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.width} height={r.height} rx={r.rx} fill={color} />
      ))}
      <path d={bowl} fill={color} fillRule="evenodd" />
      <path d={ball} fill={color} fillRule="evenodd" />
      <path d={leg} stroke={color} strokeWidth={legWidth} strokeLinecap="round" />
    </svg>
  );
}

/**
 * 앱 아이콘과 같은 모양의 작은 타일(검정 라운드 사각형 + 금색 R). 밝은 배경의 헤더·사이드바용.
 * 금색을 흰 배경에 바로 올리면 대비가 낮아(약 2:1) 타일로 감싼다.
 */
export function TheRunBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#111114]",
        className,
      )}
    >
      <TheRunLogo className="h-[72%] w-[72%]" />
    </span>
  );
}
