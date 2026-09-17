import { MemberDetail } from '@/widgets/member-detail/ui/member-detail';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

interface MemberDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: MemberDetailPageProps) {
  const { id } = await params;

  return (
    <AppPageLayout width="narrow">
      <MemberDetail memberId={id} />
    </AppPageLayout>
  );
}
