'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMediaQuery } from '@/shared/lib/useMediaQuery';
import { MYPAGE_HOME } from '@/widgets/mypage-sidebar';

/**
 * `/mypage/company` 본문. 데스크톱은 첫 메뉴로 넘기고, 모바일은 아무것도 그리지 않는다 — 모바일에서는
 * `MyPageLayout` 의 사이드바가 곧 이 화면이다. web 의 `views/mypage/ui/MyPageIndex.tsx` 와 같다.
 */
export function MyPageIndex() {
  const router = useRouter();
  const desktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (desktop) {
      router.replace(MYPAGE_HOME);
    }
  }, [desktop, router]);

  return null;
}
