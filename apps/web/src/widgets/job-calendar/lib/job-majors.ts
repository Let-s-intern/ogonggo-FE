import type { ListPublicJobCalendarJobField } from '@ogonggo/api';
import { JOB_ROLE_CHIPS } from '@/widgets/job-list/lib/roleChips';

/**
 * `관심 직무를 골라주세요`의 칸(`docs/asset/v6 공고달력/관심직무 선택.png`). 채용공고 목록의 직무
 * 필터와 같은 직군 다섯만, 같은 차례로 둔다(`widgets/job-list/lib/roleChips.ts`, 2026-10-20, 사용자).
 * 목업의 나머지 칸은 뺐다.
 *
 * `slug`는 URL 에 두는 값이다(`?majors=it,planning`). 이름에 `·`와 `&`가 있어 그대로 쿼리에
 * 두면 인코딩된 긴 문자열이 된다.
 *
 * `field`는 백엔드에 보내는 직군 enum 이다(ogonggo-BE LC-3385). 이름은 그 enum 의 라벨에서 온다.
 *
 * 아이콘은 Iconify(lucide) 클래스이고 문자열 그대로 적어야 한다 — 플러그인이 소스의 이
 * 문자열을 스캔해서 그린다(`packages/ui/src/styles/tokens.css`). 목업의 그림과 모양이 가장
 * 가까운 것을 골랐다.
 */
const MAJORS = [
  { slug: 'it', field: 'IT_DEVELOPMENT', icon: 'icon-[lucide--laptop]' },
  {
    slug: 'planning',
    field: 'PLANNING_STRATEGY',
    icon: 'icon-[lucide--lightbulb]',
  },
  {
    slug: 'marketing',
    field: 'MARKETING_ADVERTISING',
    icon: 'icon-[lucide--megaphone]',
  },
  { slug: 'sales', field: 'SALES', icon: 'icon-[lucide--briefcase-business]' },
  { slug: 'hr', field: 'HR_GENERAL_AFFAIRS', icon: 'icon-[lucide--contact]' },
] as const satisfies readonly {
  slug: string;
  field: ListPublicJobCalendarJobField;
  icon: string;
}[];

/** 차례와 칸 이름은 목록의 직무 칩(`JOB_ROLE_CHIPS`)을 따른다. 이름은 직군 라벨 그대로다. */
export const JOB_MAJORS = JOB_ROLE_CHIPS.flatMap(({ field, label }) =>
  MAJORS.filter((major) => major.field === field).map((major) => ({ ...major, label })),
);

/**
 * 전부 고른 것을 주소·쿠키에 적는 값(`?majors=all`). slug 를 다 늘어놓지 않는다.
 *
 * 전에는 최대 3개였다(목업의 `* 최대 3개 선택 가능`). 백엔드 `jobField` 가 값 하나만 받아 직무마다
 * 요청을 나눠 보냈기 때문인데, 이제 여럿이면 한 번에 받아 거르므로(`ui/JobCalendarView.tsx`) 수를
 * 막을 이유가 없다.
 */
export const ALL_JOB_MAJORS_PARAM = 'all';

/** 칸 차례대로 늘어놓은 모든 slug. */
export const ALL_JOB_MAJOR_SLUGS: readonly string[] = JOB_MAJORS.map((major) => major.slug);

/** 고른 직무를 주소·쿠키에 적는 모양. 목록 순서로 맞추고, 전부면 `all` 이다. */
export function serializeJobMajors(slugs: readonly string[]): string {
  const ordered = ALL_JOB_MAJOR_SLUGS.filter((slug) => slugs.includes(slug));
  return ordered.length === ALL_JOB_MAJOR_SLUGS.length ? ALL_JOB_MAJORS_PARAM : ordered.join(',');
}

const FIELD_BY_SLUG = new Map<string, ListPublicJobCalendarJobField>(
  JOB_MAJORS.map((major) => [major.slug, major.field]),
);

/** 없어진 직군 칸의 옛 slug 와 그 직군이 합쳐 들어간 칸. 옛 주소·쿠키를 버리지 않고 바꿔 읽는다. */
const MERGED_SLUGS: Readonly<Record<string, string>> = {
  ai: 'it',
  design: 'planning',
  md: 'planning',
  finance: 'hr',
  cs: 'hr',
  media: 'marketing',
};

/**
 * 주소·쿠키의 slug 를 지금 칸으로 읽는다. 옛 slug 는 옮긴 칸, 모르는 값은 `undefined`.
 * 목록 필터에 맞춰 뺀 칸(`game`·`trade` 등)도 모르는 값이라 버려진다.
 */
export function toJobMajorSlug(value: string): string | undefined {
  if (FIELD_BY_SLUG.has(value)) {
    return value;
  }
  return Object.hasOwn(MERGED_SLUGS, value) ? MERGED_SLUGS[value] : undefined;
}

/** `slug` 의 직군 enum. 모르는 값이면 `undefined` 다. */
export function jobMajorField(slug: string): ListPublicJobCalendarJobField | undefined {
  return FIELD_BY_SLUG.get(slug);
}
