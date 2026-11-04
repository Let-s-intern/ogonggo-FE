import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdminCompanyContentPriorityResponse } from '../fixtures/company-priority-types';
import { ok } from './paging';

/**
 * 기업회원 공고 우선 노출 설정 핸들러.
 *
 * 백엔드 `GET`·`PUT /api/v1/admin/company-content-priority`(LC-3568, 아직 배포 전)를 흉내 낸다.
 * 설정 행이 없으면 켜짐이라 기본값은 `enabled: true` 다. `PUT` 은 `enabled` 가 빠졌거나 `null` 이거나
 * 참·거짓이 아니면 400 `BAD_REQUEST`, 맞으면 저장한 값을 `data` 로 돌려준다.
 *
 * 쓰기가 일어나는 핸들러다. 값은 모듈 안에 있어 목을 다시 띄우면 켜짐으로 돌아간다.
 */

let current: AdminCompanyContentPriorityResponse = { enabled: true };

const PATH = '*/api/v1/admin/company-content-priority';

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

const getPriorityHandler = http.get(PATH, () => HttpResponse.json(ok(current), { status: 200 }));

const replacePriorityHandler = http.put(PATH, async ({ request }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (body === null || typeof body !== 'object' || typeof body.enabled !== 'boolean') {
    return badRequest('enabled: 참·거짓 값을 보내 주세요.');
  }

  current = { enabled: body.enabled };
  return HttpResponse.json(ok(current), { status: 200 });
});

export const companyPriorityHandlers: HttpHandler[] = [getPriorityHandler, replacePriorityHandler];
