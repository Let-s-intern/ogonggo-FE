'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { NotificationList, ReadAllButton } from '@/features/notification-inbox';
import { isSignedIn } from '@/shared/api/authTokens';
import { useSignedIn } from '@/shared/api/useSignedIn';

/**
 * `/notifications` — 알림함 화면. 모바일 헤더의 알림 아이콘이 여기로 온다. 데스크톱은 헤더의 드롭다운 패널을 쓰지만
 * 주소로 들어오면(직접 입력, 로그인 뒤 돌아오기) 이 화면을 그대로 보인다. 패널로 바꾸거나 다른 곳으로 보내지 않는다.
 *
 * 로그인 가드는 `views/mypage/ui/MyPageLayout.tsx` 와 같다. 토큰이 브라우저 저장소에만 있어 첫 렌더 뒤에 보고,
 * 로그인하지 않았으면 돌아올 곳을 실어 `/login` 으로 보낸다. 그동안 목록은 부르지 않는다(`useNotificationList`).
 *
 * 들어오는 것만으로는 읽음 처리하지 않는다. 한 줄을 누르거나 `모두 읽음` 을 눌러야 읽는다(PRD 결정 4).
 */
export function NotificationsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = useSignedIn();

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [router, pathname]);

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-2xl bg-white">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h1 className="text-[22px] leading-[30px] font-bold text-gray-900">알림</h1>
        {signedIn ? <ReadAllButton className="h-11 text-sm" /> : null}
      </div>
      {signedIn ? <NotificationList layout="page" /> : null}
    </main>
  );
}
