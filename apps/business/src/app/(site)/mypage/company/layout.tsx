import type { ReactNode } from 'react';
import { MyPageLayout } from '@/views/mypage';

/** `/mypage/company` 아래 모든 화면이 기업 마이페이지 껍데기를 공유한다. */
export default function MyPageRouteLayout({ children }: { children: ReactNode }) {
  return <MyPageLayout>{children}</MyPageLayout>;
}
