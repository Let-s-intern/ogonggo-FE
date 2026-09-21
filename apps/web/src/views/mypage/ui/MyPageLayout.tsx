import type { ReactNode } from 'react';
import { MyPageSidebar, type MyPageMenuItem } from '@/widgets/mypage-sidebar';

export interface MyPageLayoutProps {
  /** 사이드바에 그릴 메뉴. 기업 회원 마이페이지(v5)는 자기 목록을 넘긴다. */
  menuItems: readonly MyPageMenuItem[];
  children: ReactNode;
}

/**
 * `/mypage` 다섯 화면이 공유하는 껍데기(PRD 1 절). 좌측 사이드바 + 우측 본문이고, 본문은
 * 라우트가 넘긴다.
 *
 * 폭은 홈·목록 화면과 같은 `max-w-6xl` 이다. 목업 실측으로 사이드바 254px, 사이 간격 40px,
 * 본문이 나머지다.
 */
export function MyPageLayout({ menuItems, children }: MyPageLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-950">마이페이지</h1>
      <div className="mt-6 flex gap-10">
        <MyPageSidebar menuItems={menuItems} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
