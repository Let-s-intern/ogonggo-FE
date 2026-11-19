'use client';

import { type ReactNode, useMemo, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { EChart } from '@/shared/ui/EChart';
import { funnelStepLabel, scrollFunnelOption, trendOption } from '../lib/chartOptions';
import {
  dotDate,
  formatCount,
  formatPercent,
  formatRate,
  formatSeconds,
  shortDate,
  SOURCE_LABELS,
} from '../model/format';
import type { AdReport } from '../model/types';

/** 리포트의 칸 하나. PDF 가 이 칸의 아래 끝에서만 페이지를 나눈다(`data-pdf-block`). */
export function ReportCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-pdf-block
      className={cn('min-w-0 rounded-xl border border-gray-200 bg-white p-5', className)}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-gray-950">{title}</h3>
        {action}
      </header>
      {children}
    </section>
  );
}

function SummaryCards({ report }: { report: AdReport }) {
  const { summary } = report;
  const items = [
    { label: '노출', value: formatCount(summary.impressions), sub: '광고가 화면에 보인 횟수' },
    {
      label: '광고 클릭',
      value: formatCount(summary.adClicks),
      sub: '배너·광고 카드를 누른 횟수',
    },
    { label: '클릭률', value: formatRate(summary.adClickRate), sub: '광고 클릭 / 노출' },
    {
      label: '상세 조회',
      value: formatCount(summary.views),
      sub: `순 방문자 ${formatCount(summary.uniqueVisitors)}명`,
    },
    {
      label: 'CTA 클릭',
      value: formatCount(summary.ctaClicks),
      sub: `CTA 클릭률 ${formatRate(summary.ctaClickRate)}`,
    },
  ];
  return (
    <div data-pdf-block className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">{item.label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-gray-950 tabular-nums">
            {item.value}
          </p>
          <p className="mt-1 truncate text-xs text-gray-500">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

const TH = 'px-2 py-2 text-right font-medium first:text-left';
const TD = 'px-2 py-2.5 text-right tabular-nums first:text-left';

function DailyTable({ report }: { report: AdReport }) {
  return (
    <table className="w-full table-fixed text-xs sm:text-sm">
      <thead className="bg-gray-50 text-gray-500">
        <tr>
          <th className={TH}>날짜</th>
          <th className={TH}>노출</th>
          <th className={TH}>광고 클릭</th>
          <th className={TH}>상세 조회</th>
          <th className={TH}>CTA 클릭</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {report.daily.map((row) => (
          <tr key={row.date}>
            <td className={TD}>{shortDate(row.date)}</td>
            {row.date < report.collectedSince ? (
              <td colSpan={4} className="px-2 py-2.5 text-right text-gray-400">
                집계 전
              </td>
            ) : (
              <>
                <td className={TD}>{formatCount(row.impressions)}</td>
                <td className={TD}>{formatCount(row.adClicks)}</td>
                <td className={TD}>{formatCount(row.views)}</td>
                <td className={TD}>{formatCount(row.ctaClicks)}</td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * 스크롤 깊이 깔때기(2026-11-19 사용자: 평균 한 숫자 대신 단계별로 몇 명인지). 왼쪽은 그래프, 오른쪽은 단계별
 * "N명 (xx%)". 평균 스크롤·체류는 아래 작은 글자로 남긴다.
 */
function ScrollFunnelCard({ report }: { report: AdReport }) {
  const { scrollFunnel: steps, avgScrollPercent, avgDurationSeconds } = report.summary;
  const option = useMemo(() => scrollFunnelOption(steps), [steps]);
  const empty = (steps[0]?.visitors ?? 0) === 0;
  return (
    <ReportCard title="스크롤 깊이">
      {empty ? (
        <p className="py-4 text-center text-sm text-gray-500">아직 상세를 연 방문자가 없어요.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_16rem] md:items-center">
          <EChart option={option} height={220} />
          <div className="flex flex-col gap-3">
            <ol className="flex flex-col divide-y divide-gray-100 text-sm">
              {steps.map((step) => (
                <li key={step.threshold} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-gray-600">{funnelStepLabel(step.threshold)}</span>
                  <span className="text-gray-900 tabular-nums">
                    <span className="font-semibold">{formatCount(step.visitors)}명</span>
                    <span className="ml-1 text-gray-500">({formatRate(step.rate)})</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="text-xs text-gray-500">
              평균 스크롤 {formatPercent(avgScrollPercent)} · 평균 체류{' '}
              {formatSeconds(avgDurationSeconds)}
            </p>
          </div>
        </div>
      )}
    </ReportCard>
  );
}

function TrendCard({ report }: { report: AdReport }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const option = useMemo(
    () => trendOption(report.daily, report.collectedSince),
    [report.daily, report.collectedSince],
  );
  const toggle = (
    <div className="flex rounded-md border border-gray-200 p-0.5 text-sm" data-pdf-hide>
      {(
        [
          ['chart', '그래프'],
          ['table', '표'],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={view === value}
          onClick={() => setView(value)}
          className={cn(
            'rounded px-2.5 py-1',
            view === value ? 'bg-gray-900 font-semibold text-white' : 'text-gray-500',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
  return (
    <ReportCard title="날짜별 추이" action={toggle}>
      {view === 'chart' ? <EChart option={option} height={280} /> : <DailyTable report={report} />}
    </ReportCard>
  );
}

function ExposureTable({ report }: { report: AdReport }) {
  return (
    <ReportCard title="소재별 성과">
      {report.exposures.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">이 상품에 걸린 소재가 없어요.</p>
      ) : (
        <table className="w-full table-fixed text-xs sm:text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className={cn(TH, 'w-[40%]')}>소재</th>
              <th className={TH}>노출</th>
              <th className={TH}>클릭</th>
              <th className={TH}>클릭률</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {report.exposures.map((exposure) => (
              <tr key={exposure.exposureId}>
                <td className={cn(TD, 'break-keep')}>{exposure.name}</td>
                <td className={TD}>{formatCount(exposure.impressions)}</td>
                <td className={TD}>{formatCount(exposure.adClicks)}</td>
                <td className={cn(TD, 'font-semibold')}>{formatRate(exposure.adClickRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ReportCard>
  );
}

function Targets({ report }: { report: AdReport }) {
  return (
    <ReportCard title="대상 공고 전체 숫자">
      <p className="-mt-2 mb-4 text-sm text-gray-500">
        광고뿐 아니라 일반 목록·검색·외부 링크로 들어온 것까지 모두 센 숫자예요.
      </p>
      {report.targets.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">이 계약에 연결된 공고가 없어요.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {report.targets.map((target) => {
            const maxViews = Math.max(1, ...target.bySource.map((row) => row.views));
            const stats = [
              ['상세 조회', formatCount(target.total.views)],
              ['순 방문자', formatCount(target.total.uniqueVisitors)],
              ['회원 조회', formatCount(target.total.memberViews)],
              ['CTA 클릭', formatCount(target.total.ctaClicks)],
              ['평균 스크롤', formatPercent(target.total.avgScrollPercent)],
              ['평균 체류', formatSeconds(target.total.avgDurationSeconds)],
            ];
            return (
              <div key={`${target.targetType}-${target.targetId}`} className="flex flex-col gap-4">
                <p className="font-semibold break-keep text-gray-900">
                  <span className="mr-2 text-xs font-normal text-gray-500">
                    {target.targetType === 'JOB' ? '채용공고' : '부트캠프'}
                  </span>
                  {target.title}
                </p>
                <dl className="grid grid-cols-3 gap-y-3 rounded-lg bg-gray-50 py-4 md:grid-cols-6">
                  {stats.map(([label, value]) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <dt className="text-xs text-gray-500">{label}</dt>
                      <dd className="font-bold text-gray-900 tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div>
                  <p className="mb-2 text-sm font-semibold text-gray-700">유입 경로별</p>
                  <ul className="flex flex-col gap-2">
                    {target.bySource.map((row) => (
                      <li
                        key={row.source}
                        className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3 text-sm"
                      >
                        <span className="text-gray-600">{SOURCE_LABELS[row.source]}</span>
                        <span className="h-2 rounded-full bg-gray-100">
                          <span
                            className="block h-2 rounded-full bg-blue-400"
                            style={{ width: `${(row.views / maxViews) * 100}%` }}
                          />
                        </span>
                        <span className="text-right text-xs text-gray-500 tabular-nums">
                          조회 {formatCount(row.views)} · CTA {formatCount(row.ctaClicks)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ReportCard>
  );
}

const DEFINITIONS = [
  ['노출', '배너·광고 카드가 화면에 절반 넘게 1초 이상 보인 횟수'],
  ['광고 클릭', '배너·광고 카드를 누른 횟수'],
  ['클릭률', '광고 클릭 / 노출'],
  ['상세 조회', '공고 상세가 열린 횟수. 같은 방문자가 30분 안에 다시 열면 한 번으로 셉니다'],
  ['순 방문자', '기간 안에 상세를 연 서로 다른 방문자 수'],
  ['CTA 클릭', '상세의 지원하러 가기·신청하러 가기를 누른 횟수'],
  ['CTA 클릭률', 'CTA 를 누른 순 방문자 / 상세를 연 순 방문자'],
  [
    '스크롤 깊이',
    '상세를 연 순 방문자 중 25·50·75·100% 까지 내린 사람 수. 방문자마다 가장 깊이 내린 값으로 셉니다',
  ],
  ['평균 스크롤', '상세를 떠날 때 가장 깊이 내린 비율의 평균'],
  ['평균 체류', '상세를 연 뒤 떠날 때까지 화면이 보인 시간의 평균'],
] as const;

function Definitions() {
  return (
    <ReportCard title="지표 정의">
      <p className="-mt-2 mb-3 text-sm text-gray-500">
        요약 카드·추이·소재별 숫자는 이 상품의 광고로 들어온 것만 셉니다. 날짜는 한국 시간
        기준입니다.
      </p>
      <dl className="grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
        {DEFINITIONS.map(([term, description]) => (
          <div key={term} className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3">
            <dt className="font-semibold text-gray-700">{term}</dt>
            <dd className="break-keep text-gray-600">{description}</dd>
          </div>
        ))}
      </dl>
    </ReportCard>
  );
}

/**
 * 리포트 본문: 요약 카드 → 날짜별 추이 → 소재별 표 → 대상 공고 전체 숫자와 유입 경로별 나눔 → 지표 정의.
 * 기간이 수집 시작일보다 앞이면 그 앞은 "집계 전" 이다. 기간 전체가 그렇다면 숫자 대신 안내만 보인다.
 */
export function ReportBody({ report }: { report: AdReport }) {
  const allBefore = report.to < report.collectedSince;
  const partlyBefore = !allBefore && report.from < report.collectedSince;

  if (allBefore) {
    return (
      <div className="flex flex-col gap-4">
        <p
          data-pdf-block
          className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-10 text-center text-sm break-keep text-gray-600"
        >
          이 기간({dotDate(report.from)} ~ {dotDate(report.to)})은 집계 전이에요. 성과 숫자는{' '}
          {dotDate(report.collectedSince)}부터 모으고 있어요.
        </p>
        <Definitions />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {partlyBefore ? (
        <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm break-keep text-gray-600">
          {dotDate(report.collectedSince)} 이전은 집계 전이에요. 성과 숫자는 그날부터 모으고 있어
          요약 숫자에 그 앞 날짜는 들어가지 않아요.
        </p>
      ) : null}
      <SummaryCards report={report} />
      <TrendCard report={report} />
      <ScrollFunnelCard report={report} />
      <ExposureTable report={report} />
      <Targets report={report} />
      <Definitions />
    </div>
  );
}
