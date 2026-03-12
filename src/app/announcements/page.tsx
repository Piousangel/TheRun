import { AnnouncementsList } from '@/widgets/announcements/ui/announcements-list';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

export default function AnnouncementsPage() {
  return (
    <AppPageLayout maxWidth="5xl">
        <AnnouncementsList />
    </AppPageLayout>
  );
}
