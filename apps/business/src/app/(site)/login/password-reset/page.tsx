import type { Metadata } from 'next';
import { PasswordResetPage } from '@/widgets/sign-in/PasswordResetPage';

/** 계정 화면이라 검색에 싣지 않는다(`app/robots.ts` 의 `/login` 이 이 경로도 막는다). */
export const metadata: Metadata = {
  title: '비밀번호 찾기',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PasswordResetPage />;
}
