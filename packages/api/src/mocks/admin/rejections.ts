import { http, HttpResponse, type HttpHandler } from 'msw';
import { REJECTIONS, findRejection, type RejectionTargetType } from '../fixtures/admin-rejection';
import { ADMIN_BOOTCAMP_FIXTURES, ADMIN_JOB_FIXTURES } from '../fixtures/admin-content';
import { matches, notFound, ok, paginate, readPaging, type PageResponse } from './paging';

/**
 * 반려 보관.
 *
 * 반려한 것들과 그때 보낸 사유를 모아 본다. 사유를 고칠 수도 있다 — 급하게 보낸 사유가 불친절
 *했거나 사실과 달랐을 때, 올린 사람에게 다시 설명할 길이 이것뿐이다.
 *
 * 사유를 지우는 길은 없다. 빈 사유로 남은 반려는 올린 사람이 무엇을 고쳐야 하는지 알 수 없어
 * 같은 글이 다시 올라온다.
 */

export interface RejectionListItem {
  type: RejectionTargetType;
  id: number;
  title: string;
  companyName: string;
  reason: string;
  rejectedAt: string;
  reasonUpdatedAt?: string;
  /**
   * 그 콘텐츠가 아직 남아 있는지.
   *
   * 반려한 뒤 삭제됐을 수 있다. 그때 목록에서 통째로 빼지 않고 남겨 둔다 — "반려하고 지웠다"는
   * 것도 기록이고, 행이 조용히 사라지면 무엇이 어떻게 됐는지 알 수 없다.
   */
  contentExists: boolean;
}

const exists = (type: RejectionTargetType, id: number): boolean =>
  type === 'JOB'
    ? ADMIN_JOB_FIXTURES.some((job) => job.id === id)
    : ADMIN_BOOTCAMP_FIXTURES.some((bootcamp) => bootcamp.id === id);

const listRejectionsHandler = http.get('*/api/v1/admin/rejections', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const type = url.searchParams.get('type') ?? '';
  const { page, size } = readPaging(url);

  const filtered = REJECTIONS.filter((entry) => {
    if (keyword && !matches(`${entry.title} ${entry.companyName} ${entry.reason}`, keyword)) {
      return false;
    }
    if (type && entry.type !== type) {
      return false;
    }
    return true;
  });

  // 최근 반려가 먼저다. 보관함은 방금 무엇을 돌려보냈는지 확인하러 오는 곳이다.
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.rejectedAt).getTime() - new Date(a.rejectedAt).getTime(),
  );
  const paged = paginate(sorted, page, size);
  const body: PageResponse<RejectionListItem> = {
    items: paged.items.map((entry) => ({ ...entry, contentExists: exists(entry.type, entry.id) })),
    pageInfo: paged.pageInfo,
  };
  return HttpResponse.json(ok(body), { status: 200 });
});

interface UpdateReasonRequest {
  reason: string;
}

const updateReasonHandler = http.patch(
  '*/api/v1/admin/rejections/:type/:id',
  async ({ params, request }) => {
    const type = String(params.type).toUpperCase() as RejectionTargetType;
    const record = findRejection(type, Number(params.id));
    if (!record) {
      return HttpResponse.json(notFound('반려 기록을 찾을 수 없습니다.'), { status: 404 });
    }

    const body = (await request.json()) as UpdateReasonRequest;
    const reason = body.reason?.trim() ?? '';
    if (reason.length === 0) {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: '반려 사유를 입력해 주세요.' },
        { status: 400 },
      );
    }

    record.reason = reason;
    record.reasonUpdatedAt = new Date().toISOString();
    return HttpResponse.json(ok(record), { status: 200 });
  },
);

export const rejectionHandlers: HttpHandler[] = [listRejectionsHandler, updateReasonHandler];
