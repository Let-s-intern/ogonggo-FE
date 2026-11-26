import type { SaleInfoRow } from '../model/saleInfo';

/** 구매 카드의 라벨-값 목록. `dl` 이라 스크린 리더가 짝으로 읽는다. 상세 화면의 정보 박스와 같은 회색 바탕이다. */
export function SaleInfoList({ rows }: { rows: SaleInfoRow[] }) {
  return (
    <dl className="flex flex-col gap-2 rounded-md bg-gray-50 p-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-3">
          <dt className="w-10 shrink-0 text-gray-500">{row.label}</dt>
          <dd className="min-w-0 break-keep text-gray-900">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
