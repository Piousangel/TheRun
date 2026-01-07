import { MembersList } from '@/widgets/members-list/ui/members-list';
import { BackButton } from '@/shared/components/back-button';

export default function MembersPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        <BackButton />
        <MembersList />
      </div>
    </main>
  );
}
