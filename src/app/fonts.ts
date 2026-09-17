import localFont from 'next/font/local';

/** 한국어 본문 폰트. 가변 폰트 하나로 45~920 굵기를 모두 낸다. */
export const pretendard = localFont({
  src: '../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  variable: '--font-sans',
  weight: '45 920',
  display: 'swap',
});
