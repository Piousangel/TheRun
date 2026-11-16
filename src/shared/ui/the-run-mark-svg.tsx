import { THE_RUN_COLORS, THE_RUN_MARK } from "@/shared/ui/the-run-mark";

/** 아이콘·OG 공용 마크(단색). ImageResponse(Satori)용이라 마스크 없이 evenodd만 쓴다. */
export function TheRunMarkSvg({ px, color = THE_RUN_COLORS.gold }: { px: number; color?: string }) {
  const { rects, bowl, ball, leg, legWidth, viewBox } = THE_RUN_MARK;
  return (
    <svg width={px} height={px} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
      {rects.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.width} height={r.height} rx={r.rx} fill={color} />
      ))}
      <path d={bowl} fill={color} fillRule="evenodd" />
      <path d={ball} fill={color} fillRule="evenodd" />
      <path d={leg} stroke={color} strokeWidth={legWidth} strokeLinecap="round" />
    </svg>
  );
}
