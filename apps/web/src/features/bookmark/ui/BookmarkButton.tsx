'use client';

import { cn } from '@ogonggo/ui';
import { BookmarkIcon } from '@/shared/ui/icons';
import type { BookmarkKind } from '../api/bookmarkApi';
import { useBookmarkAccess } from '../model/useMyBookmarkIds';
import { useToggleBookmark } from '../model/useToggleBookmark';

export interface BookmarkButtonProps {
  kind: BookmarkKind;
  id: number;
  /** 서버가 준 `bookmarked`. id 모음이 도착하면 그쪽이 이긴다. */
  bookmarked: boolean;
  /** 카드가 정하는 자리. 카드마다 아이콘이 놓이는 곳이 달라 바깥이 준다. */
  className?: string;
  /** 아이콘 크기. 카드는 `h-6 w-6`, 사이드·스터디 카드처럼 작은 자리는 `h-5 w-5` 다. */
  iconClassName?: string;
}

/**
 * 목록 카드 위의 북마크 아이콘 버튼.
 *
 * **기업 회원에게는 그리지 않는다.** 빈 자리도 남기지 않는다 — 스크랩 화면이 일반 회원
 * 마이페이지에만 있어 기업 회원이 북마크하면 어디서도 볼 수 없는 북마크가 쌓인다.
 * **역할을 아직 모르는 동안에도 그리지 않는다.** 보였다가 사라지는 것보다 늦게 나타나는 편이
 * 낫다. 로그인하지 않았으면 보이고, 누르면 로그인 화면으로 간다.
 *
 * 카드 안에서는 `<Link>` 의 형제로 둔다. 링크 안에 버튼을 넣으면 잘못된 마크업이고 누를 때
 * 이동까지 함께 일어난다(PRD "카드 안의 버튼은 링크 밖에 둔다").
 *
 * 요청이 도는 동안 `disabled` 를 걸지 않는다. 비활성 버튼은 초점을 잃어, 키보드로 누른 사람이
 * 응답과 함께 자기 자리를 잃는다. 다시 눌러도 아무 일도 일어나지 않게 막는 것은
 * `useToggleBookmark` 다.
 */
export function BookmarkButton({
  kind,
  id,
  bookmarked: serverBookmarked,
  className,
  iconClassName,
}: BookmarkButtonProps) {
  const access = useBookmarkAccess();
  const { bookmarked, pending, toggle } = useToggleBookmark({
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
      className={cn('cursor-pointer', className)}
    >
      <BookmarkIcon filled={bookmarked} className={cn('h-6 w-6', iconClassName)} />
    </button>
  );
}
