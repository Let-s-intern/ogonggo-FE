import { type ReactNode } from 'react';
import { Button } from '@ogonggo/ui';
import { moveRow } from '../model/values';

interface OrderedRowsProps<T> {
  rows: T[];
  onChange: (rows: T[]) => void;
  /** 줄을 더할 때 넣을 빈 값. */
  empty: T;
  addLabel: string;
  renderRow: (row: T, index: number, update: (row: T) => void) => ReactNode;
}

/**
 * 순서가 있는 줄 목록(제휴사·커리큘럼). 위·아래 버튼으로 옮긴 자리가 곧 순서다(`displayOrder`). 마지막 한 줄은 지우지 않고 비운다 —
 * 줄이 하나도 없으면 무엇을 적는 자리인지 보이지 않는다.
 */
export function OrderedRows<T>({
  rows,
  onChange,
  empty,
  addLabel,
  renderRow,
}: OrderedRowsProps<T>) {
  const update = (index: number) => (row: T) =>
    onChange(rows.map((current, at) => (at === index ? row : current)));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, index) => (
        // 줄에 고유한 값이 없어 자리를 키로 쓴다. 옮기면 입력 칸이 새 값으로 다시 그려진다.
        <div key={index} className="flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-2">{renderRow(row, index, update(index))}</div>
          <Button
            size="sm"
            variant="ghost"
            disabled={index === 0}
            onClick={() => onChange(moveRow(rows, index, index - 1))}
          >
            위로
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={index === rows.length - 1}
            onClick={() => onChange(moveRow(rows, index, index + 1))}
          >
            아래로
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange(rows.length === 1 ? [empty] : rows.filter((_, at) => at !== index))
            }
          >
            삭제
          </Button>
        </div>
      ))}
      <div>
        <Button size="sm" variant="secondary" onClick={() => onChange([...rows, empty])}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
