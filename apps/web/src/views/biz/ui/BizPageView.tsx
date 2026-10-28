'use client';

import { useEffect, useRef } from 'react';
import { trackBiz } from '../model/analytics';

/**
 * `/biz` 조회 이벤트를 마운트에서 한 번 보낸다. 그리는 것은 없다.
 *
 * 개발 모드의 StrictMode 는 effect 를 두 번 돌린다. 같은 컴포넌트에서 ref 는 남으므로 그것으로 한 번만 보낸다.
 */
export function BizPageView() {
  const sent = useRef(false);
  useEffect(() => {
    if (!sent.current) {
      sent.current = true;
      trackBiz('biz_page_view');
    }
  }, []);
  return null;
}
