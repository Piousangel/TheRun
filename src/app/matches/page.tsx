import { MatchesList } from '@/widgets/matches/ui/matches-list';
import { BackButton } from '@/shared/components/back-button';

export default function MatchesPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <BackButton />
        <MatchesList />
      </div>
    </main>
  );
}
