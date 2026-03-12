import { AnnouncementsList } from '@/widgets/announcements/ui/announcements-list';

export default function AnnouncementsPage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <AnnouncementsList />
      </div>
    </main>
  );
}
