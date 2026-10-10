/**
 * `오공고 답변` — 삭제되지 않은 운영자 답변이 있는 고민글에 붙는다(`hasOfficialComment`). 시안은 바탕 없이
 * 초록 글자만 그린다. 색은 `Badge` 의 `success` 톤 글자색(`emerald-700`) 과 같다.
 *
 * 답변 쪽 `렛츠커리어 매니저` 배지(`official`) 와는 다른 표시다. 이쪽은 고민글, 저쪽은 답변이다.
 */
export function OfficialAnswerBadge() {
  return (
    <span className="shrink-0 text-xs font-medium whitespace-nowrap text-emerald-700">
      오공고 답변
    </span>
  );
}
