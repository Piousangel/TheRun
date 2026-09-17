import { MatchDetailWidget } from '@/widgets/match-detail/ui/match-detail-widget';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

interface MatchDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params;

  return (
    <AppPageLayout>
      <div className="space-y-6">
        <MatchDetailWidget matchId={id} />
      </div>
    </AppPageLayout>
  );
}
