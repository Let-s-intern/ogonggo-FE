import type { ReactNode } from 'react';
import { MyPageLayout } from '@/views/mypage';

/**
 * `/mypage` 아래 모든 화면이 이 레이아웃을 공유한다 — 일반 회원(v4) 다섯과 기업 회원(v5) 둘.
 * 껍데기는 `views/mypage` 가 그린다.
 *
 * 메뉴 목록을 여기서 넘기지 않는 이유는 `MyPageLayout` 주석에 있다. 경로가 둘 중 어느
 * 마이페이지인지를 정하는데, 그 판정을 하려면 서버 컴포넌트인 이 파일이 알 수 없는 현재
 * 경로가 필요하다.
 */
export default function MyPageRouteLayout({ children }: { children: ReactNode }) {
  return <MyPageLayout>{children}</MyPageLayout>;
}
