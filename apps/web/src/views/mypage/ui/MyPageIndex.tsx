'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMediaQuery } from '@/shared/lib/useMediaQuery';
import { type MyPageAudience, myPageHomeFor } from '@/widgets/mypage-sidebar';

export interface MyPageIndexProps {
  audience: MyPageAudience;
}

/**
 * `/mypage/company` 본문. 데스크톱은 전처럼 첫 메뉴로 넘기고, 모바일은 아무것도 그리지 않는다 —
 * 모바일에서는 `MyPageLayout` 의 사이드바(프로필 카드와 메뉴)가 곧 이 화면이다. 일반 회원
 * `/mypage` 는 모바일도 탭이라 서버에서 첫 탭으로 보낸다(`app/(site)/mypage/page.tsx`).
 *
 * 너비는 브라우저만 알아서 서버 `redirect` 로는 가를 수 없다. 데스크톱에서는 첫 렌더 뒤에
 * 넘어가므로 사이드바가 잠깐 먼저 보인다.
 */
export function MyPageIndex({ audience }: MyPageIndexProps) {
  const router = useRouter();
  const desktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (desktop) {
      router.replace(myPageHomeFor(audience));
    }
  }, [desktop, audience, router]);

  return null;
}
