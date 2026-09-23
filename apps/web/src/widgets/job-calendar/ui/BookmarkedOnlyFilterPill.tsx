'use client';

import Link from 'next/link';
import { useMyBookmarkIds, useBookmarkAccess } from '@/features/bookmark';
import { buildJobCalendarHref, type JobCalendarQuery } from '../lib/query';
import { FilterCheckbox } from './CalendarFilterBar';

/**
 * `스크랩 공고만` 체크박스. 로그인 상태를 서버 컴포넌트가 몰라(`../lib/query.ts`의
 * `bookmarkedOnly` 주석) 이 알약만 클라이언트 컴포넌트로 뗐다 — 나머지 알약은 전부 `<Link>`
 * 하나인 서버 컴포넌트다.
 *
 * **비로그인·기업 회원에게는 그리지 않는다.** `features/bookmark`의 `BookmarkButton`과 같은
 * 판단이다. 다른 곳은 "누르면 로그인 화면으로 간다"로 처리하지만(개별 공고 액션), 이 알약은
 * 누른다고 어떤 공고를 스크랩할지 정해지는 조작이 아니라 **걸러 보는 화면**이다 — 비로그인으로
 * 걸면 내 북마크 id 모음을 부를 수 없어(`useMyBookmarkIds`) 항상 0건이 되고, 그 이유를 알약
 * 하나로는 설명할 수 없다. 그래서 로그인해야 조작할 수 있는 자리 자체를 숨긴다. 결정 근거는
 * `.claude/tasks/memos/결정-달력-스크랩알약-비로그인-2026-09-23.md`.
 */
export function BookmarkedOnlyFilterPill({ query }: { query: JobCalendarQuery }) {
  const access = useBookmarkAccess();

  if (access === 'guest' || access === 'company' || access === 'unknown') {
    return null;
  }

  return (
    <Link
      href={buildJobCalendarHref(query, { bookmarkedOnly: !query.bookmarkedOnly })}
      role="checkbox"
      aria-checked={query.bookmarkedOnly}
      className="rounded-xs"
    >
      <FilterCheckbox label="스크랩 공고만" checked={query.bookmarkedOnly} />
    </Link>
  );
}

/**
 * 격자가 실제로 거를 항목을 정한다. `MonthCalendar`·`WeekGrid` 양쪽에서 쓴다 — 두 곳 다
 * 클라이언트 컴포넌트라 각자 이 훅을 부른다.
 */
export function useBookmarkedIds(): ReadonlySet<number> | undefined {
  return useMyBookmarkIds('jobs');
}
