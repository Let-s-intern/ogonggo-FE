'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { track, type DataLayerEvent } from './dataLayer';

export type TrackedLinkProps = ComponentProps<typeof Link> & {
  /** 누르는 순간 보낼 이벤트. 필터를 바꾸면 해제와 선택 두 건이 나가 배열이다. */
  events: DataLayerEvent[];
};

/**
 * 누르면 이벤트를 보내고 이동하는 링크.
 *
 * 카드·필터·상세 버튼 대부분이 서버 컴포넌트라 `onClick` 을 달 수 없다. 이벤트 내용은 서버에서
 * 만들어 넘기고, 누르는 일만 여기서 받는다.
 *
 * 보내는 시점은 핸들러 처음, 이동 전이다(명세 2장). 같은 탭 이동은 SPA 라우팅이라 페이지가
 * 내려가지 않고, 외부 링크는 전부 새 탭이라 `eventCallback` 이 필요 없다.
 */
export function TrackedLink({ events, onClick, ...props }: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        for (const { event, params } of events) {
          track(event, params);
        }
        onClick?.(e);
      }}
    />
  );
}
