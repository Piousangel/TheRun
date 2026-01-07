import { TeamDivisionWidget } from '@/widgets/team-division/ui/team-division-widget';
import { BackButton } from '@/shared/components/back-button';

export default function TeamDivisionPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <BackButton />
        <TeamDivisionWidget />
      </div>
    </main>
  );
}
