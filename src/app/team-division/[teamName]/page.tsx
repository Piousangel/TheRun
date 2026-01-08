import { TacticalBoardWidget } from '@/widgets/tactical-board/ui/tactical-board-widget';
import { BackButton } from '@/shared/components/back-button';

interface TeamDetailPageProps {
  params: Promise<{
    teamName: string;
  }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
  const { teamName } = await params;

  // Validate team name
  if (!['A', 'B', 'C', 'D'].includes(teamName.toUpperCase())) {
    return (
      <main className="min-h-screen p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <BackButton fallbackPath="/team-division" />
          <div className="text-center mt-8">
            <h1 className="text-2xl font-bold">잘못된 팀입니다</h1>
            <p className="text-muted-foreground mt-2">유효한 팀이 아닙니다.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackButton fallbackPath="/team-division" />
        <TacticalBoardWidget teamName={teamName.toUpperCase()} />
      </div>
    </main>
  );
}
