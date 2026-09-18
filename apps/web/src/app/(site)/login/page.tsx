import type { Metadata } from 'next';
import { sanitizeReturnPath } from '@/shared/lib/returnPath';
import { LoginPage } from '@/views/login';

export const metadata: Metadata = { title: '로그인' };

interface LoginSearchParams {
  tab?: string | string[];
  redirect?: string | string[];
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * 로그인 라우트. `?tab=company` 면 기업 탭, `?redirect=` 는 로그인 뒤 돌아갈 화면이다(401 재발급이 실패하면
 * `shared/api/reissue.ts` 가 붙인다). `redirect` 는 여기서 같은 사이트의 경로만 남긴다.
 */
export default async function Page({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const params = await searchParams;
  return (
    <LoginPage
      initialTab={first(params.tab) === 'company' ? 'company' : 'user'}
      returnPath={sanitizeReturnPath(first(params.redirect))}
    />
  );
}
