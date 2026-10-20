import type { JobListQuery } from './query';
import {
  parseEmploymentTypes,
  parseExperienceTypes,
  parseJobRoleSelection,
  parseRegions,
} from './query';

/**
 * 마지막으로 건 목록 필터를 기억하는 쿠키. 채용 형태·요구 경력·지역·직군·직무 다섯 가지만 담는다 —
 * 검색어(`q`)·쪽(`page`)·정렬(`sort`)은 그때그때의 보기라 기억하지 않는다.
 *
 * 쿠키인 이유는 `widgets/job-calendar/lib/major-cookie.ts` 와 같다. `src/proxy.ts` 가 홈(`/`)을 렌더하기
 * 전에 읽어 바로 보내므로 필터 없는 목록이 번쩍이지 않고 공고 API 도 한 번만 부른다.
 *
 * 값은 주소 쿼리와 같은 모양이다(`employmentType=FULL_TIME&region=SEOUL`). 읽을 때도 주소와 **같은**
 * 파서로 거른다 — 손으로 고쳐 넣은 값이 그대로 API 파라미터가 되면 안 된다.
 */
export const JOB_FILTER_COOKIE_NAME = 'ogonggo.jobs.filters';

/** 이 다섯 이름만 쿠키에 싣는다. 주소의 나머지(`q`·`page`·`sort`)는 버린다. */
const FILTER_PARAM_NAMES = [
  'employmentType',
  'experienceType',
  'region',
  'jobField',
  'jobRole',
] as const;

/**
 * 필터는 며칠 안 보면 잊을 수 있다. 오래 남겨 두면 보이지 않는 사이에 공고를 가리는 쪽이 더 나쁘므로
 * 쓸 때마다 30일로 다시 건다.
 */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * 이동하려는 주소(`buildJobListHref` 의 결과)의 필터를 쿠키에 적는다. 필터가 하나도 없으면 쿠키를
 * 지운다 — 전체 해제가 다음 방문에 되살아나지 않게 한다.
 *
 * **브라우저에서만, `router.push` 보다 먼저 부른다.** 해제한 주소 `/` 는 필터 쿼리가 없어서 서버가
 * 쿠키로 복원하는데, 쿠키를 이동 뒤에 지우면 옛 필터로 되돌려 보낸다.
 */
export function rememberJobFilters(href: string): void {
  const source = new URLSearchParams(href.split('?')[1] ?? '');
  const kept = new URLSearchParams();
  for (const name of FILTER_PARAM_NAMES) {
    for (const value of source.getAll(name)) {
      kept.append(name, value);
    }
  }
  const value = kept.toString();
  // 값은 enum 이름(`A-Z_`)이라 인코딩에 걸릴 문자가 없다. `;`·공백·`,` 가 들어올 수 없다.
  document.cookie = [
    `${JOB_FILTER_COOKIE_NAME}=${value}`,
    'path=/',
    `max-age=${value ? MAX_AGE_SECONDS : 0}`,
    'samesite=lax',
  ].join('; ');
}

export type RememberedJobFilters = Pick<
  JobListQuery,
  'employmentTypes' | 'experienceTypes' | 'regions' | 'jobFields' | 'jobRoles'
>;

/** 쿠키 값을 주소와 같은 규칙으로 읽는다. 걸 필터가 하나도 없으면 `undefined`. */
export function parseRememberedJobFilters(
  cookieValue: string | undefined,
): RememberedJobFilters | undefined {
  if (!cookieValue) {
    return undefined;
  }
  const params = new URLSearchParams(cookieValue);
  const filters: RememberedJobFilters = {
    employmentTypes: parseEmploymentTypes(params.getAll('employmentType')),
    experienceTypes: parseExperienceTypes(params.getAll('experienceType')),
    regions: parseRegions(params.getAll('region')),
    ...parseJobRoleSelection(params.getAll('jobField'), params.getAll('jobRole')),
  };
  return Object.values(filters).some((value) => value !== undefined) ? filters : undefined;
}
