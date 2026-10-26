'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@ogonggo/ui';
import { BellIcon } from '@/shared/ui/icons';
import {
  enablePush,
  isPushAvailable,
  isPushBlocked,
  isPushEnabled,
  subscribePushState,
} from '../model/pushToken';

/** 켤 수 있는데 아직 켜지 않은 상태에서만 보인다. 켰거나 브라우저에서 막아 두었으면 숨는다. */
function shouldShow(): boolean {
  return isPushAvailable() && !isPushEnabled() && !isPushBlocked();
}

/**
 * 헤더 위 띠의 알림 아이콘 왼쪽에 두는 `푸시 알림 받기` 버튼. 누르면 브라우저 권한을 묻고 이 기기의 토큰을 저장한다
 * (`enablePush`). 켜지면 사라진다. 마이페이지 `개인 정보` 의 스위치와 같은 일을 하고, 어느 쪽에서 바꿔도 서로 맞춘다
 * (`subscribePushState`).
 *
 * 서버는 브라우저 권한을 알 수 없어 첫 렌더는 언제나 그리지 않고, 마운트 뒤에 읽어 정한다. 로그인해야 토큰을 저장할
 * 수 있으므로 비로그인 화면에는 부르는 쪽(`SiteHeader`)이 그리지 않는다.
 */
export function PushConsentButton() {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const update = () => setVisible(shouldShow());
    update();
    return subscribePushState(update);
  }, []);

  if (!visible) {
    return null;
  }

  const handleClick = async () => {
    setPending(true);
    try {
      const result = await enablePush();
      toast.show(
        result === 'enabled'
          ? { message: '푸시 알림을 켰어요. 새 댓글과 공지를 바로 알려 드릴게요.' }
          : {
              message: '브라우저에서 알림이 막혀 있어요. 사이트 설정에서 허용해 주세요.',
              tone: 'error',
            },
      );
    } catch {
      toast.show({ message: '알림을 켜지 못했어요. 잠시 후 다시 시도해 주세요.', tone: 'error' });
    } finally {
      setPending(false);
      setVisible(shouldShow());
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      className="inline-flex h-7 items-center gap-1.5 rounded-full bg-blue-50 px-3 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-60"
    >
      <BellIcon className="h-3.5 w-3.5" />
      푸시 알림 받기
    </button>
  );
}
