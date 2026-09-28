'use client';

import { createBootcampApplicationUrlClick, createJobSourceUrlClick } from '@ogonggo/api';
import type { BookmarkKind } from '@/features/bookmark';
import { isSignedIn } from '@/shared/api/authTokens';
import { TrackedLink, type TrackedLinkProps } from '@/shared/analytics/TrackedLink';

export type ApplyLinkProps = TrackedLinkProps & {
  kind: BookmarkKind;
  /** 공고·부트캠프 id. 링크의 HTML `id` 속성과 겹치지 않게 이름을 따로 둔다. */
  contentId: number;
};

/**
 * 원문으로 나간 사람을 백엔드에 남긴다(이슈 #149). 사이드 스터디는 기록 API 가 없다. 부트캠프의
 * 이메일 지원(`mailto:`)은 페이지 이동이 아니라 남기지 않는다.
 *
 * 로그인해야 받는 API 라 토큰이 없으면 부르지 않는다. 기다리지 않고 실패도 삼킨다 — 원문은 새
 * 탭으로 이미 열렸고, 기록 하나 못 남긴 것을 사용자에게 알릴 일은 없다.
 */
function recordApplyClick(kind: BookmarkKind, id: number, href: string): void {
  if (!isSignedIn() || !/^https?:/.test(href)) {
    return;
  }
  const request =
    kind === 'jobs'
      ? createJobSourceUrlClick(id)
      : kind === 'bootcamps'
        ? createBootcampApplicationUrlClick(id)
        : null;
  request?.catch(() => {});
}

/**
 * 상세의 지원·신청 버튼 링크. `ApplyCta` 가 서버 컴포넌트라 `onClick` 을 넘길 수 없어 여기서 단다.
 */
export function ApplyLink({ kind, contentId, onClick, ...props }: ApplyLinkProps) {
  return (
    <TrackedLink
      {...props}
      onClick={(e) => {
        recordApplyClick(kind, contentId, String(props.href));
        onClick?.(e);
      }}
    />
  );
}
