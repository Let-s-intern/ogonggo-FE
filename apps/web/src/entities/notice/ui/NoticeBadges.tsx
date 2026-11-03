import { NOTICE_TAG_LABELS, type NoticeTag } from '../model/types';

/** 새 글 표시. 파란 동그라미 안의 `N`(시안 `notice-home-*.png`). */
export function NoticeNewBadge() {
  return (
    <span
      aria-label="새 글"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-500"
    >
      N
    </span>
  );
}

/** 오공고 업데이트 태그(`새 기능` · `변경사항`). 회색 작은 칩이다(시안 `notice-update-*.png`). */
export function NoticeTagChip({ tag }: { tag: NoticeTag }) {
  return (
    <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
      {NOTICE_TAG_LABELS[tag]}
    </span>
  );
}
