import type { ReactNode } from 'react';
import { SignupBanner, type SignupBannerProps } from '@/widgets/signup-banner';

/**
 * 두 가입 화면의 공통 틀. 파란 배너, "회원가입" 머리말과 제목, 가운데 좁은 폼 칸.
 */
export function SignUpLayout({
  audience,
  title,
  children,
}: {
  audience: SignupBannerProps['audience'];
  title: string;
  children: ReactNode;
}) {
  return (
    <>
      <SignupBanner audience={audience} />
      <main className="flex justify-center bg-white px-5 pt-14 pb-24 md:pt-20 md:pb-32">
        <div className="flex w-full max-w-112 flex-col">
          <p className="text-sm text-gray-600">회원가입</p>
          <h1 className="pt-6 pb-10 text-2xl font-bold text-gray-900">{title}</h1>
          {children}
        </div>
      </main>
    </>
  );
}
