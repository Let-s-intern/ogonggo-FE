import type { ListPublicJobCalendarJobField } from '@ogonggo/api';
import { JOB_FIELD_LABELS } from '@/entities/job/model/labels';

/**
 * `관심 직무를 골라주세요`의 칸(`docs/asset/v6 공고달력/관심직무 선택.png`). 순서는 목업의
 * 5x5 배치 그대로이고, 백엔드가 직군 여섯 개를 합친 뒤(ogonggo-BE #86) 그 칸을 빼 19칸이다.
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
  { slug: 'game', field: 'GAME', icon: 'icon-[lucide--gamepad-2]' },
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
  { slug: 'trade', field: 'TRADE_LOGISTICS', icon: 'icon-[lucide--package]' },
  {
    slug: 'delivery',
    field: 'TRANSPORT_DELIVERY',
    icon: 'icon-[lucide--truck]',
  },
  { slug: 'legal', field: 'LEGAL', icon: 'icon-[lucide--gavel]' },
  { slug: 'hr', field: 'HR_GENERAL_AFFAIRS', icon: 'icon-[lucide--contact]' },
  {
    slug: 'securities',
    field: 'SECURITIES_ASSET_MANAGEMENT',
    icon: 'icon-[lucide--chart-no-axes-combined]',
  },
  {
    slug: 'banking',
    field: 'BANKING_CARD_INSURANCE',
    icon: 'icon-[lucide--landmark]',
  },
  {
    slug: 'engineering',
    field: 'ENGINEERING_RND',
    icon: 'icon-[lucide--wrench]',
  },
  {
    slug: 'construction',
    field: 'CONSTRUCTION_ARCHITECTURE',
    icon: 'icon-[lucide--traffic-cone]',
  },
  {
    slug: 'production',
    field: 'PRODUCTION_SKILLED_TRADES',
    icon: 'icon-[lucide--factory]',
  },
  {
    slug: 'medical',
    field: 'MEDICAL_HEALTH',
    icon: 'icon-[lucide--stethoscope]',
  },
  {
    slug: 'public',
    field: 'PUBLIC_WELFARE',
    icon: 'icon-[lucide--heart-handshake]',
  },
  { slug: 'education', field: 'EDUCATION', icon: 'icon-[lucide--graduation-cap]' },
  { slug: 'service', field: 'SERVICE', icon: 'icon-[lucide--handshake]' },
  { slug: 'food', field: 'FOOD_BEVERAGE', icon: 'icon-[lucide--utensils]' },
] as const satisfies readonly {
  slug: string;
  field: ListPublicJobCalendarJobField;
  icon: string;
}[];

/** 칸 이름은 직군 라벨(enum 카탈로그의 `JobField`) 그대로다. */
export const JOB_MAJORS = MAJORS.map((major) => ({
  ...major,
  label: JOB_FIELD_LABELS[major.field],
}));

/**
 * 전부 고른 것을 주소·쿠키에 적는 값(`?majors=all`). slug 를 다 늘어놓지 않는다.
 *
 * 전에는 최대 3개였다(목업의 `* 최대 3개 선택 가능`). 백엔드 `jobField` 가 값 하나만 받아 직무마다
 * 요청을 나눠 보냈기 때문인데, 이제 여럿이면 한 번에 받아 거르므로(`ui/JobCalendarView.tsx`) 수를
 * 막을 이유가 없다.
 */
export const ALL_JOB_MAJORS_PARAM = 'all';

/** 목업 순서대로 늘어놓은 모든 slug. */
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

/** 주소·쿠키의 slug 를 지금 칸으로 읽는다. 옛 slug 는 옮긴 칸, 모르는 값은 `undefined`. */
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
