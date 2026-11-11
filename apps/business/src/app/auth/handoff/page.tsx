import type { Metadata } from 'next';
import { AuthHandoffPage } from '@/widgets/auth-handoff/AuthHandoffPage';

export const metadata: Metadata = { title: '로그인', robots: { index: false, follow: false } };

/** 오공고 웹이 기업 회원의 로그인을 넘기는 곳. 해시 형식은 `AuthHandoffPage` 에 있다. */
export default function Page() {
  return <AuthHandoffPage />;
}
