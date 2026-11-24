import { Suspense } from 'react';
import { FixtureRecord } from '@/widgets/fixture-record/ui/fixture-record';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

interface FixturePageProps {
  params: Promise<{ id: string; fixtureId: string }>;
}

export default async function FixturePage({ params }: FixturePageProps) {
  const { id, fixtureId } = await params;
  return (
    <AppPageLayout>
      <Suspense>
        <FixtureRecord seasonId={id} fixtureId={fixtureId} />
      </Suspense>
    </AppPageLayout>
  );
}
