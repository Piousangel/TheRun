import { AppPageLayout } from '@/shared/ui/app-page-layout';
import { MorePageContent } from '@/widgets/more/ui/more-page-content';

export default function MorePage() {
  return (
    <AppPageLayout width="narrow">
      <MorePageContent />
    </AppPageLayout>
  );
}
