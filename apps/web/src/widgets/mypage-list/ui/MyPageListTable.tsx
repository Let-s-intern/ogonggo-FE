import type { ReactNode } from 'react';
import { cn } from '@ogonggo/ui';

export interface MyPageListColumn {
  key: string;
  label: string;
  /** 그 열의 `<th>`·`<td>` 폭. 내용이 길어도 열이 밀리지 않게 호출부가 정한다. */
  className?: string;
}

export interface MyPageListTableProps {
  columns: readonly MyPageListColumn[];
  /** `<tbody>` 안에 들어갈 `<tr>` 들. */
  children: ReactNode;
}

/**
 * 마이페이지 표의 껍데기(목업 `docs/asset/v4 마이페이지/지원 신청내역/`). 둥근 테두리 상자
 * 안에 머리글 한 줄과 행들이 있고, 행 사이에 옅은 가로 선이 있다.
 *
 * `@ogonggo/ui` 의 `DataTable` 을 쓰지 않는다. 그쪽은 `columns[].render` 로 값을 뽑는
 * 데이터 주도형이라 한 행이 여러 종류의 컨트롤(셀렉트·버튼·팝오버) 을 들고 있는 이 표와
 * 맞지 않는다. 여기서는 행을 호출부가 직접 그린다.
 *
 * 열 폭은 `className` 으로 호출부가 정한다. `table-fixed` 라 폭을 주지 않은 열이 남는 폭을
 * 나눠 갖는다 — 제목이 길어져도 마감일 칸이 밀리지 않는다.
 */
export function MyPageListTable({ columns, children }: MyPageListTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full table-fixed border-collapse">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn('px-4 py-3 text-sm font-medium text-gray-500', column.className)}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
