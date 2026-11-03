import { http, HttpResponse, type HttpHandler } from 'msw';
import { localDateTime } from '../fixtures/admin-notice';
import type { AdApplication, AdCreative } from '../fixtures/advertisement-types';
import { applications } from './advertisements';
import { notFound, ok } from './paging';

/**
 * 광고 신청 상세와 소재 업로드·소재 반려(PRD `어드민 > 구좌 세팅` 의 "소재 업로드와 반려 사유 입력").
 *
 * Push 1 의 목(`./advertisements.ts`)은 목록·상태 변경·확정까지다(요청서 5절 6). 그 저장소를 같이 써서 여기서 바꾼
 * 소재와 반려가 목록·확정에도 그대로 보인다. 경로는 가칭이고 요청서 `백엔드-요청-광고-시스템-admin.md` 2절에 적었다.
 */

/** 소재 업로드. 오공고가 만든 소재를 올리면 광고주 확인을 다시 기다린다. */
export interface UploadAdminAdCreativeRequest {
  /** 배너 구좌만. */
  bannerImageUrlPc?: string;
  bannerImageUrlMo?: string;
  /** 해석 한 줄. 40자 이하. */
  headline?: string;
}

/** 소재 반려. 신청도 지금 단계에서 반려된다. */
export interface RejectAdminAdCreativeRequest {
  reason: string;
}

const HEADLINE_MAX = 40;

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

function notReviewing() {
  return HttpResponse.json(
    {
      status: 409,
      code: 'AD_NOT_REVIEWING',
      message: '검수 단계의 신청만 소재를 바꿀 수 있습니다.',
    },
    { status: 409 },
  );
}

const applicationNotFound = () =>
  HttpResponse.json(notFound('광고 신청을 찾을 수 없습니다.'), { status: 404 });

const creativeNotFound = () =>
  HttpResponse.json(notFound('소재를 찾을 수 없습니다.'), { status: 404 });

function findCreative(params: Record<string, unknown>): {
  application?: AdApplication;
  creative?: AdCreative;
} {
  const application = applications.get(Number(params.advertisementId));
  const creative = application?.items.find(
    (item) => item.creative.id === Number(params.creativeId),
  )?.creative;
  return { application, creative };
}

const getApplicationHandler = http.get(
  '*/api/v1/admin/advertisements/:advertisementId',
  ({ params }) => {
    const application = applications.get(Number(params.advertisementId));
    return application ? HttpResponse.json(ok(application)) : applicationNotFound();
  },
);

/**
 * 소재 업로드. 보낸 칸만 바꾸고 광고주 확인을 `PENDING` 으로 되돌린다. 그 소재의 반려 사유와 수정 요청은 지운다 —
 * 고친 소재를 다시 올린 것이기 때문이다. 신청의 반려(`rejection`)는 운영자가 상태 변경으로 따로 푼다.
 */
const uploadCreativeHandler = http.put(
  '*/api/v1/admin/advertisements/:advertisementId/creatives/:creativeId',
  async ({ params, request }) => {
    const { application, creative } = findCreative(params);
    if (!application) {
      return applicationNotFound();
    }
    if (!creative) {
      return creativeNotFound();
    }
    if (application.status !== 'REVIEWING') {
      return notReviewing();
    }
    const body = (await request.json().catch(() => null)) as UploadAdminAdCreativeRequest | null;
    if (!body || typeof body !== 'object') {
      return badRequest('요청 본문이 올바르지 않습니다.');
    }
    const headline = body.headline?.trim();
    if (headline !== undefined && headline.length > HEADLINE_MAX) {
      return badRequest(`headline: ${HEADLINE_MAX}자 이하여야 합니다.`);
    }
    const pc = body.bannerImageUrlPc?.trim();
    const mo = body.bannerImageUrlMo?.trim();
    if (pc === undefined && mo === undefined && headline === undefined) {
      return badRequest('올릴 소재가 없습니다.');
    }
    if (pc !== undefined) {
      creative.bannerImageUrlPc = pc || undefined;
    }
    if (mo !== undefined) {
      creative.bannerImageUrlMo = mo || undefined;
    }
    if (headline !== undefined) {
      creative.headline = headline || undefined;
    }
    const at = localDateTime(new Date());
    creative.confirmStatus = 'PENDING';
    creative.rejectionReason = undefined;
    creative.revisionRequest = undefined;
    creative.uploadedAt = at;
    application.history.push({ at, message: '오공고 소재 업로드 · 확인 요청' });
    return HttpResponse.json(ok(application));
  },
);

/**
 * 소재 반려. 그 소재에 사유를 남기고 신청을 지금 단계에서 반려한다. 이미 반려된 신청이면 사유를 ` · ` 로 이어 붙인다
 * (시안 예: `배너 이미지 규격 불일치 · 근무 조건(급여) 미기재`).
 */
const rejectCreativeHandler = http.post(
  '*/api/v1/admin/advertisements/:advertisementId/creatives/:creativeId/reject',
  async ({ params, request }) => {
    const { application, creative } = findCreative(params);
    if (!application) {
      return applicationNotFound();
    }
    if (!creative) {
      return creativeNotFound();
    }
    if (application.status !== 'REVIEWING') {
      return notReviewing();
    }
    const body = (await request.json().catch(() => null)) as RejectAdminAdCreativeRequest | null;
    const reason = body?.reason?.trim();
    if (!reason) {
      return badRequest('reason: 반려 사유를 입력해 주세요.');
    }
    const at = localDateTime(new Date());
    creative.rejectionReason = reason;
    const previous = application.rejection?.reason;
    application.rejection = {
      status: application.status,
      reason: !previous ? reason : previous.includes(reason) ? previous : `${previous} · ${reason}`,
      rejectedAt: at,
    };
    application.history.push({ at, message: `검수 반려 · ${reason}` });
    return HttpResponse.json(ok(application));
  },
);

export const advertisementDetailHandlers: HttpHandler[] = [
  getApplicationHandler,
  uploadCreativeHandler,
  rejectCreativeHandler,
];
