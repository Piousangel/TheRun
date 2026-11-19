import { Suspense } from 'react';
import { SeasonsBoard } from '@/widgets/seasons/ui/seasons-board';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

interface SeasonPageProps {
  params: Promise<{ id: string }>;
}

export default async function SeasonPage({ params }: SeasonPageProps) {
  const { id } = await params;
  return (
    <AppPageLayout>
      <Suspense>
        <SeasonsBoard selectedId={id} />
      </Suspense>
    </AppPageLayout>
  );
}
