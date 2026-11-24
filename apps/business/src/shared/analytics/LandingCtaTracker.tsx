'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AD_INTRODUCTION_PDF } from '@/shared/config/site';
import { trackBiz } from './bizEvents';

/** 소개 화면에서 행동 유도로 세는 링크의 주소 → `biz_cta` 값. 같은 화면의 `#placements` 같은 쪽지 링크는 세지 않는다. */
const CTA_BY_PATH: Record<string, string> = {
  '/apply': 'apply',
  '/apply/ad': 'apply_ad',
  [AD_INTRODUCTION_PDF]: 'brochure',
};

/**
 * 소개 화면(`/`)의 행동 유도 클릭을 센다. 링크 하나하나에 이벤트를 달지 않고 문서의 클릭을 한 곳에서 듣는다.
 * 소개 화면 파일(`widgets/landing`)이 광고 가격 작업과 같이 바뀌고 있어 그 파일을 건드리지 않으려는 선택이다.
 *
 * 본문(`main`) 안의 `<a>` 만 센다 — 헤더·푸터의 같은 주소 링크는 이 이벤트가 아니다. 새 탭 클릭이나 가운데 클릭도
 * `click` 이 아니라 `auxclick` 으로 오므로 함께 듣는다(왼쪽·가운데 버튼만, 오른쪽 클릭은 세지 않는다).
 */
export function LandingCtaTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') {
      return;
    }
    const handle = (event: MouseEvent) => {
      if (event.button !== 0 && event.button !== 1) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest('a');
      if (!anchor || !anchor.closest('main')) {
        return;
      }
      const cta = CTA_BY_PATH[new URL(anchor.href, window.location.href).pathname];
      if (cta) {
        trackBiz('biz_landing_cta_click', { biz_cta: cta });
      }
    };
    document.addEventListener('click', handle);
    document.addEventListener('auxclick', handle);
    return () => {
      document.removeEventListener('click', handle);
      document.removeEventListener('auxclick', handle);
    };
  }, [pathname]);

  return null;
}
