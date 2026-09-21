'use client';

import type { ReactNode } from 'react';

export interface BootcampOrderableRowProps {
  /** 보조기기가 읽을 이름 앞머리(`커리큘럼 2단계`). 손잡이와 삭제 버튼이 함께 쓴다. */
  label: string;
  index: number;
  count: number;
  /** 행을 `from` 자리에서 `to` 자리로 옮긴다. 범위 밖이면 부모가 무시한다. */
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  children: ReactNode;
}

/**
 * 순서를 가진 반복 행 하나(목업 `교육 부트캠프 공고 등록.png` 의 커리큘럼).
 *
 * `partners` 와 `curriculums` 는 각각 `displayOrder` 를 가지고, 공개 상세가 그 값으로 정렬해
 * 그린다(`widgets/bootcamp-detail/ui/BootcampCurriculum.tsx`). **목업의 드래그 손잡이가 그
 * 값이다** — 채용공고의 채용 절차에는 순서를 담을 곳이 없어 손잡이를 그리지 않았지만
 * (`결정-기업-마이페이지-push3-2026-09-21.md` 10 절), 여기는 사정이 다르다.
 *
 * 끄는 것은 손잡이뿐이다. 행 전체를 `draggable` 로 두면 칸 안의 글자를 긁어 고를 수 없다.
 *
 * 손잡이에 초점을 두고 위·아래 화살표로도 옮길 수 있다. 끌기는 마우스를 쓸 수 있는 사람만의
 * 길이고, 그 길밖에 없으면 키보드로는 순서를 못 바꾼다.
 */
export function BootcampOrderableRow({
  label,
  index,
  count,
  onMove,
  onRemove,
  children,
}: BootcampOrderableRowProps) {
  return (
    <div
      className="flex items-center gap-2"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const from = Number(event.dataTransfer.getData('text/plain'));
        if (Number.isInteger(from)) {
          onMove(from, index);
        }
      }}
    >
      <button
        type="button"
        draggable
        aria-label={`${label} 순서 바꾸기`}
        title="끌어서 옮기거나 위·아래 화살표를 누르세요"
        onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            onMove(index, index - 1);
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            onMove(index, index + 1);
          }
        }}
        className="flex size-8 shrink-0 cursor-grab items-center justify-center rounded text-gray-400"
      >
        <span aria-hidden="true" className="icon-[lucide--grip-vertical] block size-4" />
      </button>

      {children}

      <button
        type="button"
        aria-label={`${label} 삭제`}
        disabled={count === 1}
        onClick={onRemove}
        className="flex size-11 shrink-0 items-center justify-center rounded-md border border-gray-300 text-gray-400 disabled:cursor-not-allowed disabled:text-gray-200"
      >
        <span aria-hidden="true" className="icon-[lucide--trash-2] block size-4" />
      </button>
    </div>
  );
}
