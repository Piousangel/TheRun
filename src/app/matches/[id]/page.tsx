import { MatchDetailWidget } from '@/widgets/match-detail/ui/match-detail-widget';
import { BackButton } from '@/shared/components/back-button';

interface MatchDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton fallbackPath="/matches" />
        <MatchDetailWidget matchId={id} />
      </div>
    </main>
  );
}
