import { MemberDetail } from '@/widgets/member-detail/ui/member-detail';

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <MemberDetail memberId={id} />
      </div>
    </main>
  );
}
