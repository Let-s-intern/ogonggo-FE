import type { ListPublicJobCalendarJobField } from '@ogonggo/api';

/**
 * `관심 직무를 골라주세요`의 25개 칸(`docs/asset/v6 공고달력/관심직무 선택.png`). 순서는 목업의
 * 5x5 배치 그대로다.
 *
 * `slug`는 URL 에 두는 값이다(`?majors=it,design`). 이름에 `·`와 `&`가 있어 그대로 쿼리에
 * 두면 인코딩된 긴 문자열이 된다.
 *
 * `field`는 백엔드에 보내는 직군 enum 이다(ogonggo-BE LC-3385). 이름이 그 enum 의 라벨과
 * 글자까지 같다.
 *
 * 아이콘은 Iconify(lucide) 클래스이고 문자열 그대로 적어야 한다 — 플러그인이 소스의 이
 * 문자열을 스캔해서 그린다(`packages/ui/src/styles/tokens.css`). 목업의 그림과 모양이 가장
 * 가까운 것을 골랐다.
 */
export const JOB_MAJORS = [
  { slug: 'it', label: 'IT·개발', field: 'IT_DEVELOPMENT', icon: 'icon-[lucide--laptop]' },
  { slug: 'ai', label: 'AI·데이터', field: 'AI_DATA', icon: 'icon-[lucide--sparkles]' },
  { slug: 'game', label: '게임', field: 'GAME', icon: 'icon-[lucide--gamepad-2]' },
  { slug: 'design', label: '디자인', field: 'DESIGN', icon: 'icon-[lucide--palette]' },
  {
    slug: 'planning',
    label: '기획·전략',
    field: 'PLANNING_STRATEGY',
    icon: 'icon-[lucide--lightbulb]',
  },
  {
    slug: 'marketing',
    label: '마케팅·광고',
    field: 'MARKETING_ADVERTISING',
    icon: 'icon-[lucide--megaphone]',
  },
  { slug: 'md', label: '상품기획·MD', field: 'MERCHANDISING', icon: 'icon-[lucide--tag]' },
  { slug: 'sales', label: '영업', field: 'SALES', icon: 'icon-[lucide--briefcase-business]' },
  { slug: 'trade', label: '무역·물류', field: 'TRADE_LOGISTICS', icon: 'icon-[lucide--package]' },
  {
    slug: 'delivery',
    label: '운송·배송',
    field: 'TRANSPORT_DELIVERY',
    icon: 'icon-[lucide--truck]',
  },
  { slug: 'legal', label: '법률·법무', field: 'LEGAL', icon: 'icon-[lucide--gavel]' },
  { slug: 'hr', label: 'HR·총무', field: 'HR_GENERAL_AFFAIRS', icon: 'icon-[lucide--contact]' },
  {
    slug: 'finance',
    label: '회계·세무·재무',
    field: 'ACCOUNTING_TAX_FINANCE',
    icon: 'icon-[lucide--calculator]',
  },
  {
    slug: 'securities',
    label: '증권·운용',
    field: 'SECURITIES_ASSET_MANAGEMENT',
    icon: 'icon-[lucide--chart-no-axes-combined]',
  },
  {
    slug: 'banking',
    label: '은행·카드·보험',
    field: 'BANKING_CARD_INSURANCE',
    icon: 'icon-[lucide--landmark]',
  },
  {
    slug: 'engineering',
    label: '엔지니어링·R&D',
    field: 'ENGINEERING_RND',
    icon: 'icon-[lucide--wrench]',
  },
  {
    slug: 'construction',
    label: '건설·건축',
    field: 'CONSTRUCTION_ARCHITECTURE',
    icon: 'icon-[lucide--traffic-cone]',
  },
  {
    slug: 'production',
    label: '생산·기능직',
    field: 'PRODUCTION_SKILLED_TRADES',
    icon: 'icon-[lucide--factory]',
  },
  {
    slug: 'medical',
    label: '의료·보건',
    field: 'MEDICAL_HEALTH',
    icon: 'icon-[lucide--stethoscope]',
  },
  {
    slug: 'public',
    label: '공공·복지',
    field: 'PUBLIC_WELFARE',
    icon: 'icon-[lucide--heart-handshake]',
  },
  { slug: 'education', label: '교육', field: 'EDUCATION', icon: 'icon-[lucide--graduation-cap]' },
  {
    slug: 'media',
    label: '미디어·엔터',
    field: 'MEDIA_ENTERTAINMENT',
    icon: 'icon-[lucide--clapperboard]',
  },
  {
    slug: 'cs',
    label: '고객상담·TM',
    field: 'CUSTOMER_SERVICE_TM',
    icon: 'icon-[lucide--headset]',
  },
  { slug: 'service', label: '서비스', field: 'SERVICE', icon: 'icon-[lucide--handshake]' },
  { slug: 'food', label: '식음료', field: 'FOOD_BEVERAGE', icon: 'icon-[lucide--utensils]' },
] as const satisfies readonly {
  slug: string;
  label: string;
  field: ListPublicJobCalendarJobField;
  icon: string;
}[];

/**
 * 전부 고른 것을 주소·쿠키에 적는 값(`?majors=all`). 25개 slug 를 다 늘어놓지 않는다.
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

export function isJobMajorSlug(value: string): boolean {
  return FIELD_BY_SLUG.has(value);
}

/** `slug` 의 직군 enum. 모르는 값이면 `undefined` 다. */
export function jobMajorField(slug: string): ListPublicJobCalendarJobField | undefined {
  return FIELD_BY_SLUG.get(slug);
}
