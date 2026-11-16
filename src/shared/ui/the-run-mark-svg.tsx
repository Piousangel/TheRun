import { THE_RUN_MARK, THE_RUN_TONES, type TheRunTone } from "@/shared/ui/the-run-mark";

/** 아이콘·OG 공용 마크(ImageResponse/Satori용 — mask 없이 evenodd만 쓴다). */
export function TheRunMarkSvg({ px, tone = "brand", small = false }: { px: number; tone?: TheRunTone; small?: boolean }) {
  const { tRects, r, ball, ballSmall, viewBox } = THE_RUN_MARK;
  const c = THE_RUN_TONES[tone];
  return (
    <svg width={px} height={px} viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg">
      {tRects.map((t) => (
        <rect key={`${t.x}-${t.y}`} x={t.x} y={t.y} width={t.width} height={t.height} fill={c.t} />
      ))}
      <path d={r} fill={c.r} fillRule="evenodd" />
      <path d={small ? ballSmall : ball} fill={c.ball} fillRule="evenodd" />
    </svg>
  );
}
