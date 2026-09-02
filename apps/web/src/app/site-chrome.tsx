'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

/**
 * 헤더·푸터를 두르지 않는 경로. 소개 페이지(`/about`, 이슈 #18)는 기존 웹과 오가는 링크를
 * 두지 않기로 했는데, 헤더 자체가 채용공고·부트캠프·사이드스터디로 가는 링크 묶음이라 그대로
 * 두면 그 조건이 깨진다.
 */
const CHROMELESS_PREFIXES = ['/about'] as const;

/**
 * 경로에 따라 헤더·푸터를 씌운다.
 *
 * 원래는 라우트 그룹으로 나누는 것이 App Router 다운 방법이다 — 기존 라우트를 `(site)/` 안으로
 * 옮기고 그 그룹 레이아웃에만 헤더·푸터를 두면 클라이언트 컴포넌트가 필요 없다. 지금 그렇게
 * 하지 않은 이유는 다른 브랜치(이슈 #17, 공고 달력)가 `app/` 아래에 새 라우트를 추가하는
 * 중이어서다. 라우트 폴더를 통째로 옮기면 그쪽 새 파일이 그룹 밖에 남아 헤더가 조용히 사라지는
 * 형태로 병합된다. 그 작업이 끝난 뒤 라우트 그룹으로 바꾸는 편이 안전하다.
 *
 * `children`은 이 컴포넌트를 거쳐 가지만 props로 넘어오는 것이라 서버 컴포넌트로 남는다.
 * 이 파일의 `'use client'`가 하위 트리를 클라이언트로 만들지 않는다.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const chromeless = CHROMELESS_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (chromeless) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
