'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@ogonggo/ui';
import {
  enablePush,
  isPushAvailable,
  isPushBlocked,
  isPushEnabled,
  subscribePushState,
} from './pushToken';

/** 켤 수 있는데 아직 켜지 않은 상태에서만 보인다. 켰거나 브라우저에서 막아 두었으면 숨는다. */
function shouldShow(): boolean {
  return isPushAvailable() && !isPushEnabled() && !isPushBlocked();
}

/**
 * 푸시 동의 버튼 둘(헤더의 `PushConsentButton`, 모바일 알림함의 `PushConsentBanner`)이 같이 쓰는 상태와 켜기.
 * 누르면 브라우저 권한을 묻고 이 기기의 토큰을 저장한다(`enablePush`). 결과는 토스트로 알리고, 켜거나 막히면
 * `visible` 이 거짓이 된다. 마이페이지 스위치에서 바꿔도 `subscribePushState` 로 따라 바뀐다.
 *
 * 서버는 브라우저 권한을 알 수 없어 첫 렌더는 언제나 `visible: false` 이고, 마운트 뒤에 읽어 정한다.
 */
export function usePushConsent() {
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const update = () => setVisible(shouldShow());
    update();
    return subscribePushState(update);
  }, []);

  const enable = async () => {
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

  return { visible, pending, enable };
}
