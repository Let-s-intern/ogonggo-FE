import type { CompanyPostTab } from './query';

/**
 * 등록·수정 폼의 주소. **그 화면은 Push 3(채용공고)·Push 4(부트캠프) 가 만든다** — 이 Push
 * 는 목록에서 그리로 가는 링크만 놓는다. 주소를 여기 한 곳에 두는 이유가 그것이다. 뒤 Push
 * 가 다른 경로를 고르면 이 파일만 고치면 된다.
 *
 * 종류가 경로에 들어간다. 채용공고와 부트캠프는 요청 타입도 목업도 달라 폼이 둘이고,
 * `/mypage/company/posts/{id}/edit` 로 합치면 id 만 보고 어느 폼인지 알 수 없다.
 */
export function companyPostNewHref(tab: CompanyPostTab): string {
  return `/mypage/company/posts/${tab}/new`;
}

export function companyPostEditHref(tab: CompanyPostTab, id: number): string {
  return `/mypage/company/posts/${tab}/${id}/edit`;
}
