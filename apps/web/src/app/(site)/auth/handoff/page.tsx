import type { Metadata } from 'next';
import { AuthHandoffPage } from '@/views/auth-handoff';

export const metadata: Metadata = { title: '로그인', robots: { index: false } };

/** 어드민의 `오공고 웹으로` 와 렛츠커리어 헤더의 `오늘의 공고` 가 로그인을 넘기는 곳. 해시 형식은 `AuthHandoffPage` 에 있다. */
export default function Page() {
  return <AuthHandoffPage />;
}
