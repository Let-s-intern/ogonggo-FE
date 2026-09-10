import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface DataTableColumn<T> {
  /** React key 이자 컬럼 식별자. */
  key: string;
  header: string;
  /** 숫자 칸은 오른쪽으로 붙인다. */
  align?: 'left' | 'right';
  /** `w-40` 같은 Tailwind 폭 클래스. 비우면 내용에 맞춰 늘어난다. */
  width?: string;
  render: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  /** 행을 눌렀을 때. 넘기면 행에 커서와 호버 배경이 붙는다. */
  onRowClick?: (row: T) => void;
  /** 행이 없을 때 보여줄 문구. */
  emptyMessage?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * 운영 화면의 목록 표.
 *
 * 정렬·필터·페이지네이션을 안에 넣지 않는다. 그 상태는 URL 쿼리스트링에 있어야 하고
 * (PRD `.claude/tasks/memos/prd-admin-console.md` "라우팅"), 이 패키지는 라우터를 모른다.
 * 표는 받은 행을 그리기만 하고 조작은 쓰는 쪽이 한다.
 *
 * 행 클릭을 `onRowClick` 으로 받는다. 각 행을 링크로 감싸면 `next/link` 냐 `react-router` 냐를
 * 골라야 하는데, 이 패키지는 두 앱에서 함께 쓰여 그럴 수 없다.
 *
 * 로딩 중에도 헤더는 남긴다. 표가 통째로 사라졌다 나타나면 페이지를 넘길 때마다 화면이
 * 접혔다 펴진다.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = '결과가 없습니다.',
  isLoading = false,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200 bg-white', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-4 py-3 font-medium text-gray-500',
                  column.align === 'right' ? 'text-right' : 'text-left',
                  column.width,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                불러오는 중입니다.
              </td>
            </tr>
          ) : null}

          {!isLoading && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : null}

          {!isLoading &&
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-gray-100 last:border-b-0',
                  onRowClick ? 'cursor-pointer hover:bg-gray-50' : undefined,
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-3 text-gray-900',
                      column.align === 'right'
                        ? 'text-right [font-variant-numeric:tabular-nums]'
                        : 'text-left',
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
