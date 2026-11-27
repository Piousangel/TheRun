import { Suspense } from 'react';
import { ChatWidget } from '@/widgets/chat/ui/chat-widget';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

export default function ChatPage() {
  return (
    <AppPageLayout>
      <Suspense>
        <ChatWidget />
      </Suspense>
    </AppPageLayout>
  );
}
