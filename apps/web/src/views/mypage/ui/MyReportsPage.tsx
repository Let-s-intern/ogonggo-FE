/**
 * `/mypage/reports` 본문(PRD 3장). 바깥 껍데기(탭·로그인 가드·역할 가드)는
 * `app/(site)/mypage/layout.tsx` 가 그린 `MyPageLayout` 이라 여기는 본문만 넘긴다. 플래그가 꺼져 있어도
 * 주소로 들어오면 열린다(PRD 7.1) — 플래그는 탭을 보일지만 정한다.
 */
export function MyReportsPage() {
  return <h2 className="text-xl font-bold text-gray-950">내 리포트</h2>;
}
