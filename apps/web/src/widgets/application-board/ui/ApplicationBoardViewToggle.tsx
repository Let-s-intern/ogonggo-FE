import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import { buildApplicationBoardHref, type ApplicationBoardQuery } from '../lib/query';

export interface ApplicationBoardViewToggleProps {
  query: ApplicationBoardQuery;
}

/**
 * 필터 줄 오른쪽 끝의 보기 전환(목업 `docs/asset/v7 스크랩한 공고 칸반/icon/`).
 *
 * **버튼 하나이고, 그린 아이콘이 지금 보기다.** 에셋 두 장이 그 두 상태다 — 칸반일 때는
 * `blue-50`(#EBF1FF) 바탕에 파란 칸반 글리프, 리스트일 때는 `gray-600`(#4B5563) 바탕에
 * 옅은 목록 글리프다. 목업 두 장(`image.png` 칸반, `image copy 3.png` 리스트) 의 같은
 * 자리에서 색이 이렇게 갈린다.
 *
 * 누르면 다른 보기로 간다. 그림이 지금 보기라 `aria-label` 은 그림이 아니라 **갈 곳**을
 * 말한다 — 아이콘만으로는 "지금 이것" 인지 "누르면 이것" 인지 알 수 없다.
 *
 * `<button>` 이 아니라 `<Link>` 다. 보기가 주소에 있어(`lib/query.ts`) 이 줄의 다른
 * 컨트롤과 같은 종류의 이동이고, 그래야 새 탭으로도 열린다.
 *
 * 치수는 목업 실측이다(2026-09-22). 버튼 32x32, 모서리 8px, 글리프 18px, 정렬 드롭다운과
 * 20px 떨어져 있다 — 줄 자체의 `gap-2`(8px) 에 `ml-3`(12px) 을 더한 값이다.
 *
 * 글리프는 에셋 PNG 가 아니라 lucide 다. 에셋은 바탕색까지 구워진 64px 그림이라 두 상태의
 * 색을 클래스로 바꿀 수 없고, 저장소의 아이콘은 전부 Iconify 마스크다
 * (`packages/ui/src/styles/tokens.css`).
 *
 * 모바일에서는 칸반 보기 자체가 없다(`.claude/tasks/memos/결정-모바일-칸반-차단-브레이크포인트-2026-09-23.md`)
 * — `hidden md:flex` 로 `md`(768px) 미만에서 안 보인다. `ApplicationBoard.tsx` 가 같은 지점
 * 아래에서 `query.view` 와 무관하게 리스트를 강제 렌더하므로, 이 버튼이 보였다면 눌러도 갈 곳이
 * 실제로 있다.
 */
export function ApplicationBoardViewToggle({ query }: ApplicationBoardViewToggleProps) {
  const kanban = query.view === 'kanban';

  return (
    <Link
      href={buildApplicationBoardHref(query, { view: kanban ? 'list' : 'kanban' })}
      aria-label={kanban ? '리스트 보기로 바꾸기' : '칸반 보기로 바꾸기'}
      className={cn(
        'ml-3 hidden h-8 w-8 shrink-0 items-center justify-center rounded-sm md:flex',
        kanban ? 'bg-blue-50 text-blue-500' : 'bg-gray-600 text-gray-200',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'block h-4.5 w-4.5',
          kanban ? 'icon-[lucide--layout-dashboard]' : 'icon-[lucide--layout-list]',
        )}
      />
    </Link>
  );
}
