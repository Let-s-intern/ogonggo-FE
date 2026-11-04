/**
 * 비즈니스 헤더의 메뉴. 시안의 `광고 안내` · `신청 가능 일정` · `광고 신청하기` 를 옮겼다.
 * `signedInOnly` 는 로그인한 기업에게만 보인다(신청 가능 일정은 로그인 뒤에 본다).
 */
export const NAV_ITEMS: readonly { href: string; label: string; signedInOnly?: boolean }[] = [
  { href: '/', label: '광고 안내' },
  { href: '/schedule', label: '신청 가능 일정', signedInOnly: true },
  { href: '/apply', label: '광고 신청' },
];

/** `/` 는 정확히 같을 때만, 나머지는 그 아래 경로까지 켠다. */
export function isNavActive(href: string, pathname: string): boolean {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}
