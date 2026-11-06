import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdminAdvertiserResponse, CreateAdminAdvertiserRequest } from '../../advertisers';
import { allAdvertisers, nonMemberAdvertiserStore, saveAdvertisers } from '../fixtures/advertisers';
import { ok } from './paging';

/**
 * 광고주 핸들러(이슈 #573). 계약은 `.claude/tasks/memos/백엔드-요청-광고-공고-2026-11-06.md` 의 "광고주".
 *
 * - `GET  /api/v1/admin/advertisers?keyword=` 비즈니스 회원·광고 문의 기업·직접 추가한 기업을 합친 목록. `keyword` 는
 *   이름·담당자 이름·메일 부분 일치(대소문자 무시). 페이지 없이 최대 50건
 * - `POST /api/v1/admin/advertisers`          비회원 광고주 추가. 같은 이름(공백·대소문자 무시)이 있으면 400
 */

const PATH = '*/api/v1/admin/advertisers';
const LIST_LIMIT = 50;
const NAME_MAX_LENGTH = 50;
const MEMO_MAX_LENGTH = 500;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

const normalize = (value: string) => value.replace(/\s+/g, '').toLowerCase();

const listHandler = http.get(PATH, ({ request }) => {
  const keyword = (new URL(request.url).searchParams.get('keyword') ?? '').trim().toLowerCase();
  const matches = allAdvertisers().filter(
    (advertiser) =>
      !keyword ||
      [advertiser.name, advertiser.contactName, advertiser.contactEmail].some((text) =>
        text?.toLowerCase().includes(keyword),
      ),
  );
  return HttpResponse.json(ok(matches.slice(0, LIST_LIMIT)), { status: 200 });
});

const createHandler = http.post(PATH, async ({ request }) => {
  const body = (await request
    .json()
    .catch(() => null)) as Partial<CreateAdminAdvertiserRequest> | null;
  if (body === null || typeof body !== 'object') {
    return badRequest('본문을 JSON 으로 보내 주세요.');
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length === 0 || name.length > NAME_MAX_LENGTH) {
    return badRequest(`name: 1~${NAME_MAX_LENGTH}자로 보내 주세요.`);
  }
  if (allAdvertisers().some((advertiser) => normalize(advertiser.name) === normalize(name))) {
    return badRequest('name: 같은 이름의 광고주가 이미 있습니다. 목록에서 골라 주세요.');
  }
  const contactEmail = body.contactEmail?.trim() || undefined;
  if (contactEmail && !EMAIL.test(contactEmail)) {
    return badRequest('contactEmail: 메일 주소 형식으로 보내 주세요.');
  }
  const memo = body.memo?.trim() || undefined;
  if (memo && memo.length > MEMO_MAX_LENGTH) {
    return badRequest(`memo: ${MEMO_MAX_LENGTH}자까지 보낼 수 있습니다.`);
  }
  const advertiser: AdminAdvertiserResponse = {
    id: Math.max(0, ...nonMemberAdvertiserStore.advertisers.map((item) => item.id)) + 1,
    name,
    type: 'NON_MEMBER',
    source: 'MANUAL',
    contactName: body.contactName?.trim() || undefined,
    contactEmail,
    contactPhone: body.contactPhone?.trim() || undefined,
    memo,
  };
  nonMemberAdvertiserStore.advertisers.push(advertiser);
  saveAdvertisers();
  return HttpResponse.json({ ...ok(advertiser), status: 201, message: 'Created' }, { status: 201 });
});

export const advertiserAdminHandlers: HttpHandler[] = [listHandler, createHandler];
