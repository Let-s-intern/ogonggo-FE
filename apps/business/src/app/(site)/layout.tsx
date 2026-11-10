import type { ReactNode } from 'react';
import { SiteFooter } from '@/shared/ui/SiteFooter';
import { SiteHeader } from '@/shared/ui/SiteHeader';

/**
 * 공개 화면(랜딩·광고 신청·무료 홍보·로그인·가입)의 틀. 사이트 헤더 + 본문 + 푸터다. 기업 회원 화면(`/mypage`)은
 * 이 틀을 쓰지 않고 콘솔 모양이다(2026-11-10 사용자). 경로는 괄호 폴더라 주소에 들어가지 않는다.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* 본문이 짧아도 푸터가 화면 아래에 붙게 본문이 남는 높이를 채운다. */}
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
