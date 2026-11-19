import { Suspense } from 'react';
import { SeasonsBoard } from '@/widgets/seasons/ui/seasons-board';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

export default function SeasonsPage() {
  return (
    <AppPageLayout>
      <Suspense>
        <SeasonsBoard selectedId={null} />
      </Suspense>
    </AppPageLayout>
  );
}
