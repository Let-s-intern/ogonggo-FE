import type { Metadata } from 'next';
import { sanitizeReturnPath } from '@/shared/lib/returnPath';
import { LoginPage } from '@/views/login';

export const metadata: Metadata = { title: '로그인' };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** 비즈니스 로그인 라우트. `?redirect=` 는 로그인 뒤 돌아갈 화면이고 같은 사이트의 경로만 남긴다. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string | string[] }>;
}) {
  const params = await searchParams;
  return <LoginPage returnPath={sanitizeReturnPath(first(params.redirect))} />;
}
