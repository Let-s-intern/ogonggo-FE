'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { isMockEnabled } from '@/shared/config/mocks';

/**
 * 목데이터 모드에서 브라우저 워커가 준비된 뒤에 화면을 그린다. 먼저 그리면 첫 요청이 워커를 지나쳐
 * 실제 서버로 간다. web 의 `MockGate` 와 같다.
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
        console.error('[ogonggo] 브라우저 목 워커를 띄우지 못했습니다.', error);
      })
      .finally(() => setReady(true));
  }, [ready]);

  return ready ? children : null;
}
