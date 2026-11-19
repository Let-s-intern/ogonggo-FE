'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  getAdvertisementContractReport,
  type AdvertisementContractReportResponse,
} from '@ogonggo/api';

interface DateRange {
  from: string;
  to: string;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; report: AdvertisementContractReportResponse }
  | { kind: 'error' };

function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: toInputDate(from), to: toInputDate(to) };
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function MetricCard({
  label,
  total,
  uniqueUsers,
  perUser,
}: {
  label: string;
  total: number;
  uniqueUsers: number;
  perUser: number;
}) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
      <h2 className="text-sm font-medium text-gray-500">{label}</h2>
      <p className="mt-2 text-2xl font-bold text-gray-950">{formatNumber(total)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>
          <dt>고유 사용자</dt>
          <dd className="mt-1 font-semibold text-gray-800">{formatNumber(uniqueUsers)}</dd>
        </div>
        <div>
          <dt>사용자당</dt>
          <dd className="mt-1 font-semibold text-gray-800">{perUser.toFixed(2)}</dd>
        </div>
      </dl>
    </article>
  );
}

function DailyChart({ report }: { report: AdvertisementContractReportResponse }) {
  const rows = useMemo(() => {
    const byDate = new Map<string, { impressions: number; clicks: number }>();
    for (const row of report.daily) {
      const current = byDate.get(row.date) ?? { impressions: 0, clicks: 0 };
      current.impressions += row.impressions.total;
      current.clicks += row.clicks.total;
      byDate.set(row.date, current);
    }
    return [...byDate.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [report.daily]);

  if (!rows.some(([, values]) => values.impressions > 0 || values.clicks > 0)) {
    return (
      <p className="py-12 text-center text-sm text-gray-500">
        선택한 기간에 집계된 데이터가 없습니다.
      </p>
    );
  }

  const width = 720;
  const height = 220;
  const padding = { top: 12, right: 12, bottom: 34, left: 12 };
  const chartHeight = height - padding.top - padding.bottom;
  const max = Math.max(1, ...rows.flatMap(([, values]) => [values.impressions, values.clicks]));
  const slot = (width - padding.left - padding.right) / rows.length;
  const barWidth = Math.max(2, Math.min(12, slot * 0.32));

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label="날짜별 노출과 클릭"
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[560px] w-full"
      >
        {rows.map(([date, values], index) => {
          const center = padding.left + slot * index + slot / 2;
          const impressionHeight = (values.impressions / max) * chartHeight;
          const clickHeight = (values.clicks / max) * chartHeight;
          return (
            <g key={date}>
              <rect
                x={center - barWidth - 1}
                y={padding.top + chartHeight - impressionHeight}
                width={barWidth}
                height={impressionHeight}
                rx="2"
                fill="#60a5fa"
              />
              <rect
                x={center + 1}
                y={padding.top + chartHeight - clickHeight}
                width={barWidth}
                height={clickHeight}
                rx="2"
                fill="#2563eb"
              />
              {index === 0 ||
              index === rows.length - 1 ||
              index % Math.ceil(rows.length / 6) === 0 ? (
                <text x={center} y={height - 9} textAnchor="middle" fontSize="10" fill="#6b7280">
                  {date.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-center gap-5 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-sm bg-blue-300" />
          노출
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="size-2.5 rounded-sm bg-blue-700" />
          클릭
        </span>
      </div>
    </div>
  );
}

/** 계약별 리포트. API 응답 스키마에 맞춘 요약과 원본 breakdown만 보여 준다. */
export function AdvertisementContractReportPage({ contractId }: { contractId: number }) {
  const [draftRange, setDraftRange] = useState<DateRange>({ from: '', to: '' });
  const [range, setRange] = useState<DateRange | null>(null);
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [rangeError, setRangeError] = useState<string | null>(null);

  useEffect(() => {
    const initial = defaultRange();
    setDraftRange(initial);
    setRange(initial);
  }, []);

  useEffect(() => {
    if (!range) return;
    let active = true;
    setState({ kind: 'loading' });
    getAdvertisementContractReport(contractId, range)
      .then((response) => {
        if (active) setState({ kind: 'ready', report: response.data });
      })
      .catch(() => {
        if (active) setState({ kind: 'error' });
      });
    return () => {
      active = false;
    };
  }, [contractId, range]);

  const submitRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draftRange.from || !draftRange.to) {
      setRangeError('조회 시작일과 종료일을 선택해 주세요.');
      return;
    }
    if (draftRange.from > draftRange.to) {
      setRangeError('조회 시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }
    setRangeError(null);
    setRange({ ...draftRange });
  };

  const report = state.kind === 'ready' ? state.report : undefined;

  return (
    <section className="flex flex-col gap-5 md:gap-6">
      <header className="hidden md:block">
        <Link
          href="/mypage/company/advertisement-contracts"
          className="text-sm text-blue-700 hover:underline"
        >
          광고 리포트 목록
        </Link>
        <h1 className="mt-3 text-3xl font-bold text-gray-950">광고 성과 리포트</h1>
        <p className="pt-2 text-sm text-gray-500">계약 #{contractId}</p>
      </header>

      <form
        onSubmit={submitRange}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          시작일
          <input
            type="date"
            value={draftRange.from}
            onChange={(event) => setDraftRange((value) => ({ ...value, from: event.target.value }))}
            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
          종료일
          <input
            type="date"
            value={draftRange.to}
            onChange={(event) => setDraftRange((value) => ({ ...value, to: event.target.value }))}
            className="h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          조회
        </button>
        {rangeError ? (
          <p role="alert" className="w-full text-sm text-error">
            {rangeError}
          </p>
        ) : null}
      </form>

      {state.kind === 'loading' ? (
        <p className="rounded-md border border-gray-200 px-4 py-12 text-center text-sm text-gray-500">
          리포트를 불러오는 중입니다.
        </p>
      ) : state.kind === 'error' ? (
        <p
          role="alert"
          className="rounded-md border border-gray-200 px-4 py-12 text-center text-sm text-error"
        >
          리포트를 불러오지 못했습니다. 기간을 확인한 뒤 다시 시도해 주세요.
        </p>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MetricCard label="노출" {...report.summary.impressions} />
            <MetricCard label="클릭" {...report.summary.clicks} />
          </div>

          <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
            <h2 className="font-semibold text-gray-950">날짜별 성과</h2>
            <p className="mt-1 text-xs text-gray-500">노출과 클릭 수</p>
            <DailyChart report={report} />
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
            <h2 className="font-semibold text-gray-950">광고 위치별 클릭</h2>
            {!report.positions.some((item) => item.clicks.total > 0) ? (
              <p className="py-8 text-center text-sm text-gray-500">
                집계된 클릭 데이터가 없습니다.
              </p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-500">
                      <th className="py-2 font-medium">항목</th>
                      <th className="py-2 text-right font-medium">클릭</th>
                      <th className="py-2 text-right font-medium">고유 사용자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.positions.map((item, index) => (
                      <tr
                        key={`${item.category}-${item.position ?? 'none'}-${index}`}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <td className="py-3 text-gray-800">
                          {item.category}
                          {item.position ? ` · ${item.position}` : ''}
                        </td>
                        <td className="py-3 text-right font-medium text-gray-950">
                          {formatNumber(item.clicks.total)}
                        </td>
                        <td className="py-3 text-right text-gray-600">
                          {formatNumber(item.clicks.uniqueUsers)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4 md:p-5">
            <h2 className="font-semibold text-gray-950">직무별 클릭 사용자</h2>
            {!report.jobRoleDistribution.some((item) => item.uniqueClickers > 0) ? (
              <p className="py-8 text-center text-sm text-gray-500">
                집계된 직무 데이터가 없습니다.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {report.jobRoleDistribution.map((item) => (
                  <li key={item.key} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-gray-700">{item.label}</span>
                    <span className="font-medium text-gray-950">
                      {formatNumber(item.uniqueClickers)}명
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="text-right text-xs text-gray-400">
            생성 시각 {formatTimestamp(report.generatedAt)}
          </p>
        </>
      ) : null}
    </section>
  );
}
