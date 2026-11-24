import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdminFeatureFlagResponse } from '../../generated/admin/models';
import { ok } from './paging';

/**
 * 기능 플래그 핸들러.
 *
 * 백엔드 `AdminFeatureFlagApi` 를 흉내 낸다. 목록은 key 순이고 설명·마지막 변경 일시·변경자를 함께 준다. 플래그를 만드는
 * API 는 없다. `PATCH` 는 없는 key 면 404, `enabled` 가 참·거짓이 아니면 400, 맞으면 메모리의 값을 바꾸고 변경자와 일시를
 * 갱신한 뒤 `data` 가 null 인 성공을 돌려준다(바뀐 값은 목록을 다시 읽어 확인한다).
 *
 * 쓰기가 일어나는 핸들러다. 값은 모듈 안에 있어 목을 다시 띄우면 기본값으로 돌아간다. 화면에서 `PATCH` 실패를 보려면
 * 브라우저 콘솔에서 `localStorage.setItem('ogonggo-mock:feature-flags:fail-patch', '1')` 을 하면 `PATCH` 가 500 을 준다.
 * 지우면 다시 성공한다.
 */

const FAIL_PATCH_KEY = 'ogonggo-mock:feature-flags:fail-patch';
/** 목에서 변경자로 남기는 관리자 회원 식별자. */
const MOCK_ADMIN_ID = 1;

const current: AdminFeatureFlagResponse[] = [
  {
    key: 'ad_report_cost_efficiency',
    enabled: true,
    description: '비즈니스 광고 리포트의 05 비용 효율 섹션과 지표 정의의 비용 효율 줄을 보인다',
    updatedAt: '2026-11-24T17:20:00',
  },
];

const shouldFail = () => {
  try {
    return globalThis.localStorage?.getItem(FAIL_PATCH_KEY) === '1';
  } catch {
    return false;
  }
};

const listHandler = http.get('*/api/v1/admin/feature-flags', () =>
  HttpResponse.json(ok({ items: [...current].sort((a, b) => a.key.localeCompare(b.key)) }), {
    status: 200,
  }),
);

const updateHandler = http.patch(
  '*/api/v1/admin/feature-flags/:key',
  async ({ params, request }) => {
    if (shouldFail()) {
      return HttpResponse.json(
        { status: 500, code: 'INTERNAL_SERVER_ERROR', message: '서버 오류' },
        { status: 500 },
      );
    }
    const item = current.find((candidate) => candidate.key === params.key);
    if (!item) {
      return HttpResponse.json(
        { status: 404, code: 'NOT_FOUND', message: '없는 기능 플래그입니다.' },
        { status: 404 },
      );
    }
    const body = (await request.json().catch(() => null)) as { enabled?: unknown } | null;
    if (typeof body?.enabled !== 'boolean') {
      return HttpResponse.json(
        { status: 400, code: 'BAD_REQUEST', message: 'enabled가 올바르지 않습니다.' },
        { status: 400 },
      );
    }
    item.enabled = body.enabled;
    item.updatedBy = MOCK_ADMIN_ID;
    item.updatedAt = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 19);
    return HttpResponse.json(ok(null), { status: 200 });
  },
);

/** 어드민 리포트 모달이 읽는 현재 켜짐 여부도 이 목록이다. */
export const featureFlagHandlers: HttpHandler[] = [listHandler, updateHandler];
