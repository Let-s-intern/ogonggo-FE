import { DataTable, type DataTableColumn, cn } from '@ogonggo/ui';
import type { RedashQueryResult, RedashRow } from '@/shared/api/redash';
import { formatCell } from '../lib/format';

interface ResultTableProps {
  result: RedashQueryResult;
  /** 보여줄 컬럼과 순서. 비우면 Redash 결과의 컬럼 전부다. */
  columns?: string[];
  /** 행이 많은 표는 이 높이에서 스크롤한다. 픽셀. */
  maxHeight?: keyof typeof MAX_HEIGHT_CLASSES;
}

/*
 * 높이를 표 자신(`DataTable` 의 바깥 틀)에 준다. 그 틀이 가로 스크롤을 하므로 세로 스크롤도 같은 틀이
 * 해야 머리글의 `sticky` 가 걸린다. 감싼 div 에 높이를 주면 머리글이 행과 함께 밀려 올라간다.
 */
const MAX_HEIGHT_CLASSES = {
  360: 'max-h-[360px]',
  480: 'max-h-[480px]',
} as const;

interface IndexedRow {
  index: number;
  row: RedashRow;
}

/** Redash 결과를 그대로 표로. 숫자 컬럼은 오른쪽으로 붙이고 비율 컬럼에는 `%` 를 붙인다. */
export function ResultTable({ result, columns, maxHeight }: ResultTableProps) {
  const numeric = new Set(
    result.columns
      .filter(({ type }) => type === 'integer' || type === 'float')
      .map(({ name }) => name),
  );
  const names = columns ?? result.columns.map(({ name }) => name);

  const tableColumns: DataTableColumn<IndexedRow>[] = names.map((name) => ({
    key: name,
    header: name,
    align: numeric.has(name) ? 'right' : 'left',
    cellClassName: 'whitespace-nowrap',
    render: ({ row }) => formatCell(name, row[name] ?? null),
  }));

  return (
    <DataTable
      columns={tableColumns}
      rows={result.rows.map((row, index) => ({ index, row }))}
      rowKey={({ index }) => index}
      emptyMessage="이 조건에 해당하는 데이터가 없습니다."
      className={cn(
        '[&_th]:whitespace-nowrap [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10',
        maxHeight ? MAX_HEIGHT_CLASSES[maxHeight] : undefined,
      )}
    />
  );
}
