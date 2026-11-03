import type { AdPlacementKey } from '@/entities/advertisement';

export const HEADLINE_MAX = 40;
export const TAG_MAX = 5;

/** 해석 한 줄을 쓰는 자리(A1 · A4 와 교육 쪽 같은 자리). 목 API 의 `HEADLINE_PLACEMENTS` 와 같다. */
export const HEADLINE_PLACEMENTS: readonly AdPlacementKey[] = [
  'RECOMMEND_TOP_RECRUIT',
  'SIMILAR_TOP_RECRUIT',
  'SIMILAR_TOP_EDU',
];

/** 해석 한 줄 금지 표현(시안 `BANNED`): `취업추천` · `취업지원`, 전화번호, `@`. 경고만 하고 저장은 막지 않는다. */
export const BANNED_HEADLINE = /취업\s*추천|취업\s*지원|\d{2,3}-\d{3,4}-\d{4}|@/;
