import { http, HttpResponse, type HttpHandler } from 'msw';
import type {
  AdminConcernDetailResponse,
  AdminConcernSummaryResponse,
  ChangeAdminConcernVisibilityRequest,
  PageResponseAdminConcernSummaryResponse,
  SuccessResponseUnit,
} from '../../generated/admin/models';
import { ADMIN_CONCERN_FIXTURES } from '../fixtures/admin-concern';
import { matches, notFound, ok, paginate, readPaging } from './paging';

/**
 * 취준고민 고민글 핸들러(`/api/v1/admin/concerns`).
 *
 * 노출 일괄 변경은 사이드·스터디와 같이 하나라도 없는 id 가 있으면 아무것도 바꾸지 않는다.
 * 정렬은 등록일 역순이 기본이고 조회 수 정렬을 함께 받는다.
 */
const concerns = ADMIN_CONCERN_FIXTURES;

/** 목록에 나가는 칸만 남긴다. 본문과 수정일은 상세에만 있다. */
const toSummary = ({
  content: _content,
  updatedAt: _updatedAt,
  ...summary
}: AdminConcernDetailResponse): AdminConcernSummaryResponse => summary;

const listConcernsHandler = http.get('*/api/v1/admin/concerns', ({ request }) => {
  const url = new URL(request.url);
  const keyword = url.searchParams.get('keyword')?.trim() ?? '';
  const visibility = url.searchParams.get('visibility') ?? '';
  const category = url.searchParams.get('category') ?? '';
  const sort = url.searchParams.get('sort') === 'VIEW_COUNT' ? 'VIEW_COUNT' : 'REGISTERED_AT';
  const { page, size } = readPaging(url);

  const filtered = concerns.filter((concern) => {
    if (keyword && !matches(`${concern.title} ${concern.authorNickname ?? ''}`, keyword)) {
      return false;
    }
    if (visibility && concern.visibility !== visibility) {
      return false;
    }
    if (category && concern.category !== category) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const byRegisteredAt = new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    return sort === 'VIEW_COUNT' ? b.viewCount - a.viewCount || byRegisteredAt : byRegisteredAt;
  });
  const body: PageResponseAdminConcernSummaryResponse = paginate(sorted.map(toSummary), page, size);
  return HttpResponse.json(ok(body), { status: 200 });
});

const changeConcernVisibilitiesHandler = http.patch(
  '*/api/v1/admin/concerns/visibility',
  async ({ request }) => {
    const body = (await request.json()) as ChangeAdminConcernVisibilityRequest;
    const missing = body.ids.filter((id) => !concerns.some((concern) => concern.id === id));
    if (missing.length > 0) {
      return HttpResponse.json(notFound(`고민글을 찾을 수 없습니다: ${missing.join(', ')}`), {
        status: 404,
      });
    }
    for (const concern of concerns) {
      if (body.ids.includes(concern.id)) {
        concern.visibility = body.visibility;
      }
    }
    const response: SuccessResponseUnit = ok({});
    return HttpResponse.json(response, { status: 200 });
  },
);

const getConcernHandler = http.get('*/api/v1/admin/concerns/:concernId', ({ params }) => {
  const concern = concerns.find((entry) => entry.id === Number(params.concernId));
  if (!concern) {
    return HttpResponse.json(notFound('고민글을 찾을 수 없습니다.'), { status: 404 });
  }
  return HttpResponse.json(ok(concern), { status: 200 });
});

export const concernHandlers: HttpHandler[] = [
  listConcernsHandler,
  changeConcernVisibilitiesHandler,
  getConcernHandler,
];
