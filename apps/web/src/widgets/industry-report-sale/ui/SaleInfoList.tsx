import type { SaleInfoRow } from '../model/saleInfo';

/**
 * 구매 카드의 라벨-값 목록. `dl` 이라 스크린 리더가 짝으로 읽는다. 카드 세로 길이를 줄이려고 한 줄에 이어 놓고
 * 폭이 모자라면 줄을 바꾼다 — 값 하나가 줄 하나를 쓰지 않는다.
 */
export function SaleInfoList({ rows }: { rows: SaleInfoRow[] }) {
  return (
    <dl className="flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-gray-50 px-3 py-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex gap-1.5">
          <dt className="text-gray-500">{row.label}</dt>
          <dd className="break-keep text-gray-900">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
