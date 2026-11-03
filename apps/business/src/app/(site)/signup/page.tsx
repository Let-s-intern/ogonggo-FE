import type { Metadata } from 'next';
import { CompanySignUpPage } from '@/views/signup';

export const metadata: Metadata = { title: '기업 회원가입' };

type CompanySignUpSearchParams = { company?: string | string[]; email?: string | string[] };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * 기업 회원가입 라우트. web 의 `/signup/company` 를 옮겼다. 비즈니스에는 일반 회원 가입이 없어 `/signup` 이다.
 * `?company=`·`?email=` 은 폼 초기값으로만 쓴다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<CompanySignUpSearchParams>;
}) {
  const params = await searchParams;
  return (
    <CompanySignUpPage
      initialOrganizationName={first(params.company)}
      initialEmail={first(params.email)}
    />
  );
}
