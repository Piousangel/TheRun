import type { Metadata } from 'next';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';
import { MobileNav } from '@/shared/components/mobile-nav';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Run - 풋살 클럽',
  description: 'The Run 축구 동호회 관리 시스템',
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
            <div className="pb-16 md:pb-0">{children}</div>
            <MobileNav />
            <Toaster richColors position="top-center" />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
