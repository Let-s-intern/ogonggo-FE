import type { ReactNode } from 'react';
import { SiteFrame } from './SiteFrame';

/**
 * 공개 화면(랜딩·광고 신청·무료 홍보·로그인·가입)의 틀. 로그인 여부에 따라 모양이 바뀐다(`SiteFrame`). 경로는 괄호
 * 폴더라 주소에 들어가지 않는다.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteFrame>{children}</SiteFrame>;
}
