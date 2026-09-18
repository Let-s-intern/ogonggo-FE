'use client';

import Link from 'next/link';
import { SignInForm } from './SignInForm';

export interface CompanySignInPanelProps {
  /** 로그인 뒤 돌아갈 화면. 이미 걸러진 값이다(`shared/lib/returnPath.ts`). */
  returnPath: string | null;
}

/**
 * 기업 회원 탭. 오공고 계정의 이메일·비밀번호 로그인. 간편 로그인은 없다.
 *
 * 안내 문구는 디자인에 없어 일반 탭과 같은 자리에 둔다(PRD "화면 > 로그인").
 */
export function CompanySignInPanel({ returnPath }: CompanySignInPanelProps) {
  void returnPath;
  return (
    <div className="flex flex-col">
      <p className="pb-4 text-sm text-gray-500">기업 계정으로 로그인합니다.</p>
      <SignInForm onSubmit={() => {}} pending={false} error={null} />
      <div className="flex justify-center pt-12 text-sm font-medium text-gray-900">
        <Link href="/signup/company" className="hover:underline">
          회원가입
        </Link>
      </div>
    </div>
  );
}
