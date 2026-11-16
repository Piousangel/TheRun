/**
 * 더런 브랜드 마크(2026-11-16 개편) — 'R' 모노그램.
 * 줄기 + D형 볼(축구공: 오각형 구멍) + 앞으로 차는 다리.
 * 16px에서도 읽히도록 단색·굵은 획으로만 구성한다(그라데이션·가는 선 금지).
 * 앱 컴포넌트(TheRunLogo)와 아이콘·OG 이미지(ImageResponse)가 같은 도형을 쓴다.
 * 설계 기록: docs/design/logo-2026-11-16.md
 */
export const THE_RUN_MARK = {
  viewBox: '0 0 96 96',
  /** 줄기 */
  stem: { x: 20, y: 13, width: 16, height: 70, rx: 8 },
  /** D형 볼 + 오각형(공) 구멍 — fillRule evenodd로 구멍을 낸다(마스크 없이, ImageResponse 호환) */
  bowl: 'M28 13 H56 A20 20 0 0 1 56 53 H28 Z M56 25.5 L63.13 30.68 L60.41 39.07 L51.59 39.07 L48.87 30.68 Z',
  /** 다리(스트라이드) — 둥근 끝 스트로크 */
  leg: 'M44 50 L72 81',
  legWidth: 16,
} as const

export const THE_RUN_COLORS = {
  gold: '#C8A858', // --brand
  goldDark: '#8A6D1F', // --brand-dark (밝은 배경용)
  ink: '#111114',
  paper: '#F8F7F3',
} as const
