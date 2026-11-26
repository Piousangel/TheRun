import { Suspense } from 'react';
import { CheckinRoster } from '@/widgets/checkin-roster/ui/checkin-roster';
import { AppPageLayout } from '@/shared/ui/app-page-layout';

export default function CheckinRosterPage() {
  return (
    <AppPageLayout>
      <Suspense>
        <CheckinRoster />
      </Suspense>
    </AppPageLayout>
  );
}
