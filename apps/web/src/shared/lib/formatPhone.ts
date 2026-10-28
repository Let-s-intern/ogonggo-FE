/**
 * 연락처에 하이픈을 넣는다. 입력하는 동안 부르므로 아직 덜 친 번호도 그대로 돌려줘야 한다.
 * `/biz` 신청서와 기업 회원가입이 함께 쓴다. 처음에는 `apps/launch-notice/src/lib/apply.ts` 에 있었다.
 *
 * 국번 자릿수가 갈린다.
 *   02        서울 지역번호만 두 자리다 (02-1234-5678, 02-123-4567)
 *   그 외 10자리  3-3-4 (031-123-4567, 011-123-4567)
 *   그 외 11자리  3-4-4 (010-1234-5678, 070-1234-5678)
 *
 * 숫자가 아닌 글자는 버린다. 붙여넣기로 `+82 10 1234 5678` 이 들어오는 경우가 있는데, 앞의
 * `82` 를 국번으로 읽으면 엉뚱하게 잘리므로 국가번호는 `0` 으로 되돌린다.
 */
export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('82')) {
    digits = `0${digits.slice(2)}`;
  }
  digits = digits.slice(0, 11);

  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  // 휴대폰(`010`)은 길이를 보지 않고 3-4-4 로 간다. 길이로만 나누면 여덟 자리째에 `010-123-45` 로
  // 갈랐다가 열한 자리째에 `010-1234-5678` 로 다시 갈라, 치는 도중에 하이픈이 한 칸 뛴다.
  if (digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
