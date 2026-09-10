import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DescriptionItem {
  label: string;
  value: ReactNode;
  /** 값이 길면 한 줄을 통째로 쓴다. 본문이나 URL 이 여기 해당한다. */
  full?: boolean;
}

export interface DescriptionListProps {
  items: DescriptionItem[];
  /** 한 줄에 몇 칸을 둘지. 기본 2 칸. */
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const COLUMN_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
} as const;

/*
 * `col-span-${columns}` 로 조립하지 않는다. Tailwind 는 소스를 문자열로 훑기 때문에 만들어진
 * 클래스 이름을 못 보고, 그러면 그 유틸리티가 CSS 에 아예 생성되지 않는다 — 클래스는 붙는데
 * 아무 효과가 없다.
 */
const FULL_SPAN_CLASSES = {
  1: 'col-span-1',
  2: 'col-span-2',
  3: 'col-span-3',
  4: 'col-span-4',
} as const;

/** 상세 화면의 라벨-값 목록. `dl` 이라 스크린 리더가 짝으로 읽는다. */
export function DescriptionList({ items, columns = 2, className }: DescriptionListProps) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-4', COLUMN_CLASSES[columns], className)}>
      {items.map((item) => (
        <div key={item.label} className={item.full ? FULL_SPAN_CLASSES[columns] : undefined}>
          <dt className="pb-1 text-sm text-gray-500">{item.label}</dt>
          <dd className="text-sm text-gray-900">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
