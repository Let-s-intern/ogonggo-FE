'use client';

import type { CreateRecruitmentPostRequestPositionsItem } from '@ogonggo/api';
import { Checkbox } from '@ogonggo/ui';
import { ChevronIcon } from '@/shared/ui/icons';
import { POSITION_OPTION_LABELS, POSITION_VALUES } from '../model/options';

export interface PositionSelectProps {
  value: CreateRecruitmentPostRequestPositionsItem[];
  onChange: (value: CreateRecruitmentPostRequestPositionsItem[]) => void;
}

/**
 * 모집 포지션 칸(목업 `프론트엔드, 백엔드...`).
 *
 * **여섯 고정이고 포지션별 인원 칸이 없다**(PRD 5 절). 목업은 자유 입력처럼 보이지만 백엔드가
 * 받는 것은 여섯 값의 배열이고, 인원은 `capacity` 하나뿐이다.
 *
 * 여닫기는 `<details>` 다 — 자바스크립트 없이도 열리고, 작성한 모집글 표의 점 세 개 메뉴
 * (`widgets/my-posts/ui/MyPostRow.tsx`) 가 이미 같은 방식이다.
 */
export function PositionSelect({ value, onChange }: PositionSelectProps) {
  const toggle = (position: CreateRecruitmentPostRequestPositionsItem, checked: boolean) =>
    onChange(
      checked ? [...value, position] : value.filter((selected) => selected !== position),
    );

  return (
    <details className="relative">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-between rounded-md border border-gray-300 px-4 text-base [&::-webkit-details-marker]:hidden">
        <span className={value.length > 0 ? 'truncate text-gray-900' : 'truncate text-gray-400'}>
          {value.length > 0
            ? value.map((position) => POSITION_OPTION_LABELS[position]).join(', ')
            : '포지션을 선택해 주세요.'}
        </span>
        <ChevronIcon className="size-5 shrink-0 text-gray-400" />
      </summary>
      <div className="absolute z-10 mt-1 flex w-full flex-col gap-2 rounded-md border border-gray-200 bg-white p-3 shadow-md">
        {POSITION_VALUES.map((position) => (
          <Checkbox
            key={position}
            checked={value.includes(position)}
            onChange={(checked) => toggle(position, checked)}
            label={POSITION_OPTION_LABELS[position]}
          />
        ))}
      </div>
    </details>
  );
}
