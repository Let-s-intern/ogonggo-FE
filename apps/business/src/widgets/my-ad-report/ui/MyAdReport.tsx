'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { enumLabel } from '@ogonggo/api';
import { Button, cn } from '@ogonggo/ui';
import { adApplyHref, adReportKey, fetchAdReport, formatShortDate } from '@/entities/advertisement';
import { myAdDetailHref } from '@/widgets/my-ads';
import { TrendChart } from './TrendChart';

const number = (value: number) => value.toLocaleString('ko-KR');
const signed = (value: number, unit: string) => `${value > 0 ? '+' : ''}${value}${unit}`;
const dotted = (date: string) => date.slice(0, 10).replaceAll('-', '.');

/**
 * 마이페이지 > 광고 > 광고 종료(리포트)(시안 B-06). 집행 기간과 집계 기준, 지표 넷, 지면별 표(직무 평균 대비), 일별 추이,
 * 유저 반응, 인사이트, `같은 조건으로 다시 신청`, PDF 다운로드(브라우저 인쇄).
 */
export function MyAdReport({ id }: { id: number }) {
  const {
    data: report,
    isPending,
    isError,
  } = useQuery({
    queryKey: adReportKey(id),
    queryFn: () => fetchAdReport(id),
  });

  if (isError) {
    return (
      <p role="alert" className="text-sm text-error">
        리포트를 불러오지 못했습니다. 집행이 끝난 광고만 리포트가 있어요.
      </p>
    );
  }
  if (isPending) {
    return <p className="py-16 text-center text-sm text-gray-500">불러오는 중입니다.</p>;
  }

  const { totals } = report;
  const metrics = [
    {
      label: '총 노출',
      value: number(totals.impressions),
      detail: `같은 직무 광고 평균 대비 ${signed(totals.impressionsDiffFromJobFieldAverage, '%')}`,
    },
    {
      label: '총 클릭',
      value: number(totals.clicks),
      detail: `상세 조회 ${number(totals.detailViews)} · 스크랩 ${number(totals.scraps)}`,
    },
    {
      label: '클릭률',
      value: `${totals.ctr.toFixed(1)}%`,
      detail: `일반 카드 평균 ${totals.generalCardAverageCtr}%`,
    },
    {
      label: '지원하기 클릭',
      value: number(totals.applyClicks),
      detail: '공고 원문 지원 버튼 클릭',
    },
  ];

  return (
    <article className="ad-report flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <Link
            href={myAdDetailHref(id)}
            className="hidden text-sm text-gray-500 hover:text-gray-800 md:inline print:hidden"
          >
            ← 광고 상세
          </Link>
          <p className="text-sm text-gray-500">종료 · {report.applicationNo}</p>
          <h2 className="text-xl font-bold text-gray-950 md:text-2xl">
            {report.postTitle} <span className="font-normal text-gray-500">· 성과 리포트</span>
          </h2>
          <p className="text-sm text-gray-600">
            집행 {dotted(report.startDate)} ~ {dotted(report.endDate)} · 집계 기준{' '}
            {dotted(report.finalizedAt)} (최종 D+7)
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="print:hidden"
          onClick={() => window.print()}
        >
          PDF 다운로드
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-md border border-gray-200 bg-white p-4 break-inside-avoid"
          >
            <dt className="text-sm text-gray-500">{metric.label}</dt>
            <dd className="pt-1 text-2xl font-bold text-gray-950">{metric.value}</dd>
            <dd className="pt-1 text-xs text-gray-500">{metric.detail}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3 break-inside-avoid">
        <h3 className="text-base font-bold text-gray-900">지면별 성과</h3>
        <div className="overflow-x-auto rounded-md border border-gray-200 print:overflow-visible">
          <table className="w-full min-w-[720px] text-sm print:min-w-0 print:text-xs">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                {[
                  '지면',
                  '직무',
                  '집행 주',
                  '노출',
                  '클릭',
                  '클릭률',
                  '상세 조회',
                  '지원 클릭',
                  '직무 평균 대비',
                ].map((head, index) => (
                  <th
                    key={head}
                    scope="col"
                    className={cn(
                      'px-3 py-2 font-semibold whitespace-nowrap',
                      index >= 3 ? 'text-right' : 'text-left',
                    )}
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.itemId} className="border-t border-gray-100">
                  <th
                    scope="row"
                    className="px-3 py-2 text-left font-semibold whitespace-nowrap text-gray-900"
                  >
                    {row.placementName}
                  </th>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                    {row.jobField ? enumLabel('JobField', row.jobField) : '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                    {formatShortDate(row.startDate)} ~ {formatShortDate(row.endDate)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-900">{number(row.impressions)}</td>
                  <td className="px-3 py-2 text-right text-gray-900">{number(row.clicks)}</td>
                  <td className="px-3 py-2 text-right text-gray-900">{row.ctr.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right text-gray-900">{number(row.detailViews)}</td>
                  <td className="px-3 py-2 text-right text-gray-900">{number(row.applyClicks)}</td>
                  <td
                    className={cn(
                      'px-3 py-2 text-right font-semibold',
                      row.ctrDiffFromJobFieldAverage >= 0 ? 'text-blue-500' : 'text-error',
                    )}
                  >
                    {signed(row.ctrDiffFromJobFieldAverage, '%p')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-gray-200 p-4 break-inside-avoid">
        <h3 className="text-base font-bold text-gray-900">일별 추이</h3>
        <TrendChart daily={report.daily} postDeadline={report.postDeadline} />
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-md border border-gray-200 p-4 break-inside-avoid">
          <h3 className="text-base font-bold text-gray-900">유저 반응</h3>
          <p className="pt-2 text-sm text-gray-700">
            관심 없음 {report.reactions.notInterested}건 · 신고 {report.reactions.reports}건
          </p>
          <p className="pt-1 text-xs text-gray-500">
            {report.reactions.reports === 0 && report.reactions.notInterested <= 5
              ? '부정 반응이 거의 없어요.'
              : '관심 없음·신고가 있었어요. 소재를 바꿔 보는 것도 방법이에요.'}
          </p>
        </section>
        <section className="flex flex-col gap-2 rounded-md border border-blue-200 bg-blue-00 p-4 break-inside-avoid print:hidden">
          <h3 className="text-base font-bold text-gray-900">같은 조건으로 다시 신청</h3>
          <p className="text-sm text-gray-700">
            {report.rows
              .map(
                (row) =>
                  `${row.placementName}${row.jobField ? ` ${enumLabel('JobField', row.jobField)}` : ''}`,
              )
              .join(' + ')}
          </p>
          <Button asChild size="sm" className="self-start">
            <Link href={adApplyHref({ fromApplicationId: id })}>다시 신청하기</Link>
          </Button>
        </section>
      </div>

      <section className="flex flex-col gap-2 break-inside-avoid">
        <h3 className="text-base font-bold text-gray-900">인사이트</h3>
        <ol className="flex flex-col gap-2">
          {report.insights.map((insight, index) => (
            <li
              key={insight}
              className="flex gap-3 rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700"
            >
              <span className="font-bold text-blue-500">{String(index + 1).padStart(2, '0')}</span>
              {insight}
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
