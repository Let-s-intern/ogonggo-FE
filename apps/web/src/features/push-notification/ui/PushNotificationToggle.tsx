'use client';

import { useEffect, useState } from 'react';
import { Toggle } from '@ogonggo/ui';
import {
  disablePush,
  enablePush,
  isPushAvailable,
  isPushBlocked,
  isPushEnabled,
} from '../model/pushToken';

type State =
  /** 서버 렌더와 첫 하이드레이션, 그리고 이 브라우저·배포가 웹 푸시를 못 받는 경우. 그리지 않는다. */
  { kind: 'hidden' } | { kind: 'ready'; enabled: boolean; blocked: boolean };

/**
 * 이 기기의 브라우저로 푸시 알림을 받을지 정하는 스위치(마이페이지).
 *
 * 브라우저가 웹 푸시를 못 받거나(iOS 사파리 탭 등) Firebase 설정이 없으면 아무것도 그리지 않는다.
 * 켤 수 없는 스위치를 보여 주지 않는다. 서버는 브라우저의 권한 상태를 알 수 없어서, 첫 렌더는 언제나
 * `hidden` 이고 마운트 뒤에 읽어 바뀐다.
 */
export function PushNotificationToggle() {
  const [state, setState] = useState<State>({ kind: 'hidden' });
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (isPushAvailable()) {
      setState({ kind: 'ready', enabled: isPushEnabled(), blocked: isPushBlocked() });
    }
  }, []);

  if (state.kind === 'hidden') {
    return null;
  }

  const handleChange = async (checked: boolean) => {
    setPending(true);
    setFailed(false);
    try {
      if (checked) {
        const result = await enablePush();
        setState({ kind: 'ready', enabled: result === 'enabled', blocked: result === 'blocked' });
      } else {
        await disablePush();
        setState({ kind: 'ready', enabled: false, blocked: false });
      }
    } catch {
      setFailed(true);
      setState({ kind: 'ready', enabled: false, blocked: isPushBlocked() });
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-6 py-5">
        <div>
          <p className="text-base font-bold text-gray-900">푸시 알림</p>
          <p className="pt-1 text-sm text-gray-500">
            {state.blocked
              ? '브라우저 설정에서 이 사이트의 알림을 허용하면 켤 수 있어요.'
              : '이 기기의 브라우저로 알림을 받아요.'}
          </p>
        </div>
        <Toggle
          checked={state.enabled}
          disabled={pending || state.blocked}
          onChange={handleChange}
          label={state.enabled ? '켜짐' : '꺼짐'}
          className="shrink-0"
        />
      </div>
      {failed ? (
        <p role="alert" className="pt-2 text-sm text-error">
          알림을 켜지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
    </div>
  );
}
