import { useMemo } from 'react';
import { Select } from '@ogonggo/ui';
import { KPI_QUERY, WINDOW_OPTIONS, useKpiQuery } from '@/entities/kpi';
import type { RedashRow } from '@/shared/api/redash';
import { EChart } from '@/shared/ui/EChart';
import { PageHeader } from '@/widgets/page-header';
import {
  type SeriesSpec,
  type TimeSeriesSpec,
  pivotLong,
  sortByX,
  timeSeriesOption,
} from '../lib/chartOptions';
import { useKpiFilters } from '../lib/useKpiFilters';
import { KpiFilterBar } from './KpiFilterBar';
import { MetricTile } from './MetricTile';
import { QueryCard } from './QueryCard';
import { ResultTable } from './ResultTable';

/** 같은 화면을 Redash 에서 보는 주소. 쿼리를 고치거나 원본을 확인할 때 쓴다. */
const REDASH_DASHBOARD_URL = 'https://redash.lets-career.com/dashboards/46--kpi-v2';

const PREVIOUS_LABEL: Record<string, string> = { 일간: '전일', 주간: '전주', 월간: '전월' };

/*
 * 차트 계열. Redash 위젯의 계열을 옮기되 두 가지를 바꿨다.
 * - Redash 의 방문자 차트는 명과 %를 한 차트의 두 y 축에 겹쳐 그렸다. 축이 둘이면 두 선의 높낮이가 아무
 *   뜻 없이 맞물려 보여, 신규 방문자 비율은 비율 추이 차트로 옮겼다.
 * - 더해서 뜻이 있는 값(가입 수, 수집 공고 수, 채널별 방문자)만 막대를 쌓는다.
 */
const VISITOR_SERIES: SeriesSpec[] = [{ column: '방문자' }, { column: '신규 방문자' }];
const RATE_SERIES: SeriesSpec[] = [
  { column: '신규 방문자 비율' },
  { column: '가입 전환율' },
  { column: '공고 상세 도달률' },
  { column: '지원 클릭률-상세 대비' },
  { column: '지원 클릭률-방문자 대비' },
  { column: '스크랩 저장률' },
];
const FUNNEL_SERIES: SeriesSpec[] = [
  { column: '공고 상세 조회 사용자', label: '공고 상세 조회' },
  { column: '지원 클릭 사용자', label: '지원 클릭' },
  { column: '스크랩 사용자', label: '스크랩' },
];
const SIGNUP_SERIES: SeriesSpec[] = [{ column: '일반 회원 가입' }, { column: '기업 회원 가입' }];
const RETENTION_SERIES: SeriesSpec[] = [
  { column: '재방문율' },
  { column: '재방문자 비중' },
  { column: '신규 활성화율' },
];
const JOB_INTAKE_SERIES: SeriesSpec[] = [{ column: '크롤러 수집' }, { column: '기업 직접 등록' }];

function TimeSeries({ rows, x, series, kind, stack, unit }: TimeSeriesSpec) {
  const option = useMemo(
    () => timeSeriesOption({ rows, x, series, kind, stack, unit }),
    [rows, x, series, kind, stack, unit],
  );
  return <EChart option={option} />;
}

function ChannelTrend({ rows }: { rows: RedashRow[] }) {
  const option = useMemo(() => {
    const pivoted = pivotLong(rows, {
      x: '기간',
      seriesColumn: '채널',
      value: '방문자',
      otherLabel: '그 외 채널',
    });
    return timeSeriesOption({ ...pivoted, x: '기간', kind: 'bar', stack: true, unit: '명' });
  }, [rows]);
  return <EChart option={option} height={320} />;
}

function numberAt(row: RedashRow | undefined, column: string): number | null {
  const value = row?.[column];
  return typeof value === 'number' ? value : null;
}

/** 시간 순으로 마지막 두 행. 맨 끝이 최근 기간이다. */
function lastTwo(rows: RedashRow[], x: string): [RedashRow | undefined, RedashRow | undefined] {
  const sorted = sortByX(rows, x);
  return [sorted.at(-1), sorted.at(-2)];
}

/**
 * 오늘이 들어 있어 아직 끝나지 않은 기간인지. 주간·월간의 마지막 행이 그렇다. 일간의 마지막 행은 GA4
 * 집계가 하루 늦어 어제다.
 */
function isInProgress(periodStart: string, period: string): boolean {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  if (period === '주간') {
    const weekEnd = new Date(Date.parse(`${periodStart}T00:00:00Z`) + 6 * 86_400_000);
    return weekEnd.toISOString().slice(0, 10) >= today;
  }
  if (period === '월간') {
    return periodStart.slice(0, 7) === today.slice(0, 7);
  }
  return periodStart >= today;
}

/**
 * KPI 타일이 보여줄 행과 비교할 행. 마지막 기간이 진행 중이면 하루치 이번 주를 지난주 전체와 견주게
 * 되어 늘 크게 떨어진 것처럼 보인다. 그때는 끝난 마지막 기간과 그 앞을 쓴다.
 */
function completedLastTwo(
  rows: RedashRow[],
  period: string,
): [RedashRow | undefined, RedashRow | undefined] {
  const sorted = sortByX(rows, '기간');
  const last = sorted.at(-1);
  const offset = last && isInProgress(String(last['기간']), period) ? 1 : 0;
  return [sorted.at(-1 - offset), sorted.at(-2 - offset)];
}

/**
 * 통계 — Redash `[오늘의공고] KPI 대시보드 v2` 를 어드민에서 보는 화면.
 *
 * 숫자는 모두 Redash 쿼리에서 온다(`api/redash-query.ts`). 지표의 정의를 바꾸려면 이 화면이 아니라
 * Redash 쿼리를 고친다. 이 화면이 아는 것은 결과 컬럼 이름뿐이라, 컬럼 이름을 바꾸면 여기도 바꾼다.
 */
export function StatsPage() {
  const { filters, setFilters } = useKpiFilters();

  const periodKpi = useKpiQuery(KPI_QUERY.periodKpi, filters);
  const signups = useKpiQuery(KPI_QUERY.signups, filters);
  const weeklyRetention = useKpiQuery(KPI_QUERY.weeklyRetention, filters);
  const jobCounts = useKpiQuery(KPI_QUERY.jobCounts, filters);
  const jobPerformance = useKpiQuery(KPI_QUERY.jobPerformance, filters);
  const channelKpi = useKpiQuery(KPI_QUERY.channelKpi, filters);
  const channelTrend = useKpiQuery(KPI_QUERY.channelTrend, filters);
  const searchLanding = useKpiQuery(KPI_QUERY.searchLanding, filters);

  const [latest, previous] = completedLastTwo(periodKpi.data?.rows ?? [], filters.period);
  const [latestJobs] = lastTwo(jobCounts.data?.rows ?? [], '기간');
  const previousLabel = PREVIOUS_LABEL[filters.period];
  const latestCaption = latest
    ? `${latest['기간']}${filters.period === '일간' ? '' : ' 시작'} 기준`
    : undefined;

  return (
    <>
      <PageHeader
        title="통계"
        action={
          <a
            href={REDASH_DASHBOARD_URL}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Redash 에서 보기
          </a>
        }
      />

      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <KpiFilterBar filters={filters} onChange={setFilters} />
          <p className="text-xs text-gray-500">
            방문·전환은 GA4(10/13 런칭부터, 기기 기준 순 사용자), 가입·공고 수는 서비스 DB(KST)
            기준입니다. 직군·경력 필터는 이벤트가 일어난 공고의 속성이라 공고 이벤트에만 걸립니다.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">KPI</h2>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <MetricTile
              label="방문자"
              value={numberAt(latest, '방문자')}
              unit="명"
              previous={numberAt(previous, '방문자')}
              previousLabel={previousLabel}
              caption={latestCaption}
            />
            <MetricTile
              label="가입 전환율"
              value={numberAt(latest, '가입 전환율')}
              unit="%"
              previous={numberAt(previous, '가입 전환율')}
              previousLabel={previousLabel}
              caption={latestCaption}
            />
            <MetricTile
              label="공고 상세 도달률"
              value={numberAt(latest, '공고 상세 도달률')}
              unit="%"
              previous={numberAt(previous, '공고 상세 도달률')}
              previousLabel={previousLabel}
              caption={latestCaption}
            />
            <MetricTile
              label="지원 클릭률(방문자 대비)"
              value={numberAt(latest, '지원 클릭률-방문자 대비')}
              unit="%"
              previous={numberAt(previous, '지원 클릭률-방문자 대비')}
              previousLabel={previousLabel}
              caption={latestCaption}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <QueryCard
              title="방문자 · 신규 방문자"
              description="일간은 DAU, 주간은 WAU, 월간은 MAU 입니다."
              query={periodKpi}
              chart={({ rows }) => (
                <TimeSeries rows={rows} x="기간" series={VISITOR_SERIES} kind="bar" unit="명" />
              )}
            >
              {(result) => (
                <ResultTable
                  result={result}
                  columns={['기간', '방문자', '신규 방문자', '신규 방문자 비율']}
                />
              )}
            </QueryCard>
            <QueryCard
              title="비율 추이"
              description="신규 방문자 비율과 단계별 전환율. 단위는 모두 %입니다."
              query={periodKpi}
              chart={({ rows }) => (
                <TimeSeries rows={rows} x="기간" series={RATE_SERIES} kind="line" unit="%" />
              )}
            >
              {(result) => (
                <ResultTable
                  result={result}
                  columns={['기간', ...RATE_SERIES.map(({ column }) => column)]}
                />
              )}
            </QueryCard>
            <QueryCard
              title="공고 조회 → 지원 클릭 · 스크랩 사용자"
              query={periodKpi}
              chart={({ rows }) => (
                <TimeSeries rows={rows} x="기간" series={FUNNEL_SERIES} kind="bar" unit="명" />
              )}
            >
              {(result) => (
                <ResultTable
                  result={result}
                  columns={[
                    '기간',
                    ...FUNNEL_SERIES.map(({ column }) => column),
                    '1인당 조회 공고 수',
                  ]}
                />
              )}
            </QueryCard>
            <QueryCard
              title="회원가입 (일반 / 기업)"
              description="서비스 DB 기준이라 채널·직군·경력 필터가 걸리지 않습니다."
              query={signups}
              chart={({ rows }) => (
                <TimeSeries
                  rows={rows}
                  x="기간"
                  series={SIGNUP_SERIES}
                  kind="bar"
                  stack
                  unit="명"
                />
              )}
            />
            <QueryCard
              title="재방문율 · 신규 활성화율 (주간)"
              description="주는 월요일에 시작합니다. 이번 주는 집계 중인 값입니다."
              query={weeklyRetention}
              chart={({ rows }) => (
                <TimeSeries
                  rows={rows}
                  x="주 월요일 시작"
                  series={RETENTION_SERIES}
                  kind="line"
                  unit="%"
                />
              )}
              className="xl:col-span-2"
            />
          </div>

          <QueryCard title="기간별 KPI 전체" query={periodKpi} />
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">운영</h2>
            <p className="pt-1 text-sm text-gray-500">
              아래 세 수치는 지금 시점 기준이라 기간 필터가 걸리지 않습니다.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <MetricTile label="모집중 공고" value={numberAt(latestJobs, '모집중 공고')} unit="건" />
            <MetricTile
              label="마감 후 노출 중 공고"
              value={numberAt(latestJobs, '마감 후 노출 중 공고')}
              unit="건"
            />
            <MetricTile
              label="마감일 경과 · 모집중 표기"
              value={numberAt(latestJobs, '마감일 경과 모집중 표기')}
              unit="건"
              caption="0 이 아니면 상태 점검이 필요합니다."
            />
          </div>

          <QueryCard
            title="신규 수집 공고 (크롤러 / 기업 등록)"
            query={jobCounts}
            chart={({ rows }) => (
              <TimeSeries
                rows={rows}
                x="기간"
                series={JOB_INTAKE_SERIES}
                kind="bar"
                stack
                unit="건"
              />
            )}
          >
            {(result) => (
              <ResultTable
                result={result}
                columns={['기간', '신규 수집 공고', '크롤러 수집', '기업 직접 등록']}
                maxHeight={360}
              />
            )}
          </QueryCard>

          <QueryCard
            title="공고별 성과"
            description="성과 기간은 이 표에만 걸립니다."
            query={jobPerformance}
            action={
              <Select
                aria-label="성과 기간"
                value={filters.window}
                options={WINDOW_OPTIONS.map((value) => ({ value, label: value }))}
                onChange={(event) => setFilters({ window: event.target.value })}
              />
            }
          >
            {(result) => <ResultTable result={result} maxHeight={480} />}
          </QueryCard>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-gray-900">마케팅</h2>

          <QueryCard title="채널별 KPI" query={channelKpi} />

          <QueryCard
            title="채널별 방문자 추이"
            description="방문자가 많은 채널 일곱 개를 따로 보이고 나머지는 합칩니다."
            query={channelTrend}
            chart={({ rows }) => <ChannelTrend rows={rows} />}
          />

          <QueryCard title="검색 유입 랜딩 페이지" query={searchLanding}>
            {(result) => <ResultTable result={result} maxHeight={480} />}
          </QueryCard>
        </section>
      </div>
    </>
  );
}
