'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { AdSchedule } from '@/widgets/ad-schedule';

/**
 * 신청 가능 일정 화면(시안 B-03). 로그인한 기업만 본다. 로그인하지 않았으면 기업 마이페이지처럼
 * `/login?redirect=<지금 경로>` 로 보낸다. 토큰이 브라우저 저장소에만 있어 서버 렌더에서는 아무것도 그리지 않는다.
 */
export function SchedulePage() {
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);

  useEffect(() => {
    if (!isSignedIn()) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [router, pathname, signedIn]);

  if (!signedIn) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-page-padded px-5 py-10 md:py-14">
      <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">신청 가능 일정</h1>
      <p className="pt-2 pb-8 text-sm text-gray-500 md:text-base">
        지면별 잔여 구좌를 주 단위(월~일)로 확인하고 바로 신청해요.
      </p>
      <AdSchedule />
    </main>
  );
}
