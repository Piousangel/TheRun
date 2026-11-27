import { Suspense } from 'react';
import { SeasonDraft } from '@/widgets/season-draft/ui/season-draft';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

interface DraftPageProps {
  params: Promise<{ id: string }>;
}

export default async function DraftPage({ params }: DraftPageProps) {
  const { id } = await params;
  return (
    <AppPageLayout>
      <Suspense>
        <SeasonDraft seasonId={id} />
      </Suspense>
    </AppPageLayout>
  );
}
