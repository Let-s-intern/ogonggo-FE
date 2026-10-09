import type { ConcernDetailResponse } from '@ogonggo/api';
import { getAuthorName } from '@/entities/concern/model/author';
import { ConcernCategoryBadge } from '@/entities/concern/ui/ConcernCategoryBadge';
import { OfficialAnswerBadge } from '@/entities/concern/ui/OfficialAnswerBadge';
import { RelativeTime } from '@/entities/concern/ui/RelativeTime';
import { AuthorAvatar, ConcernMetaStats } from '@/features/concern-comments';
import { ConcernOwnerActions } from './ConcernOwnerActions';

export interface ConcernDetailCardProps {
  concern: ConcernDetailResponse;
}

/**
 * `v13 취준고민/상세.webp`, `모바일 상세.webp` 의 본문 카드 — 카테고리 배지와 `오공고 답변` → 제목 →
 * 작성자 → 시각·조회수·답변 수 → 가는 선 → 본문. 본문은 일반 텍스트라 줄바꿈만 살려 그린다.
 *
 * 시안에 있는 본문 이미지 세 장은 이미지 API 가 없어 그리지 않는다(PRD 결정 9).
 *
 * 작성자 줄 오른쪽 끝의 `수정 | 삭제` 는 내 글일 때만, 마운트 뒤에 나타난다(`ConcernOwnerActions`).
 *
 * 조회수는 서버가 읽은 값 그대로다. 이번 조회는 들어 있지 않고(PRD 결정 7) 화면에서 1 을 더하지도
 * 않는다. 답변 수는 답변 영역에서 쓰고 지우면 같이 바뀐다(`ConcernMetaStats`).
 */
export function ConcernDetailCard({ concern }: ConcernDetailCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-5 md:p-7">
      <div className="flex items-center gap-2">
        <ConcernCategoryBadge category={concern.category} />
        {concern.hasOfficialComment ? <OfficialAnswerBadge /> : null}
      </div>
      <h1 className="mt-3 text-lg font-bold break-words text-gray-900 md:text-xl">
        {concern.title}
      </h1>
      <div className="mt-3 flex items-center gap-2">
        <AuthorAvatar src={concern.author.profileImageUrl} />
        <span className="min-w-0 truncate text-sm font-bold text-gray-900">
          {getAuthorName(concern.author)}
        </span>
        <ConcernOwnerActions concernId={concern.id} title={concern.title} />
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
        <RelativeTime value={concern.createdAt} className="shrink-0" />
        <ConcernMetaStats
          concernId={concern.id}
          viewCount={concern.viewCount}
          commentCount={concern.commentCount}
        />
      </div>
      <hr className="my-4 border-gray-200" />
      <p className="text-sm leading-relaxed break-words whitespace-pre-line text-gray-800">
        {concern.content}
      </p>
    </article>
  );
}
