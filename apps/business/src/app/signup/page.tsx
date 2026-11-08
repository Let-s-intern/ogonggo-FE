import type { Metadata } from 'next';
import { sanitizeReturnPath } from '@/shared/lib/returnPath';
import { CompanySignUpForm } from '@/widgets/sign-up/CompanySignUpForm';

/** 계정 화면이라 검색에 싣지 않는다(`app/robots.ts` 도 막는다). */
export const metadata: Metadata = {
  title: '기업 회원가입',
  robots: { index: false, follow: false },
};

type SignUpSearchParams = { redirect?: string | string[] };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** 기업 회원가입. `?redirect=` 는 로그인 화면이 넘기는 돌아갈 화면이다. web 의 가입 배너는 옮기지 않았다. */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SignUpSearchParams>;
}) {
  const params = await searchParams;
  return (
    <div className="flex justify-center px-5 pt-14 pb-24 md:pt-20 md:pb-32">
      <div className="flex w-full max-w-112 flex-col">
        <p className="text-sm text-gray-600">기업 회원가입</p>
        <h1 className="pt-6 pb-10 text-3xl font-bold text-gray-900">
          기업/기관 정보를 입력해 주세요.
        </h1>
        <CompanySignUpForm returnPath={sanitizeReturnPath(first(params.redirect))} />
      </div>
    </div>
  );
}
