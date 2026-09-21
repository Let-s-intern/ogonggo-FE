import { redirect } from 'next/navigation';
import { USER_MYPAGE_MENU } from '@/widgets/mypage-sidebar';

/**
 * `/mypage` 자체에는 화면이 없다. 목업의 다섯 화면이 전부 메뉴 아래에 있어서, 첫 메뉴로
 * 보낸다. 서버에서 보내므로 껍데기가 한 번 그려졌다 바뀌는 깜빡임이 없다.
 */
export default function Page() {
  redirect(USER_MYPAGE_MENU[0]!.href);
}
