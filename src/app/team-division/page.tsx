import { TeamDivisionWidget } from '@/widgets/team-division/ui/team-division-widget';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

export default function TeamDivisionPage() {
  return (
    <AppPageLayout maxWidth="7xl">
        <TeamDivisionWidget />
    </AppPageLayout>
  );
}
