import type { Metadata } from 'next';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { MobileNav } from '@/shared/components/mobile-nav';
import { AppChrome } from '@/shared/ui/app-chrome';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'The Run - 풋살 클럽',
  description: 'The Run 축구 동호회 관리 시스템',
  applicationName: 'The Run',
  openGraph: {
    title: 'The Run - 풋살 클럽',
    description: '투표, 출석, 공지, 경기 운영을 하나의 흐름으로 연결하는 동호회 운영 워크스페이스',
    siteName: 'The Run',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Run - 풋살 클럽',
    description: '실제 경기 운영 리듬에 맞춘 The Run 클럽 워크스페이스',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <AuthProvider>
            <AppChrome>
              <div className="pb-16 xl:pb-0">{children}</div>
            </AppChrome>
            <MobileNav />
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
