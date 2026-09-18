'use client';

import { SocialSignInButtons, startSocialSignIn } from '@/features/sign-in';
import { UserSignUpForm } from '@/features/sign-up';
import { SignUpLayout } from './SignUpLayout';

/**
 * 일반 회원 가입 화면(`회원가입 유저.png`). 렛츠커리어 계정을 만든다.
 *
 * "또는 SNS 간편 회원 가입" 의 카카오·네이버는 로그인 화면의 간편 로그인과 같다. 처음이면 렛츠커리어가 계정을
 * 만들고, 돌아오면 콜백이 교환한 뒤 커리어 정보 화면으로 보낸다. 디자인의 GitHub·파란 불꽃 아이콘은 두지 않는다.
 * 가입 화면에는 돌아갈 화면이 없어 홈(또는 첫 가입이면 커리어 정보) 으로 간다.
 */
export function UserSignUpPage() {
  return (
    <SignUpLayout audience="user" title="기본 정보를 입력해 주세요.">
      <UserSignUpForm />
      <p className="pt-6 pb-11 text-center text-sm text-gray-400">또는 SNS 간편 회원 가입</p>
      <SocialSignInButtons onSelect={(provider) => startSocialSignIn(provider, null)} />
    </SignUpLayout>
  );
}
