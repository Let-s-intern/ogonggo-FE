'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { Button } from '@ogonggo/ui';

export interface SourceClosedGateProps {
  /** 원문이 남아 있는지 답하는 같은 출처 경로(`app/source-check/[jobId]/route.ts`). */
  checkPath: string;
  /** 원문이 없어졌을 때 버튼 문구. */
  closedLabel: string;
  /** 원문이 있거나 확인 중일 때 그대로 그리는 지원 버튼. */
  children: ReactNode;
}

/**
 * 원문이 없어진 공고의 지원 버튼을 회색 `모집 마감` 으로 바꾼다(이슈 #479).
 *
 * 확인은 화면이 뜬 뒤에 하고 그동안은 지원 버튼을 그대로 둔다. 원문 사이트가 느려도 상세 화면이
 * 기다리지 않고, 확인에 실패하면 버튼이 살아 있는 쪽으로 남는다.
 */
export function SourceClosedGate({ checkPath, closedLabel, children }: SourceClosedGateProps) {
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(checkPath, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { closed?: boolean } | null) => {
        if (body?.closed) {
          setClosed(true);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [checkPath]);

  if (!closed) {
    return children;
  }
  return (
    <Button disabled className="flex-1 disabled:bg-gray-300 disabled:text-white">
      {closedLabel}
    </Button>
  );
}
