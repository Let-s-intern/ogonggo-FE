import Link from 'next/link';
import { lexicalToPlainText } from '@/shared/lib/lexicalHtml';
import { Thumbnail } from '@/shared/ui/Thumbnail';
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
 * 오른쪽에 첫 첨부 사진(`images[0]`) 정사각 썸네일을 둔다. 사진이 없으면 칸 자체를 그리지 않고
 * 글자 줄이 행 폭을 다 쓴다. 썸네일 크기는 시안 비율로 모바일 64px, PC 96px 이다.
 *
 * 본문은 Lexical EditorState JSON 문자열이고 응답에 전체가 실려 온다. 서식 없는 글자만 뽑아(`lexicalToPlainText`,
 * 문단 사이는 공백 하나) 화면의 `line-clamp-1` 로 한 줄로 줄인다. 예전 글의 일반 텍스트 본문은 그 문자열을 그대로
 * 쓴다. 제목은 길면 두 줄까지 보인다.
 */
export function ConcernCard({ concern }: ConcernCardProps) {
  const thumbnail = concern.images[0];

  return (
    <Link
      href={`/concerns/${concern.id}`}
      className="flex items-center gap-4 border-b border-gray-100 px-2 py-5 transition-colors hover:bg-gray-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <ConcernCategoryBadge category={concern.category} />
          {concern.hasOfficialComment ? <OfficialAnswerBadge /> : null}
        </div>
        <p className="mt-3 line-clamp-2 text-sm font-bold text-gray-900 md:text-base">
          {concern.title}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-gray-500 md:text-sm">
          {lexicalToPlainText(concern.content)}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <span className="min-w-0 truncate">{getAuthorName(concern.author)}</span>
          <RelativeTime value={concern.createdAt} className="shrink-0" />
          <ConcernStats viewCount={concern.viewCount} commentCount={concern.commentCount} />
        </div>
      </div>
      {thumbnail ? (
        <Thumbnail
          src={thumbnail.url}
          alt=""
          className="size-16 shrink-0 rounded-lg border border-gray-100 md:size-24"
        />
      ) : null}
    </Link>
  );
}
