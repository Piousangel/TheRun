import { VoteDetail } from '@/widgets/vote-detail/ui/vote-detail';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

interface VoteDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VoteDetailPage({ params }: VoteDetailPageProps) {
  const { id } = await params;

  return (
    <AppPageLayout width="narrow">
      <div className="space-y-4">
        <VoteDetail sessionId={id} />
      </div>
    </AppPageLayout>
  );
}
