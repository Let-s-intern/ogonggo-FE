'use client';

import type { ReactNode } from 'react';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { SiteFooter } from '@/shared/ui/SiteFooter';
import { SiteHeader } from '@/shared/ui/SiteHeader';
import { MemberShell } from '@/widgets/company-mypage/ui/MemberShell';

/**
 * 공개 화면의 틀. 로그아웃 상태는 사이트 헤더 + 본문 + 푸터다. 기업 회원으로 로그인했으면 기업 회원 화면과 같은
 * 틀(`MemberShell`)이라 광고 안내·광고 신청을 눌러도 왼쪽 메뉴가 사라지지 않는다(2026-11-10 사용자).
 *
 * 토큰이 브라우저 저장소에만 있어 서버 렌더와 첫 화면은 늘 로그아웃 틀이고, 계정을 받은 뒤 바뀐다(헤더와 같다).
 */
export function SiteFrame({ children }: { children: ReactNode }) {
  const account = useMyAccount();
  if (account.kind === 'ready' && account.account.role === 'COMPANY') {
    return <MemberShell contained={false}>{children}</MemberShell>;
  }
  return (
    <>
      <SiteHeader />
      {/* 본문이 짧아도 푸터가 화면 아래에 붙게 본문이 남는 높이를 채운다. */}
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
