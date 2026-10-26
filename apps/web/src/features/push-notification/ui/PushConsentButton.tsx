'use client';

import { BellIcon } from '@/shared/ui/icons';
import { usePushConsent } from '../model/usePushConsent';

/**
 * 헤더 위 띠의 알림 아이콘 왼쪽에 두는 `푸시 알림 받기` 버튼(데스크톱). 켜지면 사라진다. 상태와 켜기는
 * `usePushConsent` 가 맡고, 모바일은 같은 일을 알림함 안의 `PushConsentBanner` 가 한다.
 *
 * 로그인해야 토큰을 저장할 수 있으므로 비로그인 화면에는 부르는 쪽(`SiteHeader`)이 그리지 않는다.
 */
export function PushConsentButton() {
  const { visible, pending, enable } = usePushConsent();

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void enable()}
      disabled={pending}
      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-60"
    >
      <BellIcon className="h-3.5 w-3.5" />
      푸시 알림 받기
    </button>
  );
}
