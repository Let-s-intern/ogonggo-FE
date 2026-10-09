import Link from 'next/link';
import type { ConcernSummary } from '../model/types';
import { ConcernCategoryBadge } from './ConcernCategoryBadge';
import { ConcernStats } from './ConcernStats';
import { OfficialAnswerBadge } from './OfficialAnswerBadge';

export interface PopularConcernCardProps {
  concern: ConcernSummary;
}

/**
 * `지금 많이 보는 취준 고민` 의 카드 — 테두리 있는 카드에 카테고리 배지, 제목 세 줄, 조회수·답변 수.
 *
 * 줄 배치가 화면 폭에 따라 다르다(`목록.webp`, `모바일 목록.webp`). 데스크톱은 윗줄 오른쪽 끝이
 * `오공고 답변` 이고 조회수·답변 수가 카드 맨 아래 오른쪽이다. 모바일은 카드가 낮아서 `오공고 답변` 이
 * 배지 옆에 붙고 조회수·답변 수가 윗줄 오른쪽으로 올라간다. 같은 노드를 두 자리에 두고 화면 폭으로
 * 가린다(`BootcampCard` 의 배지와 같은 방식).
 *
 * 본문 미리보기는 그리지 않는다 — 시안에 없다.
 */
export function PopularConcernCard({ concern }: PopularConcernCardProps) {
  const official = concern.hasOfficialComment;
  const stats = { viewCount: concern.viewCount, commentCount: concern.commentCount };

  return (
    <Link
      href={`/concerns/${concern.id}`}
      className="flex h-full flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ConcernCategoryBadge category={concern.category} />
          {official ? (
            <span className="md:hidden">
              <OfficialAnswerBadge />
            </span>
          ) : null}
        </div>
        {official ? (
          <span className="hidden md:block">
            <OfficialAnswerBadge />
          </span>
        ) : null}
        <ConcernStats {...stats} className="md:hidden" />
      </div>
      <p className="line-clamp-3 text-sm font-bold text-gray-900 md:text-base">{concern.title}</p>
      <ConcernStats {...stats} className="mt-auto hidden justify-end md:flex" />
    </Link>
  );
}
