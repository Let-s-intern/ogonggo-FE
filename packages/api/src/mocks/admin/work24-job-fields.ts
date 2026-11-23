import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdminWork24JobFieldResponse } from '../../generated/admin/models';
import { ok } from './paging';

/**
 * 고용24 수집 직군 핸들러.
 *
 * 백엔드 `AdminWork24JobFieldApi` 를 흉내 낸다. 직군 전체를 직군 순서대로 주고, 바꾼 적이 없는 직군은 이 설정이
 * 생기기 전에 받던 다섯 직군(IT·개발, 기획·전략, 마케팅·광고, 영업, HR·총무)만 켜짐이다. `PUT` 은 없는 직군이거나
 * `enabled` 가 참·거짓이 아니면 400 `BAD_REQUEST`, 맞으면 메모리의 값을 바꾸고 바뀐 값을 돌려준다.
 *
 * 쓰기가 일어나는 핸들러다. 값은 모듈 안에 있어 목을 다시 띄우면 기본값으로 돌아간다.
 */

type Item = AdminWork24JobFieldResponse;

const DEFAULT_ENABLED = [
  'IT_DEVELOPMENT',
  'PLANNING_STRATEGY',
  'MARKETING_ADVERTISING',
  'SALES',
  'HR_GENERAL_AFFAIRS',
];
/** 백엔드 `JobField` 순서(직군 순서)와 같다. */
const ALL_FIELDS = [
  'IT_DEVELOPMENT',
  'GAME',
  'PLANNING_STRATEGY',
  'MARKETING_ADVERTISING',
  'SALES',
  'TRADE_LOGISTICS',
  'TRANSPORT_DELIVERY',
  'LEGAL',
  'HR_GENERAL_AFFAIRS',
  'SECURITIES_ASSET_MANAGEMENT',
  'BANKING_CARD_INSURANCE',
  'ENGINEERING_RND',
  'CONSTRUCTION_ARCHITECTURE',
  'PRODUCTION_SKILLED_TRADES',
  'MEDICAL_HEALTH',
  'PUBLIC_WELFARE',
  'EDUCATION',
  'SERVICE',
  'FOOD_BEVERAGE',
];

const current: Item[] = ALL_FIELDS.map((jobField) => ({
  jobField: jobField as Item['jobField'],
  enabled: DEFAULT_ENABLED.includes(jobField),
}));

const getHandler = http.get('*/api/v1/admin/work24-job-fields', () =>
  HttpResponse.json(ok(current), { status: 200 }),
);

const replaceHandler = http.put(
  '*/api/v1/admin/work24-job-fields/:jobField',
  async ({ params, request }) => {
    const item = current.find((candidate) => candidate.jobField === params.jobField);
    const body = (await request.json().catch(() => null)) as { enabled?: unknown } | null;
    if (!item || typeof body?.enabled !== 'boolean') {
      return HttpResponse.json(
        {
          status: 400,
          code: 'BAD_REQUEST',
          message: '없는 직군이거나 enabled가 올바르지 않습니다.',
        },
        { status: 400 },
      );
    }
    item.enabled = body.enabled;
    return HttpResponse.json(ok(item), { status: 200 });
  },
);

export const work24JobFieldHandlers: HttpHandler[] = [getHandler, replaceHandler];
