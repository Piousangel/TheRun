import { AttendanceWidget } from '@/widgets/attendance/ui/attendance-widget';

export default function AttendancePage() {
  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <AttendanceWidget />
      </div>
    </main>
  );
}
