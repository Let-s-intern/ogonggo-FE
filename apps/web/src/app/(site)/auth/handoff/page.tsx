import type { Metadata } from 'next';
import { AuthHandoffPage } from '@/views/auth-handoff';

export const metadata: Metadata = { title: '로그인', robots: { index: false } };

/** 어드민의 `오공고 웹으로` 가 로그인을 넘기는 곳(`apps/admin/src/shared/api/webHandoff.ts`). */
export default function Page() {
  return <AuthHandoffPage />;
}
