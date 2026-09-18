import { UserSignUpForm } from '@/features/sign-up';
import { SignUpLayout } from './SignUpLayout';

/** 일반 회원 가입 화면(`회원가입 유저.png`). 렛츠커리어 계정을 만든다. */
export function UserSignUpPage() {
  return (
    <SignUpLayout audience="user" title="기본 정보를 입력해 주세요.">
      <UserSignUpForm />
    </SignUpLayout>
  );
}
