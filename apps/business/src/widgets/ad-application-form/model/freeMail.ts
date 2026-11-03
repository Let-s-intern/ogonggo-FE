/**
 * 개인 메일 도메인. 이 주소로 가입하면 사업자등록증을 올려야 한다(시안 B-04 3단계 "개인 메일이면 사업자등록증 필요").
 * 목록은 국내에서 흔한 것만 둔다. 회사 메일인지 최종 판단은 백엔드가 한다(요청서).
 */
const FREE_MAIL_DOMAINS = new Set([
  'gmail.com',
  'naver.com',
  'daum.net',
  'hanmail.net',
  'kakao.com',
  'nate.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'yahoo.com',
]);

export function isFreeMail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  return domain !== undefined && FREE_MAIL_DOMAINS.has(domain);
}
