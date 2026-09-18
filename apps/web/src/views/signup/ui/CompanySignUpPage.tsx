import { CompanySignUpForm } from '@/features/sign-up';
import { SignUpLayout } from './SignUpLayout';

/** 기업 회원 가입 화면(`회원가입 기업.png`). */
export function CompanySignUpPage() {
  return (
    <SignUpLayout audience="company" title="기업/기관 정보를 입력해 주세요.">
      <CompanySignUpForm />
    </SignUpLayout>
  );
}
