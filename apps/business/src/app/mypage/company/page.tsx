import { redirect } from 'next/navigation';

/**
 * web 의 `/mypage/company` 는 모바일 메뉴 화면(`MyPageIndex`)이다. biz 는 그 화면을 옮기지 않고 공고 목록으로
 * 보낸다(PRD 6절).
 */
export default function Page() {
  redirect('/mypage/company/posts');
}
