'use client';

import { useEffect, useState } from 'react';

/**
 * `window.matchMedia` 를 구독한다. 서버 렌더에는 뷰포트가 없으므로 첫 렌더는 항상 `false` 를
 * 주고, 마운트 뒤 실제 값으로 갱신한다 — 하이드레이션 불일치를 피하는 값이지, "모바일이 기본"
 * 이라는 뜻은 아니다. 호출부가 그 순간까지의 깜빡임을 감수할 수 있는 자리에서만 쓴다.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    setMatches(mediaQueryList.matches);

    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);
    mediaQueryList.addEventListener('change', listener);
    return () => mediaQueryList.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
