import { CompanySignUpForm } from '@/features/sign-up';
import { SignUpLayout } from './SignUpLayout';

/**
 * 기업 회원 가입 화면(`회원가입 기업.png`). `/biz` 신청 완료 화면에서 오면 회사명·이메일을 받아 미리 채운다.
 */
export function CompanySignUpPage({
  initialOrganizationName,
  initialEmail,
}: {
  initialOrganizationName?: string;
  initialEmail?: string;
}) {
  return (
    <SignUpLayout audience="company" title="기업/기관 정보를 입력해 주세요.">
      <CompanySignUpForm
        initialOrganizationName={initialOrganizationName}
        initialEmail={initialEmail}
      />
    </SignUpLayout>
  );
}
