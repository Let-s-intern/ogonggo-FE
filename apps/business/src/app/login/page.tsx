import type { Metadata } from 'next';
import { sanitizeReturnPath } from '@/shared/lib/returnPath';
import { LoginPage } from '@/widgets/sign-in/LoginPage';

/** 계정 화면이라 검색에 싣지 않는다(`app/robots.ts` 도 막는다). */
export const metadata: Metadata = {
  title: '기업 회원 로그인',
  robots: { index: false, follow: false },
};

type LoginSearchParams = { redirect?: string | string[] };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * `?redirect=` 는 로그인 뒤 돌아갈 화면이다. 로그인이 필요한 헤더 메뉴와 401 재발급 실패
 * (`shared/api/reissue.ts`) 가 붙인다. 같은 사이트의 경로만 남긴다.
 */
export default async function Page({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const params = await searchParams;
  return <LoginPage returnPath={sanitizeReturnPath(first(params.redirect))} />;
}
