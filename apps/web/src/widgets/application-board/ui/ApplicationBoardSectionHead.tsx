'use client';

import { cn } from '@ogonggo/ui';
import { ChevronIcon } from '@/shared/ui/icons';

export interface ApplicationBoardSectionHeadProps {
  label: string;
  /** 서버가 센 전체 건수. 접힌 섹션에서도 이 수는 보인다 — 접기는 행만 감춘다. */
  total: number;
  collapsed: boolean;
  onToggle: () => void;
  /** 꺾쇠가 여닫는 영역의 `id`. */
  controls: string;
  /** 첫 섹션(스크랩)인가. 바탕색이 이걸로 갈린다. */
  first: boolean;
}

/**
 * 리스트 보기의 섹션 머리(목업 `docs/asset/v7 스크랩한 공고 칸반/image copy 3.png`).
 * 접기 꺾쇠 · 이름 · 개수다.
 *
 * **꺾쇠가 여기에만 있다.** 칸반의 칸 머리(`ApplicationBoardColumnHead`)에는 목업에 꺾쇠가
 * 없어 그리지 않았고, 리스트 목업 세 장에는 모든 섹션에 있다. 그래서 둘은 같은 컴포넌트가
 * 아니다 — 칸 머리는 글자 한 줄이고 이쪽은 48px 짜리 색 바다.
 *
 * **`완료` 버튼은 없다.** 칸반의 칸 머리와 같은 이유로 뺐다
 * (`.claude/tasks/memos/결정-칸반-완료-버튼-2026-09-23.md`). 이 보기에서는 행마다 상태
 * 셀렉트가 있어 어느 단계로 보낼지 고를 수 있다.
 *
 * 치수는 목업(1440px 폭) 실측이다(2026-09-22). 바 높이 48px, 모서리 16px, 좌우 여백 16px,
 * 꺾쇠 14px. **첫 섹션만 바탕이 `blue-00`(#F5F9FF) 이고 나머지는 `gray-50`(#F9FAFB)** 인데
 * 이것도 실측이다 — 목업 세 장(`image copy 3·4·5.png`) 모두 첫 섹션만 파랗다.
 *
 * **`...` 메뉴는 없다.** 목업에는 있지만 달 메뉴가 `공고 편집` 한 줄뿐이고 그것을 그리지
 * 않기로 한 결정이라(PRD 결정 기록) 누르면 빈 목록이 열리는 버튼만 남는다. 칸반도 같다.
 */
export function ApplicationBoardSectionHead({
  label,
  total,
  collapsed,
  onToggle,
  controls,
  first,
}: ApplicationBoardSectionHeadProps) {
  return (
    <div
      className={cn('flex h-12 items-center rounded-lg px-4', first ? 'bg-blue-00' : 'bg-gray-50')}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={controls}
        className="flex flex-1 items-center gap-3"
      >
        <ChevronIcon
          direction={collapsed ? 'down' : 'up'}
          className="h-3.5 w-3.5 shrink-0 text-gray-500"
        />
        <span className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900">{label}</span>
          <span className="text-base font-medium text-gray-400">{total}</span>
        </span>
      </button>
    </div>
  );
}
