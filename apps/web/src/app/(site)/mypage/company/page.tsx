import { redirect } from 'next/navigation';
import { myPageHomeFor } from '@/widgets/mypage-sidebar';

/**
 * `/mypage/company` 자체에는 화면이 없다. 목업의 두 화면이 전부 메뉴 아래에 있어서 첫 메뉴로
 * 보낸다 — `/mypage`(일반 회원) 와 같은 처리다.
 */
export default function Page() {
  redirect(myPageHomeFor('COMPANY'));
}
