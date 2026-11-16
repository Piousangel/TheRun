/**
 * 더런 브랜드 마크(2026-11-16 최종, S2R) — 'TR' 모노그램.
 * T(흰색) + 사인 스타일의 좁고 굵은 R(금색, 볼 아래 홈 + 거의 수직 다리) + R 속 공간의 축구공(초록).
 * 오너 참고 이미지(좁은 그로테스크 R) 방향, 디자인 리뷰 반영: 가운데 정렬(좌우 여백 14.6%), 공 면적 1.5배,
 * T 가로대 = 줄기의 0.9배, 모서리 각지게, T–R 간격 2.5, 홈 깊이 5.5.
 * 구멍은 fillRule="evenodd"(mask·clipPath 없음 — ImageResponse/Satori 호환).
 * 설계 기록: docs/design/logo-2026-11-16.md
 */
export const THE_RUN_MARK = {
  viewBox: '0 0 96 96',
  /** T: 가로대, 줄기 */
  tRects: [
    { x: 14, y: 18, width: 28, height: 10 },
    { x: 22.5, y: 18, width: 11, height: 60 },
  ],
  /** R: 바깥 + 속 공간(둥근 사각) — evenodd */
  r: 'M44.5 18 H67.0 Q82.0 18 82.0 33 V42.5 Q82.0 49.0 76.5 50.0 Q82.0 52.0 82.0 58.5 V78 H71.5 V60.5 Q71.5 55.5 66.5 55.0 H55.5 V78 H44.5 Z M62.0 27.5 H65.5 Q72.0 27.5 72.0 34.0 V39.0 Q72.0 45.5 65.5 45.5 H62.0 Q55.5 45.5 55.5 39.0 V34.0 Q55.5 27.5 62.0 27.5 Z',
  /** 축구공: 원 + 가운데 오각형 + 가장자리 패널 5개 — evenodd */
  ball: 'M57.15 36.50 A6.6 6.6 0 1 0 70.35 36.50 A6.6 6.6 0 1 0 57.15 36.50 Z M63.75 34.12 L66.01 35.77 L65.15 38.42 L62.35 38.42 L61.49 35.77 Z M67.16 32.06 L67.44 32.29 L67.71 32.54 L67.96 32.81 L68.19 33.09 L68.34 33.30 L66.08 33.30 L65.38 31.15 L65.55 31.20 L65.89 31.33 L66.23 31.48 L66.55 31.65 L66.86 31.84 Z M69.05 38.30 L68.92 38.64 L68.77 38.98 L68.60 39.30 L68.41 39.61 L68.22 39.88 L67.52 37.72 L69.35 36.39 L69.35 36.50 L69.34 36.87 L69.30 37.23 L69.24 37.59 L69.16 37.95 Z M63.75 42.10 L63.38 42.09 L63.02 42.05 L62.66 41.99 L62.30 41.91 L61.95 41.80 L61.92 41.79 L63.75 40.46 L65.58 41.79 L65.55 41.80 L65.20 41.91 L64.84 41.99 L64.48 42.05 L64.12 42.09 Z M58.34 37.95 L58.26 37.59 L58.20 37.23 L58.16 36.87 L58.15 36.50 L58.15 36.39 L59.98 37.72 L59.28 39.88 L59.09 39.61 L58.90 39.30 L58.73 38.98 L58.58 38.64 L58.45 38.30 Z M60.64 31.84 L60.95 31.65 L61.27 31.48 L61.61 31.33 L61.95 31.20 L62.12 31.15 L61.42 33.30 L59.16 33.30 L59.31 33.09 L59.54 32.81 L59.79 32.54 L60.06 32.29 L60.34 32.06 Z',
  /** 20px 이하용 단순 공(가운데 오각형만) */
  ballSmall: 'M57.15 36.50 A6.6 6.6 0 1 0 70.35 36.50 A6.6 6.6 0 1 0 57.15 36.50 Z M63.75 33.73 L66.39 35.64 L65.38 38.74 L62.12 38.74 L61.11 35.64 Z',
} as const

export const THE_RUN_COLORS = {
  gold: '#C8A858', // --brand
  goldDark: '#8A6D1F', // --brand-dark (밝은 배경용)
  ink: '#111114',
  paper: '#F8F7F3',
  pitch: '#30A46C', // 공(어두운 배경)
  pitchDark: '#218358', // 공(밝은 배경)
} as const

export type TheRunTone = 'brand' | 'brandOnLight' | 'light' | 'dark'

/** 톤별 색: 브랜드 톤은 T·R·공 3색, light/dark는 단색 */
export const THE_RUN_TONES: Record<TheRunTone, { t: string; r: string; ball: string }> = {
  brand: { t: THE_RUN_COLORS.paper, r: THE_RUN_COLORS.gold, ball: THE_RUN_COLORS.pitch },
  brandOnLight: { t: THE_RUN_COLORS.ink, r: THE_RUN_COLORS.goldDark, ball: THE_RUN_COLORS.pitchDark },
  light: { t: THE_RUN_COLORS.paper, r: THE_RUN_COLORS.paper, ball: THE_RUN_COLORS.paper },
  dark: { t: THE_RUN_COLORS.ink, r: THE_RUN_COLORS.ink, ball: THE_RUN_COLORS.ink },
}
