'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { isMockEnabled } from '@/shared/config/mocks';

/**
 * 목데이터 모드에서 브라우저 워커가 준비된 뒤에 화면을 그린다. 마이페이지처럼 브라우저에서 부르는
 * 요청도 목데이터를 받게 하려는 것이다. 먼저 그리면 첫 요청이 워커를 지나쳐 실제 서버로 간다.
 *
 * 목데이터가 꺼져 있으면 아무것도 하지 않고 그대로 그린다. 켜져 있으면 서버에서도 비워 두어야
 * 첫 렌더가 서버와 어긋나지 않는다 — `isMockEnabled` 는 빌드 때 박혀 양쪽이 같은 값을 본다.
 */
export function MockGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isMockEnabled);

  useEffect(() => {
    if (ready) {
      return;
    }
    void import('@/shared/mocks/startMockWorker')
      .then(({ startMockWorker }) => startMockWorker())
      .catch((error: unknown) => {
        // 워커가 못 떠도 화면은 그린다. 요청은 실제 서버로 가고, 이유는 콘솔에 남는다.
        console.error('[ogonggo] 브라우저 목 워커를 띄우지 못했습니다.', error);
      })
      .finally(() => setReady(true));
  }, [ready]);

  return ready ? children : null;
}
