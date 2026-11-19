import { InviteRedeemForm } from '@/features/invite-redeem/ui/invite-redeem-form';
import { AppPageLayout } from '@/shared/ui/app-page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default function JoinPage() {
  return (
    <AppPageLayout width="narrow">
      <Card>
        <CardHeader>
          <CardTitle>초대 코드로 멤버 연결</CardTitle>
          <CardDescription>코드를 입력하면 운영진이 정해 준 내 멤버 정보와 계정이 연결됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteRedeemForm />
        </CardContent>
      </Card>
    </AppPageLayout>
  );
}
