'use client';

import { useSyncExternalStore } from 'react';
import { SpeechBubble } from '@ogonggo/ui';
import { readSignInMethod, type SignInMethod } from '@/shared/lib/lastSignInMethod';

// 이 화면에 있는 동안 값이 바뀌는 일은 로그인 성공뿐이고, 그러면 화면을 떠난다. 바뀜을 들을 것이 없다.
const subscribeNothing = () => () => {};

/**
 * 마지막으로 성공한 수단이 `method` 면 가리킬 버튼 위에 "최근 로그인" 을 띄운다. 가리킬 버튼을 `relative` 로
 * 감싼 안에 둔다.
 *
 * 기록이 브라우저 저장소에 있어 서버 렌더와 첫 하이드레이션에는 그리지 않는다(서버 스냅샷 `null`).
 */
export function RecentSignInBubble({
  method,
  className,
}: {
  method: SignInMethod;
  className?: string;
}) {
  const recent = useSyncExternalStore(subscribeNothing, readSignInMethod, () => null);
  if (recent !== method) {
    return null;
  }
  return <SpeechBubble className={className}>최근 로그인</SpeechBubble>;
}
