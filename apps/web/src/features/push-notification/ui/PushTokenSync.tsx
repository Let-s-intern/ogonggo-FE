'use client';

import { useEffect } from 'react';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { forgetSavedToken } from '@/shared/api/pushDevice';
import { syncPushToken } from '../model/pushToken';

/**
 * 화면에는 아무것도 그리지 않는다. 앱을 열 때와 로그인·로그아웃으로 토큰이 바뀔 때, 이미 알림을 켜 둔
 * 기기의 FCM 토큰을 백엔드와 맞춘다. 알림을 처음 켜는 것은 `PushNotificationToggle` 이다.
 */
export function PushTokenSync() {
  useEffect(() => {
    const run = () => {
      if (isSignedIn()) {
        void syncPushToken();
      } else {
        forgetSavedToken();
      }
    };
    run();
    // 구독은 여기서 건다 — `subscribeTokens` 가 `window` 를 직접 만지므로 모듈 최상위에서 부르면 서버에서 깨진다.
    return subscribeTokens(run);
  }, []);

  return null;
}
