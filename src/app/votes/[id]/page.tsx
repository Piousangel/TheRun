import { VoteDetail } from '@/widgets/vote-detail/ui/vote-detail';
import { BackButton } from '@/shared/components/back-button';

interface VoteDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function VoteDetailPage({ params }: VoteDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <BackButton fallbackPath="/votes" />
        <VoteDetail sessionId={id} />
      </div>
    </main>
  );
}
