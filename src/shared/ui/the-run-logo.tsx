import { cn } from "@/shared/lib/utils";
import { THE_RUN_MARK, THE_RUN_TONES, type TheRunTone } from "@/shared/ui/the-run-mark";

interface TheRunLogoProps {
  className?: string;
  /**
   * brand: 어두운 배경(T 흰색·R 금색·공 초록) · brandOnLight: 밝은 배경(T 검정·R 진한 금색·공 진한 초록)
   * light: 흰색 단색 · dark: 검정 단색
   */
  tone?: TheRunTone;
  /** 20px 이하에서 쓰면 공 무늬를 단순화한다 */
  small?: boolean;
  /** 옛 로그인·안내 화면의 어두운 히어로에서만 쓰는 drop-shadow. 셸(헤더·사이드바)에서는 끈다. */
  glow?: boolean;
}

export function TheRunLogo({ className, tone = "brand", small = false, glow = false }: TheRunLogoProps) {
  const c = THE_RUN_TONES[tone];
  const glowClass = !glow
    ? undefined
    : tone === "light"
      ? "drop-shadow-[0_10px_20px_rgba(255,255,255,0.18)]"
      : tone === "dark"
        ? "drop-shadow-[0_10px_20px_rgba(15,23,42,0.12)]"
        : "drop-shadow-[0_12px_24px_rgba(200,168,88,0.28)]";
  const { tRects, r, ball, ballSmall, viewBox } = THE_RUN_MARK;

  return (
    <svg viewBox={viewBox} aria-hidden="true" className={cn(glowClass, className)} fill="none" xmlns="http://www.w3.org/2000/svg">
      {tRects.map((t) => (
        <rect key={`${t.x}-${t.y}`} x={t.x} y={t.y} width={t.width} height={t.height} fill={c.t} />
      ))}
      <path d={r} fill={c.r} fillRule="evenodd" />
      <path d={small ? ballSmall : ball} fill={c.ball} fillRule="evenodd" />
    </svg>
  );
}

/**
 * 앱 아이콘과 같은 모양의 작은 타일(검정 라운드 사각형 + 브랜드 마크). 밝은 배경의 헤더·사이드바용.
 */
export function TheRunBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-[#111114]", className)}>
      <TheRunLogo className="h-full w-full" />
    </span>
  );
}
