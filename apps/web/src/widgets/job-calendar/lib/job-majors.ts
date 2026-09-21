/**
 * `관심 직무를 골라주세요`의 25개 칸(`docs/asset/v6 공고달력/관심직무 선택.png`). 순서는 목업의
 * 5x5 배치 그대로다.
 *
 * `slug`는 URL 에 두는 값이다(`?majors=it,design`). 이름에 `·`와 `&`가 있어 그대로 쿼리에
 * 두면 인코딩된 긴 문자열이 된다.
 *
 * 아이콘은 Iconify(lucide) 클래스이고 문자열 그대로 적어야 한다 — 플러그인이 소스의 이
 * 문자열을 스캔해서 그린다(`packages/ui/src/styles/tokens.css`). 목업의 그림과 모양이 가장
 * 가까운 것을 골랐다.
 */
export const JOB_MAJORS = [
  { slug: 'it', label: 'IT·개발', icon: 'icon-[lucide--laptop]' },
  { slug: 'ai', label: 'AI·데이터', icon: 'icon-[lucide--sparkles]' },
  { slug: 'game', label: '게임', icon: 'icon-[lucide--gamepad-2]' },
  { slug: 'design', label: '디자인', icon: 'icon-[lucide--palette]' },
  { slug: 'planning', label: '기획·전략', icon: 'icon-[lucide--lightbulb]' },
  { slug: 'marketing', label: '마케팅·광고', icon: 'icon-[lucide--megaphone]' },
  { slug: 'md', label: '상품기획·MD', icon: 'icon-[lucide--tag]' },
  { slug: 'sales', label: '영업', icon: 'icon-[lucide--briefcase-business]' },
  { slug: 'trade', label: '무역·물류', icon: 'icon-[lucide--package]' },
  { slug: 'delivery', label: '운송·배송', icon: 'icon-[lucide--truck]' },
  { slug: 'legal', label: '법률·법무', icon: 'icon-[lucide--gavel]' },
  { slug: 'hr', label: 'HR·총무', icon: 'icon-[lucide--contact]' },
  { slug: 'finance', label: '회계·세무·재무', icon: 'icon-[lucide--calculator]' },
  { slug: 'securities', label: '증권·운용', icon: 'icon-[lucide--chart-no-axes-combined]' },
  { slug: 'banking', label: '은행·카드·보험', icon: 'icon-[lucide--landmark]' },
  { slug: 'engineering', label: '엔지니어링·R&D', icon: 'icon-[lucide--wrench]' },
  { slug: 'construction', label: '건설·건축', icon: 'icon-[lucide--traffic-cone]' },
  { slug: 'production', label: '생산·기능직', icon: 'icon-[lucide--factory]' },
  { slug: 'medical', label: '의료·보건', icon: 'icon-[lucide--stethoscope]' },
  { slug: 'public', label: '공공·복지', icon: 'icon-[lucide--heart-handshake]' },
  { slug: 'education', label: '교육', icon: 'icon-[lucide--graduation-cap]' },
  { slug: 'media', label: '미디어·엔터', icon: 'icon-[lucide--clapperboard]' },
  { slug: 'cs', label: '고객상담·TM', icon: 'icon-[lucide--headset]' },
  { slug: 'service', label: '서비스', icon: 'icon-[lucide--handshake]' },
  { slug: 'food', label: '식음료', icon: 'icon-[lucide--utensils]' },
] as const;

/** 한 번에 고를 수 있는 수. 목업의 `* 최대 3개 선택 가능`. */
export const MAX_JOB_MAJORS = 3;

const LABEL_BY_SLUG = new Map<string, string>(JOB_MAJORS.map((major) => [major.slug, major.label]));

export function isJobMajorSlug(value: string): boolean {
  return LABEL_BY_SLUG.has(value);
}

/** `slug` 의 직무 이름. 모르는 값이면 `undefined` 다. */
export function jobMajorLabel(slug: string): string | undefined {
  return LABEL_BY_SLUG.get(slug);
}
