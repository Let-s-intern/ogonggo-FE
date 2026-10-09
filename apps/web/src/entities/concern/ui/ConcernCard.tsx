import Link from 'next/link';
import { getAuthorName } from '../model/author';
import type { ConcernSummary } from '../model/types';
import { ConcernCategoryBadge } from './ConcernCategoryBadge';
import { ConcernStats } from './ConcernStats';
import { OfficialAnswerBadge } from './OfficialAnswerBadge';
import { RelativeTime } from './RelativeTime';

export interface ConcernCardProps {
  concern: ConcernSummary;
}

/**
 * `v13 취준고민/목록.webp`, `모바일 목록.webp` 의 목록 행 — 카테고리 배지와 `오공고 답변` → 제목 →
 * 본문 한 줄 미리보기 → 작성자·시각·조회수·답변 수. 카드 테두리 없이 줄 사이 가는 선으로 나뉜다.
 * 오른쪽 썸네일은 이미지 API 가 없어 그리지 않는다(PRD).
 *
 * 본문은 일반 텍스트이고 응답에 전체가 실려 온다. 한 줄로 줄이는 것은 화면의 `line-clamp-1` 이다 —
 * 줄바꿈은 공백으로 접힌다. 제목은 길면 두 줄까지 보인다.
 */
export function ConcernCard({ concern }: ConcernCardProps) {
  return (
    <Link
      href={`/concerns/${concern.id}`}
      className="block border-b border-gray-100 px-2 py-5 transition-colors hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <ConcernCategoryBadge category={concern.category} />
        {concern.hasOfficialComment ? <OfficialAnswerBadge /> : null}
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-bold text-gray-900 md:text-base">
        {concern.title}
      </p>
      <p className="mt-1 line-clamp-1 text-xs text-gray-500 md:text-sm">{concern.content}</p>
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
        <span className="min-w-0 truncate">{getAuthorName(concern.author)}</span>
        <RelativeTime value={concern.createdAt} className="shrink-0" />
        <ConcernStats viewCount={concern.viewCount} commentCount={concern.commentCount} />
      </div>
    </Link>
  );
}
