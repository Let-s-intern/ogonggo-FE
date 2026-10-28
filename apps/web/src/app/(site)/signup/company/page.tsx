import type { Metadata } from 'next';
import { CompanySignUpPage } from '@/views/signup';

export const metadata: Metadata = { title: '기업 회원가입' };

type CompanySignUpSearchParams = { company?: string | string[]; email?: string | string[] };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * 기업 회원가입 라우트. `?company=`·`?email=` 은 `/biz` 신청 완료 화면이 넘기는 값이고 폼 초기값으로만 쓴다.
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
