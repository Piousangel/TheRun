import { AttendanceWidget } from '@/widgets/attendance/ui/attendance-widget';
import { BackButton } from '@/shared/components/back-button';

export default function AttendancePage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        <BackButton />
        <AttendanceWidget />
      </div>
    </main>
  );
}
