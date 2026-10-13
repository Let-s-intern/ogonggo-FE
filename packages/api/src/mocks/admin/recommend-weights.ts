import { http, HttpResponse, type HttpHandler } from 'msw';
import type { AdminLetsCareerContentRecommendWeightsResponse } from '../../generated/admin/models';
import { ok } from './paging';

/**
 * 렛츠커리어 콘텐츠 추천 점수 핸들러.
 *
 * 배포된 어드민 스펙(`/api/v1/admin/lets-career-content-recommend-weights`)을 그대로 흉내 낸다.
 * 백엔드 `LetsCareerContentRecommendWeights` 의 기본값에서 시작하고, `PUT` 은 여덟 칸이 모두
 * 있고 정수이며 범위 안인지 본다(`ReplaceAdminLetsCareerContentRecommendWeightsRequest`).
 * 아니면 400 `BAD_REQUEST`, 맞으면 메모리의 값을 통째로 바꾸고 바뀐 값을 돌려준다.
 *
 * 쓰기가 일어나는 핸들러다. 값은 모듈 안에 있어 목을 다시 띄우면 기본값으로 돌아간다.
 */

type Weights = AdminLetsCareerContentRecommendWeightsResponse;

/** 백엔드 `LetsCareerContentRecommendWeights.DEFAULT`. */
const DEFAULT_WEIGHTS: Weights = {
  roleScore: 5,
  fieldScore: 3,
  topicScore: 2,
  maxTopicMatches: 2,
  programBonus: 2,
  materialBonus: 1,
  blogBonus: 0,
  maxPerGroup: 2,
};

/** 칸별 허용 범위. 백엔드 `@Min`·`@Max` 와 같다. */
const RANGES: Record<keyof Weights, { min: number; max: number }> = {
  roleScore: { min: 0, max: 100 },
  fieldScore: { min: 0, max: 100 },
  topicScore: { min: 0, max: 100 },
  maxTopicMatches: { min: 0, max: 10 },
  programBonus: { min: 0, max: 100 },
  materialBonus: { min: 0, max: 100 },
  blogBonus: { min: 0, max: 100 },
  maxPerGroup: { min: 1, max: 10 },
};

let current: Weights = { ...DEFAULT_WEIGHTS };

function badRequest(message: string) {
  return HttpResponse.json({ status: 400, code: 'BAD_REQUEST', message }, { status: 400 });
}

const getWeightsHandler = http.get('*/api/v1/admin/lets-career-content-recommend-weights', () =>
  HttpResponse.json(ok(current), { status: 200 }),
);

/** 칸이 빠졌거나 정수가 아니거나 범위를 벗어난 첫 칸의 문구. 모두 맞으면 `null`. */
function findInvalid(body: Record<string, unknown>): string | null {
  for (const key of Object.keys(RANGES) as (keyof Weights)[]) {
    const value = body[key];
    const { min, max } = RANGES[key];
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return `${key}: 정수를 입력해 주세요.`;
    }
    if (value < min || value > max) {
      return `${key}: ${min} 이상 ${max} 이하여야 합니다.`;
    }
  }
  return null;
}

const replaceWeightsHandler = http.put(
  '*/api/v1/admin/lets-career-content-recommend-weights',
  async ({ request }) => {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (body === null || typeof body !== 'object') {
      return badRequest('요청 본문이 올바르지 않습니다.');
    }

    const invalid = findInvalid(body);
    if (invalid !== null) {
      return badRequest(invalid);
    }

    current = {
      roleScore: body.roleScore as number,
      fieldScore: body.fieldScore as number,
      topicScore: body.topicScore as number,
      maxTopicMatches: body.maxTopicMatches as number,
      programBonus: body.programBonus as number,
      materialBonus: body.materialBonus as number,
      blogBonus: body.blogBonus as number,
      maxPerGroup: body.maxPerGroup as number,
    };
    return HttpResponse.json(ok(current), { status: 200 });
  },
);

export const recommendWeightsHandlers: HttpHandler[] = [getWeightsHandler, replaceWeightsHandler];
