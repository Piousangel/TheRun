import { MyPageContent } from '@/widgets/me/ui/my-page-content';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

export default function MePage() {
  return (
    <AppPageLayout width="narrow">
        <MyPageContent />
    </AppPageLayout>
  );
}
