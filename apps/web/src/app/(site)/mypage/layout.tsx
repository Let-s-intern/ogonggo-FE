import type { ReactNode } from 'react';
import { MyPageLayout } from '@/views/mypage';
import { USER_MYPAGE_MENU } from '@/widgets/mypage-sidebar';

/**
 * `/mypage` 아래 다섯 화면이 이 레이아웃을 공유한다. 껍데기는 `views/mypage` 가 그리고,
 * 여기서는 어떤 메뉴를 넘길지만 정한다 — 기업 회원 마이페이지(v5)는 같은 껍데기에 자기
 * 메뉴 목록을 넘긴다.
 */
export default function MyPageRouteLayout({ children }: { children: ReactNode }) {
  return <MyPageLayout menuItems={USER_MYPAGE_MENU}>{children}</MyPageLayout>;
}
