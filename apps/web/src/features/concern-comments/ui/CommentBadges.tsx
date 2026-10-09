/**
 * `렛츠커리어 매니저` — 관리자 계정이 쓴 운영자 답변(`official`). 시안은 파란 바탕에 흰 글자다.
 * 고민글 목록의 `오공고 답변`(`entities/concern/ui/OfficialAnswerBadge.tsx`) 과는 다른 표시다. 이쪽은 답변,
 * 저쪽은 고민글에 붙는다.
 */
export function ManagerBadge() {
  return (
    <span className="shrink-0 rounded-sm bg-blue-500 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-white">
      렛츠커리어 매니저
    </span>
  );
}

/** `작성자` — 고민글 작성자(질문자) 가 쓴 답변·답글(`concernAuthor`). 시안은 연한 파랑 바탕에 파란 글자다. */
export function ConcernAuthorBadge() {
  return (
    <span className="shrink-0 rounded-sm bg-blue-50 px-1.5 py-0.5 text-xs font-medium whitespace-nowrap text-blue-500">
      작성자
    </span>
  );
}
