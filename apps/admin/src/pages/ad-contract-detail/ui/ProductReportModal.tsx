import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Callout, DataTable, Input, Modal, type DataTableColumn } from '@ogonggo/ui';
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
  formatDate,
  formatDateRange,
  formatPercent,
  formatRate,
  formatSeconds,
  isBannerReport,
  isBeforeCollection,
  jobFieldChartOption,
  scrollFunnelOption,
  showsDetail,
  scrollStepLabel,
  scrollStepValue,
} from '../lib/reportFormat';
import { Tile } from './reportParts';

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

/** 리포트 머리의 상품 설명: 기간과 진행 상태. */
function productPeriodLabel(product: ReportableContractProduct): string {
  if (product.reportUnavailableReason === 'NOT_EXPOSABLE') return '집계 대상 아님';
  if (!product.startDate || !product.endDate) return '기간 미정';
  const today = todayKst();
  const state = today < product.startDate ? '예정' : today > product.endDate ? '끝남' : '진행 중';
  return `${formatDateRange(product.startDate, product.endDate)} · ${state}`;
}

/** 상품 표의 `리포트` 칸 문구. 열 수 없는 상품은 이유를 짧게. */
export function reportCellLabel(product: ReportableContractProduct): string {
  if (product.reportAvailable) return '리포트 보기';
  return product.reportUnavailableReason === 'NOT_EXPOSABLE' ? '집계 대상 아님' : '기간 미정';
}

/** 리포트를 열 수 없는 상품의 이유. 상품 표의 행 안내와 모달이 같이 쓴다. */
export function unavailableMessage(product: ReportableContractProduct): string {
  return UNAVAILABLE_MESSAGES[product.reportUnavailableReason ?? 'NO_PERIOD'] ?? '';
}

/**
 * 계약 상품 하나의 성과 리포트 모달(PRD 6.6·6.7, 2026-11-19 사용자: 어드민 상세·설정은 쿼리 파라미터가 있는 넓은 모달). 계약
 * 상세의 상품 표에서 상품을 누르면 `?product=` 로 열린다. 비즈니스 앱과 같은 구성 — 기간 좁히기 → 상품 몫 요약 → 날짜별 추이 →
 * 광고물별 → 광고할 공고 전체 숫자 → 지표 정의.
 *
 * 주소로 리포트 없는 상품을 바로 열면 이유만 안내한다. PDF 는 통계 화면과 같은 방식(모달 본문을 그림으로 떠서 A4 로 나눔),
 * CSV 는 서버의 `report.csv` 를 그대로 받는다.
 */
export function ProductReportModal({
  contract,
  contractProductId,
  onClose,
}: {
  contract: AdminAdvertisementContractDetailResponse;
  contractProductId: number;
  onClose: () => void;
}) {
  const product = reportProductsOf(contract).find(
    (item) => item.contractProductId === contractProductId,
  );
  return (
    <Modal
      open
      title={product ? `${product.productName} 리포트` : '상품 리포트'}
      description={product ? productPeriodLabel(product) : undefined}
      onClose={onClose}
      className="w-[min(72rem,calc(100vw-var(--assistant-width)-2rem))]"
    >
      {!product ? (
        <Callout tone="info">이 계약에 없는 상품입니다. 이미 뺐을 수 있어요.</Callout>
      ) : product.reportAvailable ? (
        <ProductReport key={product.contractProductId} contract={contract} product={product} />
      ) : (
        <Callout tone="info">{unavailableMessage(product)}</Callout>
      )}
    </Modal>
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

const UNIQUE_IMPRESSION_HINT = '같은 사람이 하루에 여러 번 봐도 한 번으로 센 노출';

function ReportBody({
  report,
  chartOption,
}: {
  report: ContractProductReport;
  chartOption: ReturnType<typeof dailyChartOption> | null;
}) {
  const { summary } = report;
  const banner = isBannerReport(report);
  const detail = showsDetail(report);
  const ownLabel = banner ? '배너' : '광고 카드';
  // 배너는 상세 페이지가 아니라 스크롤·체류를 보이지 않는다(광고할 공고 표 포함, API 계약 5절).
  const scrolls = !banner;
  const notCollected = report.from < report.collectedSince;
  const dayBeforeCollection = addDays(report.collectedSince, -1);
  const lastUncollected = dayBeforeCollection < report.to ? dayBeforeCollection : report.to;

  const dailyColumns: DataTableColumn<Daily>[] = [
    { key: 'date', header: '날짜', width: 'w-32', render: (row) => formatDate(row.date) },
    ...(
      [
        ['impressions', '노출'],
        ['uniqueImpressions', '순 노출'],
        ['adClicks', '클릭'],
        ['views', '상세 조회'],
        ['uniqueVisitors', '순 방문자'],
        ['ctaClicks', 'CTA 클릭'],
      ] as const
    )
      .filter(
        ([key]) =>
          detail || key === 'impressions' || key === 'uniqueImpressions' || key === 'adClicks',
      )
      .map(([key, header]) => ({
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
    { key: 'name', header: '광고물', render: (row) => row.name },
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
    ...(scrolls
      ? ([
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
        ] satisfies DataTableColumn<Target>[])
      : []),
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
        · 게시 기간 {formatDateRange(report.product.startDate, report.product.endDate)} · 보는 기간{' '}
        {formatDateRange(report.from, report.to)}
        {notCollected
          ? ` · ${formatDateRange(report.from, lastUncollected)} 은 집계 전이라 숫자가 없습니다.`
          : ''}
      </p>

      <Section title={`상품 몫 요약(이 상품의 ${ownLabel}로 들어온 것만)`}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <Tile label="노출" value={formatCount(summary.impressions)} />
          <Tile
            label="순 노출"
            value={formatCount(summary.uniqueImpressions)}
            hint={UNIQUE_IMPRESSION_HINT}
          />
          <Tile label="클릭" value={formatCount(summary.adClicks)} />
          <Tile label="클릭률" value={formatRate(summary.adClickRate)} />
          {detail ? (
            <>
              <Tile label="상세 조회" value={formatCount(summary.views)} />
              <Tile label="순 방문자" value={formatCount(summary.uniqueVisitors)} />
              <Tile label="회원 조회" value={formatCount(summary.memberViews)} />
              <Tile label="CTA 클릭" value={formatCount(summary.ctaClicks)} />
              <Tile label="CTA 클릭률" value={formatRate(summary.ctaClickRate)} />
            </>
          ) : null}
          {scrolls ? (
            <Tile label="평균 체류" value={formatSeconds(summary.avgDurationSeconds)} />
          ) : null}
        </div>
        {detail ? null : (
          <p className="text-xs text-gray-500">
            배너 링크가 공고 상세가 아니어서 상세 조회는 세지 않아요.
          </p>
        )}
      </Section>

      {scrolls && summary.scrollFunnel ? (
        <Section title="스크롤 깊이(순 방문자 기준)">
          <ScrollFunnel report={report} steps={summary.scrollFunnel} />
        </Section>
      ) : null}

      <Section title="희망 직무별(로그인 회원 기준)">
        <JobFieldBreakdown report={report} detail={detail} />
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

      {/* 소재가 하나면 요약과 같은 숫자라 표를 두지 않는다(API 계약 5절). */}
      {report.exposures.length >= 2 ? (
        <Section title="광고물별 성과">
          <DataTable
            columns={exposureColumns}
            rows={report.exposures}
            rowKey={(row) => row.exposureId}
          />
        </Section>
      ) : report.exposures.length === 0 ? (
        <p className="text-sm text-gray-500" data-pdf-block>
          이 상품에 걸린 광고물이 없습니다. 노출을 걸면 숫자가 쌓입니다.
        </p>
      ) : null}

      <Section title="광고할 공고 전체 숫자(유입 경로 무관)">
        <DataTable
          columns={targetColumns}
          rows={report.targets}
          rowKey={(row) => `${row.targetType}:${row.targetId}`}
          emptyMessage="연결한 광고할 공고가 없습니다. 위 계약 정보의 광고할 공고에서 연결하세요."
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
          {definitionsFor(banner).map(([term, description]) => (
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

/**
 * 스크롤 깊이 깔때기(2026-11-19 사용자 요청, API 계약 3절 `scrollFunnel`). 단계마다 몇 명이 거기까지 내렸는지 보인다.
 * 평균은 옆에 작게 둔다. 그래프 옆에 같은 숫자를 글로도 적어 PDF·복사에서 읽힌다.
 */
function ScrollFunnel({
  report,
  steps,
}: {
  report: ContractProductReport;
  steps: NonNullable<ContractProductReport['summary']['scrollFunnel']>;
}) {
  const option = useMemo(() => scrollFunnelOption(steps), [steps]);
  if (steps.length === 0 || steps[0]?.visitors === 0) {
    return <p className="text-sm text-gray-500">기간 안에 상세를 연 방문자가 없습니다.</p>;
  }
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
      <EChart option={option} height={240} />
      <div className="flex flex-col gap-2 text-sm">
        <ol className="flex flex-col gap-1.5">
          {steps.map((step) => (
            <li key={step.threshold} className="flex justify-between gap-3">
              <span className="text-gray-600">{scrollStepLabel(step)}</span>
              <span className="font-medium text-gray-900 [font-variant-numeric:tabular-nums]">
                {scrollStepValue(step)}
              </span>
            </li>
          ))}
        </ol>
        <p className="border-t border-gray-100 pt-2 text-xs text-gray-500">
          평균 스크롤 {formatPercent(report.summary.avgScrollPercent)}
        </p>
      </div>
    </div>
  );
}

type JobFieldRow = ContractProductReport['byJobField'][number];

/**
 * 희망 직무별 나눔(API 계약 6.1). 가로 막대와 표. 로그인 회원만 세므로 안내를 함께 둔다. 상세 숫자가 없는 배너는 막대를 광고
 * 클릭 회원으로 그리고 상세 칸을 뺀다.
 */
function JobFieldBreakdown({ report, detail }: { report: ContractProductReport; detail: boolean }) {
  const rows = report.byJobField;
  const metric = detail ? 'memberUniqueVisitors' : 'adClickMembers';
  const option = useMemo(() => jobFieldChartOption(rows, metric), [rows, metric]);
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">기간 안에 로그인 회원의 기록이 없습니다.</p>;
  }
  const columns: DataTableColumn<JobFieldRow>[] = [
    { key: 'label', header: '희망 직무', render: (row) => row.label },
    ...(detail
      ? ([
          {
            key: 'memberUniqueVisitors',
            header: '순 방문 회원',
            align: 'right',
            render: (row) => formatCount(row.memberUniqueVisitors),
          },
          {
            key: 'memberViews',
            header: '회원 조회',
            align: 'right',
            render: (row) => formatCount(row.memberViews),
          },
          {
            key: 'ctaUniqueMembers',
            header: 'CTA 클릭 회원',
            align: 'right',
            render: (row) => formatCount(row.ctaUniqueMembers),
          },
        ] satisfies DataTableColumn<JobFieldRow>[])
      : []),
    {
      key: 'adClickMembers',
      header: '광고 클릭 회원',
      align: 'right',
      render: (row) => formatCount(row.adClickMembers),
    },
  ];
  return (
    <>
      <p className="text-xs text-gray-500">
        로그인한 회원만 셉니다. 희망 직무가 여럿인 회원은 직무마다 한 번씩 세서 합이 회원 수보다 클
        수 있어요. 막대는 {detail ? '순 방문 회원' : '광고 클릭 회원'} 수입니다.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <EChart option={option} height={Math.max(160, rows.length * 34)} />
        <DataTable columns={columns} rows={rows} rowKey={(row) => row.jobField ?? 'NONE'} />
      </div>
    </>
  );
}

/** PRD 5장 지표 정의를 화면 말로 옮긴 것. 화면에 있는 지표만 보인다(`definitionsFor`). */
type Definition = [term: string, description: string, shownWhen: 'all' | 'detail' | 'scroll'];

const DEFINITIONS: Definition[] = [
  ['노출', '배너·광고 카드가 화면에 절반 이상 1초 넘게 보인 횟수', 'all'],
  [
    '순 노출',
    '같은 사람(회원, 비회원은 익명 방문자 id)이 같은 광고를 하루에 여러 번 봐도 한 번으로 센 노출',
    'all',
  ],
  [
    '희망 직무별',
    '로그인한 회원만 회원의 희망 직무로 나눈다. 직무가 여럿인 회원은 직무마다 한 번씩 세서 합이 회원 수보다 클 수 있다',
    'all',
  ],
  ['클릭', '배너·광고 카드를 누른 횟수. 클릭률은 클릭 ÷ 노출', 'all'],
  ['상세 조회', '상세 페이지가 열린 횟수. 같은 방문자가 30분 안에 다시 열면 한 번', 'detail'],
  ['순 방문자', '기간 안 상세를 연 서로 다른 방문자(회원, 비회원은 익명 방문자 id)', 'detail'],
  ['회원 조회', '로그인한 상태로 연 상세 조회', 'detail'],
  [
    'CTA 클릭',
    '지원하러 가기·신청하러 가기를 누른 횟수. 클릭률은 CTA 순 방문자 ÷ 순 방문자',
    'detail',
  ],
  [
    '스크롤 깊이',
    '상세를 연 순 방문자 중 각 깊이(25·50·75·100%)까지 내린 사람 수. 방문자마다 가장 깊이 내린 값으로 센다',
    'scroll',
  ],
  ['평균 스크롤', '상세를 떠날 때 가장 깊이 내린 비율의 평균', 'scroll'],
  ['평균 체류', '상세를 연 뒤 떠날 때까지 화면이 보인 시간의 평균', 'scroll'],
  [
    '상품 몫',
    '이 상품의 노출(배너·광고 카드)로 들어온 것만 센다. 겹치는 상품끼리 중복으로 세지 않는다',
    'all',
  ],
  [
    '광고할 공고 전체',
    '연결한 공고의 모든 유입(일반 목록·검색·외부 포함). 어느 상품 몫에도 넣지 않은 숫자도 있다',
    'all',
  ],
];

/**
 * 상품 종류에 맞는 정의만. 광고할 공고 표가 상세 조회·CTA 를 늘 보이므로 상세 정의는 배너에도 남긴다. 스크롤·체류는 광고 카드만.
 */
function definitionsFor(banner: boolean): [string, string][] {
  return DEFINITIONS.filter(([, , shownWhen]) => shownWhen !== 'scroll' || !banner).map(
    ([term, description]) => [term, description],
  );
}
