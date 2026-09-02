import type { ReactNode } from 'react';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

/**
 * 서비스 본 화면들의 껍데기. 헤더와 푸터가 여기 붙는다.
 *
 * 루트 레이아웃이 아니라 이 그룹 레이아웃이 헤더를 다는 이유는 소개 페이지(`/about`) 때문이다.
 * 그 화면은 기존 웹과 오가는 링크를 두지 않기로 했는데(이슈 #18) 헤더 자체가 채용공고·부트캠프·
 * 사이드스터디로 가는 링크 묶음이다.
 *
 * 처음에는 루트 레이아웃에 클라이언트 컴포넌트를 두고 `usePathname`으로 경로를 보고 껍데기를
 * 뺐다. 그게 틀렸다 — 서버 렌더 결과에는 헤더가 그대로 들어가서, `/about` 첫 화면에 헤더가
 * 그려졌다가 하이드레이션 후 사라지는 깜빡임이 생겼다. 라우트 그룹은 서버에서 갈리므로 그 문제가
 * 없다.
 *
 * `(site)`는 괄호 이름이라 URL에 나타나지 않는다 — `(site)/calendar/page.tsx`는 그대로
 * `/calendar`다.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
