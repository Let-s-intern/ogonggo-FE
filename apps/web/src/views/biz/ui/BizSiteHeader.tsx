'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { cn } from '@ogonggo/ui';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { SiteHeader } from '@/widgets/site-header';

/**
 * 오공고에 로그인한 사람에게만 사이트 헤더를 보인다(PRD 1절). 외부에서 바로 들어온 사람에게 `/biz` 는
 * 별도 사이트처럼 히어로로 시작해야 한다.
 *
 * 토큰이 브라우저 저장소에만 있어 서버 렌더와 첫 하이드레이션은 헤더 없이 그린다. 그 뒤 토큰이 있으면
 * 헤더를 위에서 밀어 내린다. 감싼 상자의 높이(`grid-template-rows` 0fr → 1fr)를 함께 늘려, 아래 히어로가
 * 한 번에 튀지 않고 헤더 높이만큼 부드럽게 내려간다.
 *
 * 안쪽 상자를 잘라 내지 않는다(`overflow` 를 두지 않는다). 접힌 동안 헤더는 화면 위로 올라가 있어 보이지 않고,
 * 펼친 뒤에는 알림 패널·계정 메뉴 드롭다운이 헤더 아래로 펼쳐져야 한다.
 *
 * 마운트 직후 한 프레임 뒤에 펼친다. 같은 프레임에 펼치면 브라우저가 접힌 상태를 그리지 않아 전환이 없다.
 */
export function BizSiteHeader() {
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      setOpen(false);
      return;
    }
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [signedIn]);

  if (!signedIn) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative z-30 grid transition-[grid-template-rows] duration-500 ease-out motion-reduce:transition-none',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div className="min-h-0">
        <div
          className={cn(
            'transition-transform duration-500 ease-out motion-reduce:transition-none',
            open ? 'translate-y-0' : '-translate-y-full',
          )}
        >
          <SiteHeader />
        </div>
      </div>
    </div>
  );
}
