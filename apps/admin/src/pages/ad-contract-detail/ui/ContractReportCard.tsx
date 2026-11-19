import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Button,
  Callout,
  Card,
  CardTitle,
  DataTable,
  Input,
  Select,
  type DataTableColumn,
} from '@ogonggo/ui';
import { enumLabel, type AdminAdvertisementContractDetailResponse } from '@ogonggo/api/src/admin';
import {
  downloadReportCsv,
  reportProductsOf,
  useContractReport,
  type ContractProductReport,
  type ReportRange,
  type ReportableContractProduct,
} from '@/entities/advertisement-contract/api/useContractReport';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';
import { exportPdf } from '@/shared/lib/exportPdf';
import { EChart } from '@/shared/ui/EChart';
import {
  SOURCE_LABELS,
  addDays,
  dailyChartOption,
  formatCount,
  formatPercent,
  formatRate,
  formatSeconds,
  isBeforeCollection,
} from '../lib/reportFormat';

type Daily = ContractProductReport['daily'][number];
type Exposure = ContractProductReport['exposures'][number];
type Target = ContractProductReport['targets'][number];

const UNAVAILABLE_MESSAGES: Record<string, string> = {
  NO_PERIOD:
    '게시 기간이 없는 상품이라 리포트를 열 수 없습니다. 기간을 넣어 상품을 다시 붙이면 열립니다.',
  NOT_EXPOSABLE:
    '인스타그램·카카오 채널 상품은 오공고가 숫자를 모으지 않아 리포트가 없습니다(집계 대상 아님).',
};

function todayKst(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** 고르기 목록의 상품 이름. 기간과 진행 상태를 붙인다. */
function productOptionLabel(product: ReportableContractProduct): string {
  if (product.reportUnavailableReason === 'NOT_EXPOSABLE') {
    return `${product.productName} · 집계 대상 아님`;
  }
  if (!product.startDate || !product.endDate) return `${product.productName} · 기간 미정`;
  const today = todayKst();
  const state = today < product.startDate ? '예정' : today > product.endDate ? '끝남' : '진행 중';
  return `${product.productName} · ${product.startDate} ~ ${product.endDate} · ${state}`;
}

/**
 * 계약 상품별 성과 리포트(PRD 6.6·6.7). 비즈니스 앱의 리포트와 같은 구성이다 — 상품 고르기 → 기간 좁히기 → 상품 몫 요약 →
 * 날짜별 추이 → 소재별 표 → 대상 공고 전체 숫자와 유입 경로별 나눔 → 지표 정의.
 *
 * PDF 는 통계 화면과 같은 방식(화면을 그림으로 떠서 A4 로 나눔), CSV 는 서버의 `report.csv` 를 그대로 받는다.
 */
export function ContractReportCard({
  contract,
}: {
  contract: AdminAdvertisementContractDetailResponse;
}) {
  const products = reportProductsOf(contract);
  const [chosenId, setChosenId] = useState<number | null>(null);
  const product =
    products.find((item) => item.contractProductId === chosenId) ??
    products.find((item) => item.reportAvailable) ??
    products[0] ??
    null;

  return (
    <Card>
      <CardTitle>성과 리포트</CardTitle>
      <div className="mt-3 flex flex-col gap-4">
        {product === null ? (
          <p className="text-sm text-gray-500">
            계약 상품이 없습니다. 위 계약 상품에 판매한 상품을 기간과 함께 넣으면 리포트가 열립니다.
          </p>
        ) : (
          <>
            <Select
              aria-label="리포트 상품"
              className="max-w-full"
              options={products.map((item) => ({
                value: String(item.contractProductId),
                label: productOptionLabel(item),
              }))}
              value={String(product.contractProductId)}
              onChange={(event) => setChosenId(Number(event.target.value))}
            />
            {product.reportAvailable ? (
              <ProductReport
                key={product.contractProductId}
                contract={contract}
                product={product}
              />
            ) : (
              <Callout tone="info">
                {UNAVAILABLE_MESSAGES[product.reportUnavailableReason ?? 'NO_PERIOD']}
              </Callout>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function ProductReport({
  contract,
  product,
}: {
  contract: AdminAdvertisementContractDetailResponse;
  product: ReportableContractProduct;
}) {
  const [range, setRange] = useState<ReportRange>({ from: '', to: '' });
  const {
    data: report,
    isPending,
    isError,
    error,
    isFetching,
  } = useContractReport(contract.id, product.contractProductId, range);
  const rootRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const chartOption = useMemo(() => (report ? dailyChartOption(report) : null), [report]);
  const rangeInvalid = Boolean(range.from && range.to && range.from > range.to);

  const fileBase = report
    ? `오공고-리포트-${contract.companyName}-${product.productName}-${report.from}_${report.to}`
    : '';

  const run = async (kind: 'pdf' | 'csv') => {
    if (!report) return;
    setExporting(kind);
    setExportError(null);
    try {
      if (kind === 'pdf') {
        if (rootRef.current) await exportPdf(rootRef.current, `${fileBase}.pdf`);
      } else {
        await downloadReportCsv(contract.id, product.contractProductId, range, `${fileBase}.csv`);
      }
    } catch (failure) {
      setExportError(advertisementErrorMessage(failure, '파일을 만들지 못했습니다.'));
    } finally {
      setExporting(null);
    }
  };

  return (
    <div ref={rootRef} className="flex flex-col gap-4 bg-white">
      <div className="flex flex-wrap items-center gap-2" data-pdf-block>
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="리포트 시작일"
            value={range.from || report?.from || ''}
            min={product.startDate}
            max={product.endDate}
            onChange={(event) => setRange((current) => ({ ...current, from: event.target.value }))}
            className="h-9 w-36 px-2 text-sm"
          />
          <span className="text-sm text-gray-400">~</span>
          <Input
            type="date"
            aria-label="리포트 종료일"
            value={range.to || report?.to || ''}
            min={product.startDate}
            max={product.endDate}
            onChange={(event) => setRange((current) => ({ ...current, to: event.target.value }))}
            className="h-9 w-36 px-2 text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="secondary"
          data-pdf-hide
          disabled={!range.from && !range.to}
          onClick={() => setRange({ from: '', to: '' })}
        >
          상품 기간 전체
        </Button>
        <div className="ml-auto flex gap-2" data-pdf-hide>
          <Button
            size="sm"
            variant="secondary"
            disabled={!report || isFetching || exporting !== null}
            onClick={() => void run('pdf')}
          >
            {exporting === 'pdf' ? 'PDF 만드는 중' : 'PDF 다운로드'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!report || isFetching || exporting !== null}
            onClick={() => void run('csv')}
          >
            {exporting === 'csv' ? 'CSV 받는 중' : 'CSV 다운로드'}
          </Button>
        </div>
      </div>
      {rangeInvalid ? <Callout tone="error">시작일은 종료일과 같거나 앞서야 해요.</Callout> : null}
      {exportError ? <Callout tone="error">{exportError}</Callout> : null}

      {isError ? (
        <Callout tone="error">
          {advertisementErrorMessage(error, '리포트를 불러오지 못했습니다.')}
        </Callout>
      ) : isPending || !report ? (
        <p className="py-10 text-center text-sm text-gray-400">불러오는 중</p>
      ) : (
        <ReportBody report={report} chartOption={chartOption} />
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2" data-pdf-block>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="pt-1 text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function ReportBody({
  report,
  chartOption,
}: {
  report: ContractProductReport;
  chartOption: ReturnType<typeof dailyChartOption> | null;
}) {
  const { summary } = report;
  const ownLabel = report.product.category === 'BANNER' ? '배너' : '광고 카드';
  const notCollected = report.from < report.collectedSince;
  const dayBeforeCollection = addDays(report.collectedSince, -1);
  const lastUncollected = dayBeforeCollection < report.to ? dayBeforeCollection : report.to;

  const dailyColumns: DataTableColumn<Daily>[] = [
    { key: 'date', header: '날짜', width: 'w-32', render: (row) => row.date },
    ...(
      [
        ['impressions', '노출'],
        ['adClicks', '소재 클릭'],
        ['views', '상세 조회'],
        ['uniqueVisitors', '순 방문자'],
        ['ctaClicks', 'CTA 클릭'],
      ] as const
    ).map(([key, header]) => ({
      key,
      header,
      align: 'right' as const,
      render: (row: Daily) =>
        isBeforeCollection(report, row.date) ? (
          <span className="text-gray-400">집계 전</span>
        ) : (
          formatCount(row[key])
        ),
    })),
  ];

  const exposureColumns: DataTableColumn<Exposure>[] = [
    { key: 'name', header: '소재', render: (row) => row.name },
    {
      key: 'impressions',
      header: '노출',
      align: 'right',
      render: (row) => formatCount(row.impressions),
    },
    { key: 'adClicks', header: '클릭', align: 'right', render: (row) => formatCount(row.adClicks) },
    {
      key: 'adClickRate',
      header: '클릭률',
      align: 'right',
      render: (row) => formatRate(row.adClickRate),
    },
  ];

  const targetColumns: DataTableColumn<Target>[] = [
    {
      key: 'title',
      header: '대상',
      render: (row) => `${row.targetType === 'BOOTCAMP' ? '[부트캠프] ' : ''}${row.title}`,
    },
    {
      key: 'views',
      header: '상세 조회',
      align: 'right',
      render: (row) => formatCount(row.total.views),
    },
    {
      key: 'uniqueVisitors',
      header: '순 방문자',
      align: 'right',
      render: (row) => formatCount(row.total.uniqueVisitors),
    },
    {
      key: 'memberViews',
      header: '회원 조회',
      align: 'right',
      render: (row) => formatCount(row.total.memberViews),
    },
    {
      key: 'ctaClicks',
      header: 'CTA 클릭',
      align: 'right',
      render: (row) => formatCount(row.total.ctaClicks),
    },
    {
      key: 'scroll',
      header: '평균 스크롤',
      align: 'right',
      render: (row) => formatPercent(row.total.avgScrollPercent),
    },
    {
      key: 'duration',
      header: '평균 체류',
      align: 'right',
      render: (row) => formatSeconds(row.total.avgDurationSeconds),
    },
  ];

  const sources = report.targets[0]?.bySource.map((item) => item.source) ?? [];
  const sourceColumns: DataTableColumn<Target>[] = [
    { key: 'title', header: '대상', render: (row) => row.title },
    ...sources.map((source) => ({
      key: source,
      header: SOURCE_LABELS[source] ?? source,
      align: 'right' as const,
      render: (row: Target) => {
        const item = row.bySource.find((candidate) => candidate.source === source);
        return item ? `${formatCount(item.views)} / ${formatCount(item.ctaClicks)}` : '-';
      },
    })),
  ];

  return (
    <>
      <p className="text-sm text-gray-500" data-pdf-block>
        {report.product.name}({enumLabel('AdvertisementProductCategory', report.product.category)})
        · 게시 기간 {report.product.startDate} ~ {report.product.endDate} · 보는 기간 {report.from}{' '}
        ~ {report.to}
        {notCollected
          ? ` · ${report.from} ~ ${lastUncollected} 은 집계 전이라 숫자가 없습니다.`
          : ''}
      </p>

      <Section title={`상품 몫 요약(이 상품의 ${ownLabel}로 들어온 것만)`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <Tile label="노출" value={formatCount(summary.impressions)} />
          <Tile label="소재 클릭" value={formatCount(summary.adClicks)} />
          <Tile label="소재 클릭률" value={formatRate(summary.adClickRate)} />
          <Tile label="상세 조회" value={formatCount(summary.views)} />
          <Tile label="순 방문자" value={formatCount(summary.uniqueVisitors)} />
          <Tile label="회원 조회" value={formatCount(summary.memberViews)} />
          <Tile label="CTA 클릭" value={formatCount(summary.ctaClicks)} />
          <Tile label="CTA 클릭률" value={formatRate(summary.ctaClickRate)} />
          <Tile label="평균 스크롤" value={formatPercent(summary.avgScrollPercent)} />
          <Tile label="평균 체류" value={formatSeconds(summary.avgDurationSeconds)} />
        </div>
      </Section>

      <Section title="날짜별 추이">
        {chartOption ? <EChart option={chartOption} height={280} /> : null}
        <DataTable
          columns={dailyColumns}
          rows={report.daily}
          rowKey={(row) => row.date}
          emptyMessage="기간 안에 날짜가 없습니다."
        />
      </Section>

      <Section title="소재별">
        <DataTable
          columns={exposureColumns}
          rows={report.exposures}
          rowKey={(row) => row.exposureId}
          emptyMessage="이 상품에 걸린 소재가 없습니다. 노출을 걸면 숫자가 쌓입니다."
        />
      </Section>

      <Section title="대상 공고 전체 숫자(유입 경로 무관)">
        <DataTable
          columns={targetColumns}
          rows={report.targets}
          rowKey={(row) => `${row.targetType}:${row.targetId}`}
          emptyMessage="연결한 대상 공고가 없습니다. 아래 리포트 대상 공고에서 연결하세요."
        />
        {report.targets.length > 0 ? (
          <>
            <p className="pt-2 text-xs text-gray-500">유입 경로별 상세 조회 / CTA 클릭</p>
            <DataTable
              columns={sourceColumns}
              rows={report.targets}
              rowKey={(row) => `${row.targetType}:${row.targetId}`}
            />
          </>
        ) : null}
      </Section>

      <Section title="지표 정의">
        <dl className="grid gap-x-6 gap-y-1.5 text-xs text-gray-600 sm:grid-cols-2">
          {DEFINITIONS.map(([term, description]) => (
            <div key={term} className="flex gap-2">
              <dt className="w-24 shrink-0 font-medium text-gray-900">{term}</dt>
              <dd>{description}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}

/** PRD 5장 지표 정의를 화면 말로 옮긴 것. */
const DEFINITIONS: [string, string][] = [
  ['노출', '배너·광고 카드가 화면에 절반 이상 1초 넘게 보인 횟수'],
  ['소재 클릭', '배너·광고 카드를 누른 횟수. 클릭률은 소재 클릭 ÷ 노출'],
  ['상세 조회', '상세 페이지가 열린 횟수. 같은 방문자가 30분 안에 다시 열면 한 번'],
  ['순 방문자', '기간 안 상세를 연 서로 다른 방문자(회원, 비회원은 익명 방문자 id)'],
  ['회원 조회', '로그인한 상태로 연 상세 조회'],
  ['CTA 클릭', '지원하러 가기·신청하러 가기를 누른 횟수. 클릭률은 CTA 순 방문자 ÷ 순 방문자'],
  ['평균 스크롤', '상세를 떠날 때 가장 깊이 내린 비율의 평균'],
  ['평균 체류', '상세를 연 뒤 떠날 때까지 화면이 보인 시간의 평균'],
  [
    '상품 몫',
    '이 상품의 노출(배너·광고 카드)로 들어온 조회만 센다. 겹치는 상품끼리 중복으로 세지 않는다',
  ],
  [
    '대상 공고 전체',
    '연결한 공고의 모든 유입(일반 목록·검색·외부 포함). 어느 상품 몫에도 넣지 않은 숫자도 있다',
  ],
];
