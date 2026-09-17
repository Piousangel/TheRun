import { AttendanceWidget } from '@/widgets/attendance/ui/attendance-widget';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

export default function AttendancePage() {
  return (
    <AppPageLayout width="narrow">
        <AttendanceWidget />
    </AppPageLayout>
  );
}
