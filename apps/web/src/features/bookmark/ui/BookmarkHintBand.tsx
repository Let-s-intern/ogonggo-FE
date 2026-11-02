'use client';

import { cn } from '@ogonggo/ui';
import { BookmarkIcon } from '@/shared/ui/icons';
import {
  HINT_FADE_CLASS,
  HINT_HIDDEN_CLASS,
  HINT_SHOWN_CLASS,
  useBookmarkHintVisible,
  useRotatingBookmarkHint,
  type BookmarkHintTarget,
} from '../model/useBookmarkHint';

/**
 * 모바일 상세 고정 바 맨 위의 북마크 안내 띠(`StickyApplyBar` 의 `hint`). 둥근 판 안에 있어 마감일 줄이나
 * 본문을 가리지 않는다. 판의 안쪽 여백(`p-3`)만큼 밖으로 빼서 판 위쪽에 꼭 맞춘다.
 *
 * `data-bookmark-hint` 는 의견 보내기 버튼이 늘어난 판 높이만큼 비켜서는 표시다. 데스크톱은 말풍선
 * (`BookmarkHintBubble`)이 대신해 숨긴다.
 */
export function BookmarkHintBand(target: BookmarkHintTarget) {
  const show = useBookmarkHintVisible(target);
  return show ? <Band kind={target.kind} /> : null;
}

function Band({ kind }: Pick<BookmarkHintTarget, 'kind'>) {
  const { message, visible } = useRotatingBookmarkHint(kind);

  return (
    <div
      data-bookmark-hint
      aria-hidden="true"
      className="-mx-3 -mt-3 mb-3 flex h-10 items-center gap-2 rounded-t-2xl bg-blue-50 px-4 md:hidden"
    >
      <BookmarkIcon filled className="h-3.5 w-3.5 shrink-0" />
      <span
        className={cn(
          HINT_FADE_CLASS,
          'min-w-0 truncate text-[13px] font-semibold text-blue-700',
          visible ? HINT_SHOWN_CLASS : HINT_HIDDEN_CLASS,
        )}
      >
        {message}
      </span>
    </div>
  );
}
