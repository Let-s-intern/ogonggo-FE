import Link from 'next/link';
import type { ApplicationBoardItem } from '@/features/application-board';
import { Thumbnail } from '@/shared/ui/Thumbnail';

export interface ApplicationBoardRowProps {
  item: ApplicationBoardItem;
}

/**
 * 리스트 보기의 행 하나(목업 `docs/asset/v7 스크랩한 공고 칸반/image copy 3.png`).
 * 로고 · 회사명 · 제목 · 메타다.
 *
 * `widgets/mypage-list/ui/MyPageListRowCells.tsx` 를 쓰지 않는다. 그쪽은 `<td>` 두 칸을
 * 내주는 표 전용이고 이 목록에는 표 머리가 없다 — 목업에 열 이름 줄이 없고, 섹션 머리가
 * 그 자리를 대신한다. 제목만 링크인 것은 그쪽과 같은 이유다: 행 전체를 링크로 감싸면 뒤에
 * 붙는 셀렉트와 버튼이 그 안에 들어간다.
 *
 * 치수는 목업(1440px 폭) 실측이다(2026-09-22). 행 높이 100px, 좌우 여백 24px, 썸네일 40px,
 * 썸네일과 글자 사이 20px, 행 사이 `gray-200` 가로선 1px.
 */
export function ApplicationBoardRow({ item }: ApplicationBoardRowProps) {
  return (
    <div className="flex items-center border-b border-gray-200 px-6 py-5.5">
      <Thumbnail
        src={item.thumbnailUrl}
        alt=""
        className="mr-5 h-10 w-10 shrink-0 rounded-md border border-gray-100"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-gray-600">{item.caption}</p>
        <Link
          href={item.href}
          className="block truncate text-base font-bold text-gray-900 hover:underline"
        >
          {item.title}
        </Link>
        <p className="truncate text-xs text-gray-400">{item.meta.join(' · ')}</p>
      </div>
    </div>
  );
}
