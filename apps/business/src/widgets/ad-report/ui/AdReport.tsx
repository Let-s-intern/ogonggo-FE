'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { enumLabel, HttpError } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { DatePicker } from '@/shared/ui/DatePicker';
import { downloadAdReportCsv, fetchAdReport } from '../lib/api';
import { exportReportPdf } from '../lib/exportPdf';
import {
  dotDate,
  positionLabel,
  PROGRESS_LABELS,
  productProgress,
  todayYmd,
  UNAVAILABLE_MESSAGES,
  unavailableReason,
} from '../model/format';
import type { AdReport as AdReportData, ReportableProduct } from '../model/types';
import { ReportBody } from './ReportBody';

type Load =
  | { kind: 'loading' }
  | { kind: 'ready'; report: AdReportData }
  | { kind: 'unavailable' }
  | { kind: 'error' };

const PROGRESS_TONE = {
  RUNNING: 'bg-blue-50 text-blue-600',
  SCHEDULED: 'bg-gray-100 text-gray-600',
  ENDED: 'bg-gray-100 text-gray-500',
  NO_PERIOD: 'bg-gray-100 text-gray-500',
} as const;

function productMeta(product: ReportableProduct): string {
  const category = enumLabel('AdvertisementProductCategory', product.category);
  return product.position ? `${category} · ${positionLabel(product.position)}` : category;
}

function periodText(product: ReportableProduct): string {
  return product.startDate && product.endDate
    ? `${dotDate(product.startDate)} ~ ${dotDate(product.endDate)}`
    : '기간 미정';
}

/** 처음 보일 상품. 진행 중인 것, 없으면 리포트를 열 수 있는 것, 그것도 없으면 첫 상품. */
function initialProduct(products: ReportableProduct[]): number | undefined {
  const open = products.filter((product) => unavailableReason(product) === null);
  return (open.find((product) => productProgress(product) === 'RUNNING') ?? open[0] ?? products[0])
    ?.contractProductId;
}

function ProductPicker({
  products,
  selectedId,
  onSelect,
}: {
  products: ReportableProduct[];
  selectedId: number | undefined;
  onSelect: (id: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="리포트를 볼 상품" className="grid gap-2 sm:grid-cols-2">
      {products.map((product) => {
        const progress = productProgress(product);
        const selected = product.contractProductId === selectedId;
        return (
          <button
            key={product.contractProductId}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(product.contractProductId)}
            className={cn(
              'flex min-w-0 flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors',
              selected
                ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-500'
                : 'border-gray-200 hover:border-gray-300',
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-semibold text-gray-900">{product.productName}</span>
              <span
                className={cn(
                  'shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold',
                  PROGRESS_TONE[progress],
                )}
              >
                {PROGRESS_LABELS[progress]}
              </span>
            </span>
            <span className="truncate text-xs text-gray-500">{productMeta(product)}</span>
            <span className="text-xs text-gray-500 tabular-nums">{periodText(product)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** 한 상품의 리포트. 기간을 좁히면 다시 받는다. 빈 기간은 백엔드 기본값(상품 기간 전체, 진행 중이면 오늘까지)이다. */
function ProductReport({
  contractId,
  product,
}: {
  contractId: number;
  product: ReportableProduct & { startDate: string; endDate: string };
}) {
  const today = todayYmd();
  const lastDay = product.endDate < today ? product.endDate : today;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [load, setLoad] = useState<Load>({ kind: 'loading' });

  useEffect(() => {
    let active = true;
    setLoad((current) => (current.kind === 'ready' ? current : { kind: 'loading' }));
    fetchAdReport(contractId, product.contractProductId, from, to)
      .then((report) => active && setLoad({ kind: 'ready', report }))
      .catch((error: unknown) => {
        if (!active) return;
        setLoad({
          kind: error instanceof HttpError && error.status === 409 ? 'unavailable' : 'error',
        });
      });
    return () => {
      active = false;
    };
  }, [contractId, product.contractProductId, from, to]);

  const narrowed = from !== '' || to !== '';
  const rootRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);
  const [exportFailed, setExportFailed] = useState(false);

  /** 내려받기. 이름은 `오공고-리포트-<상품>-<시작>_<끝>` 이고 화면에 보이는 기간과 같다. */
  const runExport = async (kind: 'pdf' | 'csv') => {
    if (load.kind !== 'ready' || exporting) return;
    const { report } = load;
    const name = `오공고-리포트-${report.product.name}-${report.from}_${report.to}`;
    setExporting(kind);
    setExportFailed(false);
    try {
      if (kind === 'pdf') {
        if (rootRef.current) await exportReportPdf(rootRef.current, `${name}.pdf`);
      } else {
        await downloadAdReportCsv(contractId, product.contractProductId, from, to, `${name}.csv`);
      }
    } catch {
      setExportFailed(true);
    } finally {
      setExporting(null);
    }
  };
  const exportButton = (kind: 'pdf' | 'csv', label: string) => (
    <button
      type="button"
      // 아직 불러오는 중이면 PDF 에 "불러오는 중" 이 찍힌다. 다 받은 뒤에만 누를 수 있다.
      disabled={load.kind !== 'ready' || exporting !== null}
      onClick={() => void runExport(kind)}
      className="flex h-10 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent"
    >
      <span aria-hidden="true" className="icon-[lucide--download] block size-4" />
      {exporting === kind ? `${label} 만드는 중` : label}
    </button>
  );

  return (
    <div ref={rootRef} className="flex flex-col gap-4 bg-white">
      <div data-pdf-hide className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="grid grid-cols-1 gap-2 sm:w-[30rem] sm:grid-cols-2">
          <DatePicker
            aria-label="시작일"
            value={from || product.startDate}
            min={product.startDate}
            max={to || lastDay}
            onChange={setFrom}
            className="h-10 text-sm"
          />
          <DatePicker
            aria-label="종료일"
            value={to || lastDay}
            min={from || product.startDate}
            max={lastDay}
            onChange={setTo}
            className="h-10 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={!narrowed}
          onClick={() => {
            setFrom('');
            setTo('');
          }}
          className="h-10 rounded-md border border-gray-200 px-3 text-sm text-gray-600 hover:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-transparent"
        >
          전체 기간
        </button>
        <div className="flex gap-2 sm:ml-auto">
          {exportButton('pdf', 'PDF')}
          {exportButton('csv', 'CSV')}
        </div>
      </div>
      {exportFailed ? (
        <p role="alert" data-pdf-hide className="text-sm text-error">
          파일을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}

      {load.kind === 'ready' ? (
        <>
          <p data-pdf-block className="text-sm text-gray-500 tabular-nums">
            <span className="mr-2 font-semibold text-gray-900">{load.report.product.name}</span>
            {dotDate(load.report.from)} ~ {dotDate(load.report.to)}
            {productProgress(product) === 'RUNNING' && load.report.to === today
              ? ' · 오늘까지 집계'
              : ''}
          </p>
          <ReportBody report={load.report} />
        </>
      ) : (
        <p
          role={load.kind === 'loading' ? undefined : 'alert'}
          className="rounded-xl border border-gray-200 px-4 py-16 text-center text-sm text-gray-500"
        >
          {load.kind === 'loading'
            ? '리포트를 불러오는 중입니다.'
            : load.kind === 'unavailable'
              ? UNAVAILABLE_MESSAGES.NOT_EXPOSABLE
              : '리포트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'}
        </p>
      )}
    </div>
  );
}

/**
 * 계약 상세의 성과 리포트(PRD 6.6). 상품을 고르고 기간을 좁혀 그 상품 몫의 숫자를 본다. 기간이 없거나 오늘의 공고 밖
 * 채널 상품이면 리포트 대신 이유를 적는다.
 */
export function AdReport({
  contractId,
  products,
}: {
  contractId: number;
  products: ReportableProduct[];
}) {
  // 대시보드 카드에서 오면 `?product=<contractProductId>` 로 그 상품을 골라 둔다. 이 계약에 없는 값이면 무시한다.
  const requested = Number(useSearchParams().get('product'));
  const [selectedId, setSelectedId] = useState(() =>
    products.some((p) => p.contractProductId === requested) ? requested : initialProduct(products),
  );
  const product = products.find((p) => p.contractProductId === selectedId);
  const reason = product ? unavailableReason(product) : null;

  return (
    <section className="flex flex-col gap-4">
      <header>
        <h2 className="text-lg font-semibold text-gray-950">성과 리포트</h2>
        <p className="pt-1 text-sm text-gray-500">
          상품을 고르면 그 상품으로 들어온 숫자를 보여 드려요.
        </p>
      </header>
      <div data-pdf-hide>
        <ProductPicker products={products} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
      {!product ? null : reason || !product.startDate || !product.endDate ? (
        <p className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-10 text-center text-sm break-keep text-gray-600">
          {UNAVAILABLE_MESSAGES[reason ?? 'NO_PERIOD']}
        </p>
      ) : (
        <ProductReport
          key={product.contractProductId}
          contractId={contractId}
          product={{ ...product, startDate: product.startDate, endDate: product.endDate }}
        />
      )}
    </section>
  );
}
