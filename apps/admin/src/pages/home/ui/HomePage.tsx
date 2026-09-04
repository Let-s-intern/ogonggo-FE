import { Button, Card, CardTitle } from '@ogonggo/ui';

/**
 * 출시알림 신청이 쌓이는 구글 스프레드시트 주소.
 *
 * 시트를 어드민 화면으로 다시 그리지 않고 링크만 둔다(2026-09-04 결정). 받는 사람이 하는 일이
 * 필터·메모·연락 완료 표시라 스프레드시트가 이미 그 일에 더 낫고, CSV 내보내기도 거기 있다.
 *
 * 주소 자체는 비밀이 아니다 — 누가 열 수 있는지는 구글 공유 설정이 정한다. 신청 데이터를 쓰는
 * 열쇠(앱스 스크립트 웹앱 주소와 공유 비밀)는 `apps/launch-notice` 의 서버 환경변수에만 있다.
 *
 * **런칭(2026-09-23) 뒤 지운다.** `apps/launch-notice` 를 지울 때 같이 지우면 되고,
 * 이 상수와 아래 블록이 이 저장소에서 그 앱을 가리키는 유일한 자리다
 * (`apps/launch-notice/README.md`).
 */
const LAUNCH_NOTICE_SHEET_URL = import.meta.env.VITE_LAUNCH_NOTICE_SHEET_URL as string | undefined;

export function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-96">
        <CardTitle>오공고 관리자</CardTitle>
        <Button className="mt-4">시작하기</Button>

        {LAUNCH_NOTICE_SHEET_URL ? (
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-xs font-medium text-gray-400">출시알림 신청 (런칭 전 임시)</p>
            <a
              href={LAUNCH_NOTICE_SHEET_URL}
              target="_blank"
              rel="noopener"
              className="mt-1 block text-sm font-semibold text-blue-500 hover:underline"
            >
              구글 스프레드시트 열기
            </a>
          </div>
        ) : null}
      </Card>
    </main>
  );
}
