'use client';

import { useEffect, useId, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { fetchContractReportSummary } from '../lib/api';
import { dotDate, formatCount, formatRate } from '../model/format';
import type { ContractReportSummary } from '../model/types';

const TH = 'px-2 py-2 text-right font-medium first:text-left';
const TD = 'px-2 py-2.5 text-right tabular-nums first:text-left';

/**
 * 계약 전체 합계(계약 6.2, 2026-11-19 사용자 결정). 리포트를 열 수 있는 상품의 숫자를 각 상품 기간 전체로 합치고, 아래에
 * 상품마다 한 줄씩 작은 표를 둔다. 표는 접혀 있고 `상품별 보기` 로 연다. 합칠 상품이 없거나 불러오지 못하면 그리지 않는다 — 상품별 리포트가 그 이유를 적는다.
 * 폰에서는 표의 상세 조회 열을 숨겨 가로로 넘치지 않게 한다.
 */
export function ContractReportSummaryCard({ contractId }: { contractId: number }) {
  const [summary, setSummary] = useState<ContractReportSummary | null>(null);
  // 상품별 표는 접어 두고 토글로 연다(2026-11-19 사용자).
  const [showProducts, setShowProducts] = useState(false);
  const tableId = useId();

  useEffect(() => {
    let active = true;
    fetchContractReportSummary(contractId)
      .then((value) => active && setSummary(value))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [contractId]);

  if (!summary || summary.products.length === 0) return null;
  const { total } = summary;
  const hint = `리포트가 있는 상품 ${summary.products.length}개를 각 상품 기간 전체로 합쳤어요.`;
  const stats = [
    ['노출', formatCount(total.impressions)],
    ['클릭', formatCount(total.adClicks)],
    ['클릭률', formatRate(total.adClickRate)],
    ['상세 조회', formatCount(total.views)],
    ['지원하기 클릭', formatCount(total.ctaClicks)],
  ] as const;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-gray-200 p-5">
      <header className="flex items-center gap-1.5">
        <h2 className="text-lg font-semibold text-gray-950">계약 전체 성과</h2>
        {/* 설명은 제목 옆 정보 아이콘의 툴팁으로. */}
        <span
          role="img"
          aria-label={hint}
          title={hint}
          className="icon-[lucide--info] block size-4 shrink-0 text-gray-400"
        />
      </header>
      <dl className="grid grid-cols-3 gap-y-4 rounded-lg bg-gray-50 py-4 md:grid-cols-5">
        {stats.map(([label, value]) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="text-lg font-bold text-gray-900 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        aria-expanded={showProducts}
        aria-controls={tableId}
        onClick={() => setShowProducts((open) => !open)}
        className="flex items-center gap-1 self-start text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        {showProducts ? '접기' : '상품별 보기'}
        <span
          aria-hidden="true"
          className={cn(
            'icon-[lucide--chevron-down] block size-4 transition-transform',
            showProducts && 'rotate-180',
          )}
        />
      </button>
      {showProducts ? (
        <table id={tableId} className="w-full table-fixed text-xs sm:text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className={`${TH} w-[38%]`}>상품</th>
              <th className={TH}>노출</th>
              <th className={TH}>클릭</th>
              <th className={`${TH} hidden md:table-cell`}>상세 조회</th>
              <th className={TH}>지원하기 클릭</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {summary.products.map((product) => (
              <tr key={product.contractProductId}>
                <td className={TD}>
                  <span className="block truncate font-medium text-gray-900">{product.name}</span>
                  <span className="block text-xs text-gray-500">
                    {dotDate(product.startDate)} ~ {dotDate(product.endDate)}
                  </span>
                </td>
                <td className={TD}>{formatCount(product.impressions)}</td>
                <td className={TD}>{formatCount(product.adClicks)}</td>
                <td className={`${TD} hidden md:table-cell`}>{formatCount(product.views)}</td>
                <td className={TD}>{formatCount(product.ctaClicks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
