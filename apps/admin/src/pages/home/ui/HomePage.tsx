import { Button, Card, CardTitle } from '@ogonggo/ui';
import { LaunchNoticeApplications } from '../../launch-notice';

/**
 * 어드민 홈.
 *
 * `LaunchNoticeApplications` 는 런칭(2026-09-23) 전까지만 있는 화면이다. 그 앱과 함께
 * `pages/launch-notice/` 를 지우고 여기 두 줄(import 와 아래 렌더)을 지우면 된다 —
 * 어드민에서 출시알림과 이어진 자리는 그게 전부다(`apps/launch-notice/README.md`).
 *
 * `VITE_POCKETBASE_URL` 이 없으면 그 컴포넌트가 스스로 아무것도 그리지 않는다.
 */
export function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-gray-50 px-6 py-10">
      <Card className="w-96">
        <CardTitle>오공고 관리자</CardTitle>
        <Button className="mt-4">시작하기</Button>
      </Card>

      <LaunchNoticeApplications />
    </main>
  );
}
