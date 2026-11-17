import type { SVGProps } from 'react';

export function GoogleLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.16 3.58-8.64Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.86-3c-1.07.72-2.44 1.15-4.09 1.15-3.14 0-5.8-2.12-6.76-4.97H1.26v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.24 14.27A7.2 7.2 0 0 1 4.86 12c0-.79.14-1.55.38-2.27v-3.1H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.37l3.98-3.1Z" />
      <path fill="#EA4335" d="M12 4.77c1.76 0 3.35.61 4.59 1.8l3.44-3.44C17.95 1.2 15.23 0 12 0A12 12 0 0 0 1.26 6.63l3.98 3.1c.96-2.85 3.62-4.96 6.76-4.96Z" />
    </svg>
  );
}

export function NaverLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect width="24" height="24" rx="6" fill="#03C75A" />
      <path fill="#fff" d="M16.89 17h-2.1l-5.57-7.88V17H7.11V7h2.1l5.57 7.88V7h2.11v10Z" />
    </svg>
  );
}

export function KakaoLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <rect width="24" height="24" rx="6" fill="#FEE500" />
      <path fill="#191919" d="M12 5.5c-3.87 0-7 2.4-7 5.37 0 1.92 1.3 3.6 3.26 4.55l-.83 3.05c-.07.25.21.45.42.3l3.64-2.4c.17.01.34.02.51.02 3.87 0 7-2.4 7-5.52S15.87 5.5 12 5.5Z" />
    </svg>
  );
}
