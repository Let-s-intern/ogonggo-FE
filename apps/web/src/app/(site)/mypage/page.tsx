import { redirect } from 'next/navigation';
import { myPageHomeFor } from '@/widgets/mypage-sidebar';

/**
 * 일반 회원 마이페이지는 모바일도 데스크톱과 같이 상단 탭이라 따로 둘 첫 화면이 없다 — 첫 탭으로
 * 보낸다. 기업 회원(`/mypage/company`)은 모바일에서 여전히 메뉴 화면을 쓴다(`MyPageIndex`).
 */
export default function Page() {
  redirect(myPageHomeFor('USER'));
}
