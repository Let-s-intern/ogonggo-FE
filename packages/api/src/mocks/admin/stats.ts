import { http, HttpResponse, type HttpHandler } from 'msw';
import { ADMIN_BOOTCAMP_FIXTURES, ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import { ok, readPaging, paginate, type PageResponse } from './paging';

/**
 * 콘텐츠 지표 핸들러.
 *
 * 클릭률은 원문 이동 클릭을 조회 수로 나눈 값인데, 백엔드 `JobSourceUrlClick` 이 `user_id` 를
 * 필수 칸으로 잡고 있어 비로그인 클릭이 기록되지 않는다. 조회 수는 로그인 여부와 무관하게
 * 오르므로 이 값은 실제보다 낮게 나온다 — 화면이 "로그인 사용자 기준"이라고 적는 이유다
 * (PRD "통계 · 콘텐츠 지표").
 *
 * 목에는 클릭 수 원본이 없어 북마크 수를 클릭 수 자리에 놓지 않는다. 그럴듯한 숫자를 만들어
 * 넣으면 화면은 완성되지만 지표를 못 믿게 된다. id 에서 계산한 값을 쓰고, 백엔드가 생기면
 * 이 함수만 사라진다.
 */

export interface ContentMetricRow {
  id: number;
  title: string;
  companyName: string;
  contentType: 'JOB' | 'BOOTCAMP';
  viewCount: number;
  bookmarkCount: number;
  /** 원문·지원 페이지로 이동한 횟수. 로그인 사용자 기준이다. */
  sourceClickCount: number;
  registeredAt: string;
}

/**
 * 조회 수의 3~12% 를 클릭으로 잡는다. id 로 계산해 새로고침해도 값이 흔들리지 않는다 —
 * 매번 달라지면 정렬이 도는지 확인할 수 없다.
 */
const sourceClickCountFor = (id: number, viewCount: number): number =>
  Math.floor((viewCount * (3 + (id % 10))) / 100);

const ROWS: ContentMetricRow[] = [
  ...ADMIN_JOB_FIXTURES.map((job) => ({
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    contentType: 'JOB' as const,
    viewCount: job.viewCount,
    bookmarkCount: job.bookmarkCount,
    sourceClickCount: sourceClickCountFor(job.id, job.viewCount),
    registeredAt: job.registeredAt,
  })),
  ...ADMIN_BOOTCAMP_FIXTURES.map((bootcamp) => ({
    id: bootcamp.id,
    title: bootcamp.title,
    companyName: bootcamp.companyName,
    contentType: 'BOOTCAMP' as const,
    viewCount: bootcamp.viewCount,
    bookmarkCount: bootcamp.bookmarkCount,
    sourceClickCount: sourceClickCountFor(bootcamp.id, bootcamp.viewCount),
    registeredAt: bootcamp.registeredAt,
  })),
];

type MetricSort = 'VIEW_COUNT' | 'CLICK_COUNT' | 'CLICK_RATE';

const clickRate = (row: ContentMetricRow): number =>
  row.viewCount === 0 ? 0 : row.sourceClickCount / row.viewCount;

/**
 * 기간 필터는 등록일 기준이다.
 *
 * 조회가 언제 일어났는지가 아니라 콘텐츠가 언제 올라왔는지로 자른다. `JobMetric` 이 누적
 * 조회 수만 들고 있어 "지난 7일에 발생한 조회"를 뽑을 원본이 없기 때문이다(PRD 열린 질문).
 * 화면도 이 기준을 그대로 적는다.
 */
const listContentMetricsHandler = http.get('*/api/v1/admin/stats/content', ({ request }) => {
  const url = new URL(request.url);
  const contentType = url.searchParams.get('contentType') ?? '';
  const days = Number(url.searchParams.get('registeredWithinDays') ?? '');
  const sortParam = url.searchParams.get('sort');
  const sort: MetricSort =
    sortParam === 'CLICK_COUNT' || sortParam === 'CLICK_RATE' ? sortParam : 'VIEW_COUNT';
  const { page, size } = readPaging(url);

  const threshold = Number.isInteger(days) && days > 0 ? Date.now() - days * 86_400_000 : null;

  const filtered = ROWS.filter((row) => {
    if (contentType && row.contentType !== contentType) {
      return false;
    }
    if (threshold !== null && new Date(row.registeredAt).getTime() < threshold) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'CLICK_COUNT') {
      return b.sourceClickCount - a.sourceClickCount || b.viewCount - a.viewCount;
    }
    if (sort === 'CLICK_RATE') {
      return clickRate(b) - clickRate(a) || b.viewCount - a.viewCount;
    }
    return b.viewCount - a.viewCount || b.id - a.id;
  });

  const body: PageResponse<ContentMetricRow> = paginate(sorted, page, size);
  return HttpResponse.json(ok(body), { status: 200 });
});

export const statsHandlers: HttpHandler[] = [listContentMetricsHandler];
