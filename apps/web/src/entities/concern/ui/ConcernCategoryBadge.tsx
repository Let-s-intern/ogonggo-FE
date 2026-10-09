import { Badge } from '@ogonggo/ui';
import { CONCERN_CATEGORY_LABELS } from '../model/labels';
import type { ConcernCategory } from '../model/types';

export interface ConcernCategoryBadgeProps {
  category: ConcernCategory;
}

/** 시안의 `질문 유형` 배지 — 연한 파랑 바탕에 파란 글자. 목록 행·인기 카드·상세 헤더가 함께 쓴다. */
export function ConcernCategoryBadge({ category }: ConcernCategoryBadgeProps) {
  return (
    <Badge tone="main" className="shrink-0 px-2 py-0.5 text-xs font-medium whitespace-nowrap">
      {CONCERN_CATEGORY_LABELS[category]}
    </Badge>
  );
}
