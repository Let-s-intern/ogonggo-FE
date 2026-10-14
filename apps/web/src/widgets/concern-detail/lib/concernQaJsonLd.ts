import type { ConcernCommentRootResponse, ConcernDetailResponse } from '@ogonggo/api';
import { getAuthorName } from '@/entities/concern/model/author';
import { SITE_ORIGIN } from '@/shared/config/site';
import { withKstOffset } from '@/shared/lib/kstDateTime';
import { lexicalToPlainText } from '@/shared/lib/lexicalHtml';

/**
 * 고민글 상세의 `QAPage` 구조화 데이터(https://schema.org/QAPage).
 *
 * 고민글이 질문, 답변(부모 댓글)이 `suggestedAnswer` 다. `acceptedAnswer` 는 질문자가 채택한 답에만 쓰는
 * 칸인데 채택 기능이 없어 쓰지 않는다 — 운영자 답변도 채택된 것은 아니다. 답글은 답변에 대한 대화라 싣지
 * 않는다.
 *
 * 답변이 하나도 없으면 `null` 이다. 답 없는 `QAPage` 는 Google 이 오류로 본다.
 *
 * 삭제된 답변(`deleted`)은 본문이 "삭제된 댓글입니다" 라 뺀다. 운영자 답변은 작성자를 서비스로 적는다 —
 * 화면에서도 개인이 아니라 매니저 배지로 보인다.
 */
export function buildConcernQaJsonLd(
  concern: ConcernDetailResponse,
  answers: ConcernCommentRootResponse[],
): Record<string, unknown> | null {
  const visibleAnswers = answers.filter((answer) => !answer.deleted && answer.content.trim());
  if (visibleAnswers.length === 0) {
    return null;
  }

  const url = `${SITE_ORIGIN}/concerns/${concern.id}`;

  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    url,
    mainEntity: {
      '@type': 'Question',
      name: concern.title,
      text: lexicalToPlainText(concern.content).replace(/\s+/g, ' ').trim() || concern.title,
      answerCount: concern.commentCount,
      dateCreated: withKstOffset(concern.createdAt),
      author: { '@type': 'Person', name: getAuthorName(concern.author) },
      suggestedAnswer: visibleAnswers.map((answer) => ({
        '@type': 'Answer',
        text: answer.content,
        dateCreated: withKstOffset(answer.createdAt),
        upvoteCount: answer.likeCount,
        url,
        author: answer.official
          ? { '@type': 'Organization', name: '오늘의 공고', url: `${SITE_ORIGIN}/` }
          : { '@type': 'Person', name: getAuthorName(answer.author) },
      })),
    },
  };
}
