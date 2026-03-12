import { MembersList } from '@/widgets/members-list/ui/members-list';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

export default function MembersPage() {
  return (
    <AppPageLayout maxWidth="7xl">
        <MembersList />
    </AppPageLayout>
  );
}
