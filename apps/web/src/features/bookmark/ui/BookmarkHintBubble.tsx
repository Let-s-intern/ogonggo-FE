'use client';

import { cn } from '@ogonggo/ui';
import type { BookmarkKind } from '../api/bookmarkApi';
import {
  HINT_FADE_CLASS,
  HINT_HIDDEN_CLASS,
  HINT_SHOWN_CLASS,
  useRotatingBookmarkHint,
} from '../model/useBookmarkHint';

/**
 * 데스크톱 상세의 북마크 버튼 위 말풍선. 모양은 의견 보내기 말풍선(`ServiceFeedbackButton`)과 같고 꼬리만
 * 좌우가 뒤집혀 아래 버튼을 가리킨다. 모바일은 고정 바의 띠(`BookmarkHintBand`)가 대신한다.
 *
 * 스크린 리더에는 숨긴다. 문구가 바뀔 때마다 다시 읽히면 방해가 된다. 말풍선이 버튼을 가리지 않도록
 * 눌림도 받지 않는다.
 */
export function BookmarkHintBubble({ kind }: { kind: BookmarkKind }) {
  const { message, visible } = useRotatingBookmarkHint(kind);

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-0 bottom-full z-10 mb-3.5 hidden drop-shadow-[0_4px_10px_rgba(17,24,39,0.14)] md:block"
    >
      <span className="block rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-gray-700">
        <span className={cn(HINT_FADE_CLASS, visible ? HINT_SHOWN_CLASS : HINT_HIDDEN_CLASS)}>
          {message}
        </span>
      </span>
      <svg
        viewBox="0 0 18 14"
        className="absolute right-4 -bottom-[13px] h-3.5 w-[18px] -scale-x-100 fill-white"
      >
        <path d="M0 0H14C14 6 15.5 10.5 18 14C11 12.5 5 8 0 0Z" />
      </svg>
    </span>
  );
}
