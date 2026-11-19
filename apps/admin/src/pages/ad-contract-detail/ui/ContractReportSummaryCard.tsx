import { useState } from 'react';
import { Button, Callout, Card, CardTitle, DataTable, type DataTableColumn } from '@ogonggo/ui';
import { enumLabel } from '@ogonggo/api/src/admin';
import {
  useContractReportSummary,
  type ContractReportSummary,
} from '@/entities/advertisement-contract/api/useContractReport';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { formatCount, formatDateRange, formatRate } from '../lib/reportFormat';
import { InfoTip, Tile } from './reportParts';

type Row = ContractReportSummary['products'][number];

/**
 * 계약 전체 합계(API 계약 6.2). 계약 상세 맨 위에서 리포트를 열 수 있는 상품을 상품 기간 전체로 합친다. 상품마다 한 줄씩 작은
 * 표를 둔다. 상품을 하나씩 보는 것은 아래 성과 리포트다.
 *
 * 열 수 있는 상품이 없으면(기간 미정·채널 상품뿐) 카드를 그리지 않는다.
 */
export function ContractReportSummaryCard({ contractId }: { contractId: number }) {
  const { data, isError, error } = useContractReportSummary(contractId);
  const [showProducts, setShowProducts] = useState(false);

  if (isError) {
    return (
      <Callout tone="error">
        {advertisementErrorMessage(error, '계약 전체 합계를 불러오지 못했습니다.')}
      </Callout>
    );
  }
  if (!data || data.products.length === 0) return null;
  const { total } = data;

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      header: '상품',
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-gray-900">{row.name}</span>
          <span className="text-xs text-gray-500">
            {enumLabel('AdvertisementProductCategory', row.category)} ·{' '}
            {formatDateRange(row.startDate, row.endDate)}
          </span>
        </span>
      ),
    },
    ...(
      [
        ['impressions', '노출'],
        ['uniqueImpressions', '순 노출'],
        ['adClicks', '클릭'],
        ['views', '상세 조회'],
        ['ctaClicks', 'CTA 클릭'],
      ] as const
    ).map(([key, header]) => ({
      key,
      header,
      align: 'right' as const,
      render: (row: Row) => formatCount(row[key]),
    })),
  ];

  const tiles: [string, string][] = [
    ['노출', formatCount(total.impressions)],
    ['순 노출', formatCount(total.uniqueImpressions)],
    ['클릭', formatCount(total.adClicks)],
    ['클릭률', formatRate(total.adClickRate)],
    ['상세 조회', formatCount(total.views)],
    ['CTA 클릭', formatCount(total.ctaClicks)],
  ];

  return (
    <Card>
      <div className="flex items-center gap-1.5">
        <CardTitle>계약 전체 성과</CardTitle>
        <InfoTip text="리포트를 열 수 있는 상품을 각 상품 기간 전체(진행 중이면 오늘까지)로 합쳤습니다." />
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {tiles.map(([label, value]) => (
            <Tile key={label} label={label} value={value} />
          ))}
        </div>
        <div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            aria-expanded={showProducts}
            onClick={() => setShowProducts((open) => !open)}
          >
            {showProducts ? '접기 ▴' : '상품별 보기 ▾'}
          </Button>
        </div>
        {showProducts ? (
          <DataTable
            columns={columns}
            rows={data.products}
            rowKey={(row) => row.contractProductId}
          />
        ) : null}
      </div>
    </Card>
  );
}
