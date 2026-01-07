import { VotesList } from '@/widgets/votes/ui/votes-list';

export default function VotesPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <VotesList />
      </div>
    </main>
  );
}
