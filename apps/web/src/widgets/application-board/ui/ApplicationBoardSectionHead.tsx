'use client';

import { cn, useToast } from '@ogonggo/ui';
import { ChevronIcon } from '@/shared/ui/icons';
import { STAGE_NOT_OPEN_MESSAGE } from './ApplicationBoardColumnHead';

export interface ApplicationBoardSectionHeadProps {
  label: string;
  /** 서버가 센 전체 건수. 접힌 섹션에서도 이 수는 보인다 — 접기는 행만 감춘다. */
  total: number;
  /** `완료` 버튼을 그릴 섹션인가. 칸반의 칸 머리와 같은 조건이다. */
  showComplete: boolean;
  collapsed: boolean;
  onToggle: () => void;
  /** 꺾쇠가 여닫는 영역의 `id`. */
  controls: string;
  /** 첫 섹션(스크랩)인가. 바탕색이 이걸로 갈린다. */
  first: boolean;
}

/**
 * 리스트 보기의 섹션 머리(목업 `docs/asset/v7 스크랩한 공고 칸반/image copy 3.png`).
 * 접기 꺾쇠 · 이름 · 개수, `지원 준비 중` 섹션에만 오른쪽에 `완료` 다.
 *
 * **꺾쇠가 여기에만 있다.** 칸반의 칸 머리(`ApplicationBoardColumnHead`)에는 목업에 꺾쇠가
 * 없어 그리지 않았고, 리스트 목업 세 장에는 모든 섹션에 있다. 그래서 둘은 같은 컴포넌트가
 * 아니다 — 칸 머리는 글자 한 줄이고 이쪽은 48px 짜리 색 바다.
 *
 * `완료` 가 눌렸을 때의 문구는 칸 머리에서 가져온다. 같은 버튼이 두 보기에 있는데 문구가
 * 갈리면 같은 조작이 화면마다 다른 말을 하게 된다.
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
  showComplete,
  collapsed,
  onToggle,
  controls,
  first,
}: ApplicationBoardSectionHeadProps) {
  const toast = useToast();

  return (
    <div
      className={cn(
        'flex h-12 items-center rounded-lg px-4',
        first ? 'bg-blue-00' : 'bg-gray-50',
      )}
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
      {showComplete ? (
        <button
          type="button"
          className="text-sm font-semibold text-blue-500"
          onClick={() => toast.show({ message: STAGE_NOT_OPEN_MESSAGE, tone: 'error' })}
        >
          완료
        </button>
      ) : null}
    </div>
  );
}
