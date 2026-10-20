import {
  getJob,
  listJobs,
  listServiceFeedbacks,
  listTodayJobs,
  type ListJobsParams,
} from '@ogonggo/api/src/admin';
import {
  DEFAULT_KPI_FILTERS,
  KPI_QUERY,
  type KpiFilters,
  type RangePreset,
  toRedashParameters,
} from '@/entities/kpi';
import { omitEmpty } from '@/shared/api/omitEmpty';
import { runRedashQuery } from '@/shared/api/redash';
import { unwrapData } from '@/shared/api/unwrapData';
import { NAV_SECTIONS } from '@/shared/config/navigation';
import { FILLABLE_JOB_FIELDS, type FillableJobField, requestJobFill } from './jobFill';

/**
 * AI 비서의 도구 실행기. 모델이 부른 도구를 브라우저에서 기존 어드민 API 로 실행한다. 도구의 이름과
 * 인자 모양은 `api/assistant.ts` 의 `TOOLS` 와 같다.
 *
 * 로그인한 관리자의 토큰으로 실행되므로 비서는 그 관리자가 할 수 있는 일을 넘지 못한다. 그중에서도 조회와
 * 화면 이동, 수정 창 채우기만 둔다 — 저장·삭제·노출 변경을 부르는 실행기는 없다.
 *
 * 실행기는 모델에게 돌려줄 글을 만든다. 실패도 글로 돌려줘 모델이 사용자에게 설명하게 한다.
 */

export interface ToolContext {
  navigate: (path: string) => void;
}

/** 모델에게 돌려줄 결과의 최대 길이. 길면 다음 호출의 입력이 커져 느리고 비싸다. */
const MAX_RESULT_LENGTH = 12_000;
/** 공고 본문 칸 하나에서 모델에게 넘길 최대 길이. */
const MAX_BODY_LENGTH = 2_500;
const MAX_STATS_ROWS = 30;

const STATS_TITLES: Record<number, string> = {
  [KPI_QUERY.periodKpi]: 'KPI 기간별 (GA4)',
  [KPI_QUERY.signups]: '회원가입 기간별 (DB)',
  [KPI_QUERY.weeklyRetention]: '재방문율·신규 활성화율 주간 (GA4)',
  [KPI_QUERY.jobCounts]: '공고 수 (DB)',
  [KPI_QUERY.jobPerformance]: '공고별 성과 (GA4)',
  [KPI_QUERY.channelKpi]: '채널별 KPI (GA4)',
  [KPI_QUERY.channelTrend]: '채널별 방문자 추이 (GA4)',
  [KPI_QUERY.searchLanding]: '검색 유입 랜딩 페이지 (GA4)',
};

/** 화면 이동을 허용하는 경로. 메뉴에 있는 목록과 상세뿐이다. */
const MENU_PATHS = new Set(
  NAV_SECTIONS.flatMap((section) => section.items)
    .filter((item) => !item.disabled)
    .map((item) => item.path),
);
const DETAIL_PATH =
  /^\/(content\/(jobs|bootcamps|side-studies|concerns)|members\/(users|companies))\/\d+$/;

/** 사용자에게 보일 진행 문구. 모델이 무엇을 하고 있는지 채팅 창에 한 줄로 적는다. */
export function describeToolCall(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case 'search_jobs':
      return args.keyword ? `공고 검색: ${String(args.keyword)}` : '공고 검색';
    case 'get_job':
      return `공고 ${String(args.jobId)} 읽기`;
    case 'get_stats':
      return '통계 불러오기';
    case 'list_pick_jobs':
      return '오공고 PICK 목록 읽기';
    case 'get_job_performance':
      return '공고별 성과 불러오기';
    case 'list_service_feedbacks':
      return '서비스 의견 읽기';
    case 'read_screen':
      return '지금 화면 읽기';
    case 'navigate':
      return `화면 이동: ${String(args.path)}`;
    case 'fill_job_text':
      return `공고 ${String(args.jobId)} 수정 창 채우기`;
    default:
      return name;
  }
}

function clip(text: string): string {
  return text.length > MAX_RESULT_LENGTH
    ? `${text.slice(0, MAX_RESULT_LENGTH)}\n(이하 생략)`
    : text;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
}

async function searchJobs(args: Record<string, unknown>): Promise<string> {
  const size = Math.min(asNumber(args.size) ?? 10, 20);
  // 모델이 넘긴 값 중 문자열만 쓴다. 맞지 않는 enum 값은 어드민 API 가 400 으로 거절하고, 그 문구가
  // 모델에게 돌아간다.
  const text = (value: unknown) => (typeof value === 'string' ? value : '');
  const params = omitEmpty({
    keyword: text(args.keyword),
    recruitmentStatus: text(args.recruitmentStatus),
    jobField: text(args.jobField),
    visibility: text(args.visibility),
    source: text(args.source),
    sort: text(args.sort) || 'REGISTERED_AT',
    page: 1,
    size,
  }) as ListJobsParams;
  const page = await unwrapData(listJobs(params));
  return JSON.stringify({
    total: page?.pageInfo.totalElements ?? 0,
    items: (page?.items ?? []).map((job) => ({
      id: job.id,
      title: job.title,
      company: job.companyName,
      jobField: job.jobField,
      recruitmentStatus: job.recruitmentStatus,
      visibility: job.visibility,
      recruitmentEndAt: job.recruitmentEndAt,
      viewCount: job.viewCount,
    })),
  });
}

async function readJob(args: Record<string, unknown>): Promise<string> {
  const jobId = asNumber(args.jobId);
  if (!jobId) {
    return 'jobId 가 올바르지 않습니다.';
  }
  const job = await unwrapData(getJob(jobId));
  if (!job) {
    return `공고 ${jobId} 를 찾지 못했습니다.`;
  }
  const body = Object.fromEntries(
    FILLABLE_JOB_FIELDS.filter((field) => field !== 'title').map((field) => [
      field,
      (job[field] ?? '').slice(0, MAX_BODY_LENGTH),
    ]),
  );
  return JSON.stringify({
    id: job.id,
    title: job.title,
    company: job.companyName,
    jobField: job.jobField,
    jobRole: job.jobRole,
    employmentType: job.employmentType,
    experienceType: job.experienceType,
    recruitmentStartAt: job.recruitmentStartAt,
    recruitmentEndAt: job.recruitmentEndAt,
    visibility: job.visibility,
    source: job.source,
    ...body,
  });
}

async function readStats(args: Record<string, unknown>): Promise<string> {
  const filters: KpiFilters = {
    ...DEFAULT_KPI_FILTERS,
    range: (['7d', '30d', '90d', 'this-month', 'last-month'] as const).includes(args.range as never)
      ? (args.range as RangePreset)
      : DEFAULT_KPI_FILTERS.range,
    period: ['일간', '주간', '월간'].includes(args.period as string)
      ? (args.period as string)
      : DEFAULT_KPI_FILTERS.period,
  };
  const queryIds = Object.values(KPI_QUERY);
  const results = await Promise.all(
    queryIds.map((queryId) => runRedashQuery(queryId, toRedashParameters(queryId, filters))),
  );
  return queryIds
    .map((queryId, index) => {
      const result = results[index]!;
      const columns = result.columns.map(({ name }) => name);
      const rows = result.rows.slice(0, MAX_STATS_ROWS);
      const cut =
        result.rows.length > rows.length
          ? ` (전체 ${result.rows.length}행 중 위 ${rows.length}행)`
          : '';
      return [
        `### ${STATS_TITLES[queryId]}${cut}`,
        columns.join('\t'),
        ...rows.map((row) => columns.map((column) => row[column] ?? '').join('\t')),
      ].join('\n');
    })
    .join('\n\n');
}

async function pickJobIds(): Promise<Set<number>> {
  const picks = await unwrapData(listTodayJobs());
  return new Set((picks ?? []).map((job) => job.id));
}

async function listPickJobs(): Promise<string> {
  const picks = await unwrapData(listTodayJobs());
  return JSON.stringify(
    (picks ?? []).map((job) => ({
      id: job.id,
      title: job.title,
      company: job.companyName,
      recruitmentStatus: job.recruitmentStatus,
      recruitmentEndAt: job.recruitmentEndAt,
      recommendationTitle: job.recommendationTitle,
    })),
  );
}

/** `get_job_performance` 의 정렬 기준과 Redash 공고별 성과 쿼리의 컬럼. */
const PERFORMANCE_SORT_COLUMNS: Record<string, string> = {
  cardClick: '카드 클릭 사용자',
  detailView: '상세 조회 사용자',
  applyClick: '지원 클릭 사용자',
  applyRate: '조회 지원 전환율',
  saveRate: '저장률',
};

/**
 * 공고별 성과에 오공고 PICK 등록 여부를 붙인다. 성과는 Redash(GA4), PICK 은 어드민 API 라 두 곳을 각각
 * 불러와 공고 ID 로 맞춘다.
 */
async function jobPerformance(args: Record<string, unknown>): Promise<string> {
  const window = ['최근 7일', '최근 30일', '누적'].includes(args.window as string)
    ? (args.window as string)
    : DEFAULT_KPI_FILTERS.window;
  const sortColumn =
    PERFORMANCE_SORT_COLUMNS[String(args.sortBy)] ?? PERFORMANCE_SORT_COLUMNS.applyClick!;
  const limit = Math.min(asNumber(args.limit) ?? 20, 50);
  const pickFilter = String(args.pick ?? 'all');

  const [result, picks] = await Promise.all([
    runRedashQuery(
      KPI_QUERY.jobPerformance,
      toRedashParameters(KPI_QUERY.jobPerformance, { ...DEFAULT_KPI_FILTERS, window }),
    ),
    pickJobIds(),
  ]);
  const rows = result.rows
    .map((row) => ({ row, pick: picks.has(Number(row['공고 ID'])) }))
    .filter(({ pick }) =>
      pickFilter === 'not_pick' ? !pick : pickFilter === 'pick_only' ? pick : true,
    )
    .sort((a, b) => Number(b.row[sortColumn] ?? 0) - Number(a.row[sortColumn] ?? 0))
    .slice(0, limit)
    .map(({ row, pick }) => ({ ...row, pick }));
  return JSON.stringify({
    window,
    sortedBy: sortColumn,
    pickCount: picks.size,
    totalJobs: result.rows.length,
    rows,
  });
}

/**
 * 서비스 의견. 작성자 이름·이메일은 넘기지 않는다 — 의견을 묶고 요약하는 데 필요 없는 개인정보다.
 */
async function serviceFeedbacks(args: Record<string, unknown>): Promise<string> {
  const size = Math.min(asNumber(args.size) ?? 50, 100);
  const page = await unwrapData(listServiceFeedbacks({ page: 1, size }));
  return JSON.stringify({
    total: page?.pageInfo.totalElements ?? 0,
    items: (page?.items ?? []).map((item) => ({
      id: item.id,
      satisfaction: item.satisfaction,
      improvement: item.improvement,
      registeredAt: item.registeredAt,
    })),
  });
}

/**
 * 지금 보이는 화면의 글. 열린 모달이 있으면 그 안만, 아니면 본문만 읽는다. 좌측 메뉴와 비서 패널은 빼고,
 * 읽기만 한다.
 */
async function readScreen(): Promise<string> {
  // 이동 직후면 목록이 아직 그려지는 중일 수 있다.
  await new Promise((resolve) => setTimeout(resolve, 500));
  const dialogs = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')];
  const root = dialogs.at(-1) ?? document.querySelector('main');
  return JSON.stringify({
    path: location.pathname + location.search,
    modal: root?.tagName === 'DIALOG',
    text: (root?.innerText ?? '').replace(/\n{3,}/g, '\n\n').slice(0, MAX_RESULT_LENGTH - 500),
  });
}

function goTo(args: Record<string, unknown>, context: ToolContext): string {
  const path = typeof args.path === 'string' ? args.path.trim() : '';
  const pathname = path.split('?')[0] ?? '';
  if (!MENU_PATHS.has(pathname) && !DETAIL_PATH.test(pathname)) {
    return `${path} 는 이동할 수 없는 경로입니다.`;
  }
  context.navigate(path);
  return `${path} 로 이동했습니다.`;
}

function fillJobText(args: Record<string, unknown>, context: ToolContext): string {
  const jobId = asNumber(args.jobId);
  const raw = typeof args.fields === 'object' && args.fields !== null ? args.fields : {};
  const values = Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [FillableJobField, string] =>
        FILLABLE_JOB_FIELDS.includes(entry[0] as FillableJobField) && typeof entry[1] === 'string',
    ),
  );
  if (!jobId || Object.keys(values).length === 0) {
    return '채울 공고나 칸이 올바르지 않습니다. 채울 수 있는 칸: ' + FILLABLE_JOB_FIELDS.join(', ');
  }
  context.navigate(`/content/jobs/${jobId}`);
  requestJobFill(jobId, values);
  return `공고 ${jobId} 수정 창의 ${Object.keys(values).join(', ')} 칸을 채웠습니다. 저장은 하지 않았습니다 — 사용자가 확인하고 저장을 눌러야 반영됩니다.`;
}

export async function runTool(
  name: string,
  args: Record<string, unknown>,
  context: ToolContext,
): Promise<string> {
  try {
    switch (name) {
      case 'search_jobs':
        return clip(await searchJobs(args));
      case 'get_job':
        return clip(await readJob(args));
      case 'get_stats':
        return clip(await readStats(args));
      case 'list_pick_jobs':
        return clip(await listPickJobs());
      case 'get_job_performance':
        return clip(await jobPerformance(args));
      case 'list_service_feedbacks':
        return clip(await serviceFeedbacks(args));
      case 'read_screen':
        return await readScreen();
      case 'navigate':
        return goTo(args, context);
      case 'fill_job_text':
        return fillJobText(args, context);
      default:
        return `${name} 는 없는 도구입니다.`;
    }
  } catch (error) {
    return `도구 실행에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`;
  }
}
