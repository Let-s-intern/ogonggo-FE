'use client';

import { BookmarkIcon } from '@/shared/ui/icons';
import type { BookmarkKind } from '../api/bookmarkApi';
import { useBookmarkAccess } from '../model/useMyBookmarkIds';
import { useToggleBookmark } from '../model/useToggleBookmark';

export interface BookmarkCountButtonProps {
  kind: BookmarkKind;
  id: number;
  /** 서버가 준 `bookmarked`. id 모음이 도착하면 그쪽이 이긴다. */
  bookmarked: boolean;
  /** 서버가 준 북마크 개수. */
  bookmarkCount: number;
}

/**
 * 상세 CTA 옆의 북마크 아이콘과 개수(`shared/ui/ApplyCta.tsx` 의 오른쪽 칸).
 *
 * 개수는 서버 값에서 시작해 이 화면에서 누른 만큼 ±1 한다. 등록·해제 응답에 개수가 없어
 * (`SuccessResponseUnit`) 서버 값으로 다시 맞출 수 없다. 새로고침하면 서버 값이 된다.
 *
 * **기업 회원에게는 개수도 보이지 않는다.** 개수와 버튼이 한 칸이라 따로 떼면 누를 수 없는
 * 개수만 남는다. 기업 회원의 상세 CTA 는 지원·신청 버튼 하나다. 역할을 아직 모르는 동안에도
 * 그리지 않는 이유는 카드 버튼과 같다.
 */
export function BookmarkCountButton({
  kind,
  id,
  bookmarked: serverBookmarked,
  bookmarkCount,
}: BookmarkCountButtonProps) {
  const access = useBookmarkAccess();
  const { bookmarked, countDelta, pending, toggle } = useToggleBookmark({
    kind,
    id,
    bookmarked: serverBookmarked,
  });

  if (access === 'company' || access === 'unknown') {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="북마크"
      aria-pressed={bookmarked}
      aria-disabled={pending || undefined}
      onClick={toggle}
      className="flex h-11 cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 px-3 text-xs text-gray-500"
    >
      <BookmarkIcon filled={bookmarked} className="h-4 w-4" />
      {/* 서버 값이 오래됐을 때 음수가 보이지 않게 막는다. 개수가 0 인 공고를 푸는 경우다. */}
      <span>{Math.max(0, bookmarkCount + countDelta)}</span>
    </button>
  );
}
