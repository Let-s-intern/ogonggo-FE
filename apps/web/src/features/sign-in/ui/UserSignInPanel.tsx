'use client';

import Link from 'next/link';
import { SignInForm } from './SignInForm';
import { SocialSignInButtons } from './SocialSignInButtons';

export interface UserSignInPanelProps {
  /** 로그인 뒤 돌아갈 화면. 이미 걸러진 값이다(`shared/lib/returnPath.ts`). */
  returnPath: string | null;
}

/** 일반 회원 탭. 렛츠커리어 계정의 이메일 로그인과 카카오·네이버 간편 로그인. */
export function UserSignInPanel({ returnPath }: UserSignInPanelProps) {
  void returnPath;
  return (
    <div className="flex flex-col">
      <p className="pb-4 text-sm text-gray-500">개인 계정으로 로그인합니다.</p>
      <SignInForm onSubmit={() => {}} pending={false} error={null} />
      <p className="pt-8 pb-4 text-center text-sm text-gray-400">또는 간편 로그인</p>
      <SocialSignInButtons onSelect={() => {}} />
      <div className="flex justify-center pt-12 text-sm font-medium text-gray-900">
        <Link href="/signup" className="hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}
