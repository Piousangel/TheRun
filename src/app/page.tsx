import { redirect } from 'next/navigation';

/** 클럽 내부용 앱이라 랜딩이 없다. 비로그인이면 미들웨어가 /dashboard를 /login으로 보낸다. */
export default function RootPage() {
  redirect('/dashboard');
}
