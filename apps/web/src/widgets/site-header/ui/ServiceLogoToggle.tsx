'use client';

import Link from 'next/link';
import { type MouseEvent, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { useInstallState } from '@/features/install-app';
import { LETSCAREER_WEB_HOME, letsCareerWebHref } from '@/shared/api/letsCareerHandoff';
import { LetsCareerMark } from '@/shared/ui/LetsCareerMark';
import { Logo } from '@/shared/ui/Logo';

const MOBILE = {
  mark: 'h-[22px] w-[22px]',
  divider: 'h-[22px]',
  logo: 'h-[21px] w-[44px]',
} as const;

export interface ServiceLogoToggleProps {
  size: 'desktop' | 'mobile';
}

/**
 * 두 서비스를 오가는 토글. 전에는 `[렛츠커리어 마크 | 오공고 로고]` 셋이 한 링크로 홈에만 갔는데, 이제
 * 오공고 로고는 홈이고 렛츠커리어 마크는 렛츠커리어 웹으로 간다.
 *
 * 모양은 크기마다 다르다. `mobile` 은 헤더 윗줄의 `[마크 | 로고]` 그대로다. `desktop` 은 헤더 맨 위의
 * 얇은 띠(`SiteHeader`)에 글자가 붙은 `[마크 LETS CAREER | 로고 오늘의 공고]` 로 그린다 — 지금 보는
 * 서비스인 `오늘의 공고` 가 파랗고 렛츠커리어가 회색이다. 데스크톱은 이 띠가 이미 "지금 여기" 를
 * 말해 주고 홈으로 가는 링크는 그 아래 줄의 큰 로고가 맡으므로, 이 띠의 `오늘의 공고` 는 링크가 아니다.
 *
 * 렛츠커리어로 갈 때 로그인을 이어 준다. 주소는 누르는 순간 만든다(`letsCareerWebHref`) — 토큰이
 * 브라우저 저장소에만 있어 서버 렌더에서는 알 수 없고, `href` 에 미리 박아 두면 로그아웃한 뒤에도 옛
 * 토큰이 남는다. `href` 자체는 토큰 없는 첫 화면이라, 새 탭으로 열면(Cmd·Ctrl·가운데 버튼) 로그인 없이
 * 열린다.
 *
 * 누르면 떠나기 전까지 토글이 넘어간 모양을 보인다. 렛츠커리어 마크가 렛츠커리어 색(`#4D55F5`,
 * `lets-intern-client` `apps/web/public/logo/logo-simple.svg`)으로 칠해지고 오공고 로고가 연해진다.
 *
 * 모바일에서 웹 앱을 설치했으면 렛츠커리어 마크와 구분선을 빼고 오공고 로고만 둔다. 설치된 앱 안에서
 * 누르면 다른 사이트로 넘어가 앱에서 벗어나는 것이 어색하다. 설치 여부는 브라우저에서만 알 수 있어
 * 알기 전에는 모바일 마크를 그리지 않는다 — 설치된 앱에서 마크가 잠깐 보였다 사라지지 않게 한다.
 */
export function ServiceLogoToggle({ size }: ServiceLogoToggleProps) {
  const [leaving, setLeaving] = useState(false);
  const install = useInstallState();
  const showLetsCareer = size === 'desktop' || install.kind === 'not-installed';

  const goToLetsCareer = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    setLeaving(true);
    window.location.assign(letsCareerWebHref());
  };

  if (size === 'desktop') {
    return (
      <div className="flex items-center gap-3 text-xs font-medium">
        <a
          href={LETSCAREER_WEB_HOME}
          aria-label="렛츠커리어로 이동"
          onClick={goToLetsCareer}
          className={cn(
            'flex items-center gap-1.5 transition-colors',
            leaving ? 'text-[#4D55F5]' : 'text-gray-400 hover:text-gray-500',
          )}
        >
          <LetsCareerMark flat={leaving} className="h-3.5 w-3.5" />
          LETS CAREER
        </a>
        <span className="h-3 w-px bg-gray-300" />
        <span
          className={cn(
            'flex items-center gap-1.5 font-semibold transition-colors',
            leaving ? 'text-blue-200' : 'text-blue-500',
          )}
        >
          <Logo className="h-3 w-[25px]" />
          오늘의 공고
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {showLetsCareer ? (
        <>
          <a href={LETSCAREER_WEB_HOME} aria-label="렛츠커리어로 이동" onClick={goToLetsCareer}>
            <LetsCareerMark
              flat={leaving}
              className={cn(MOBILE.mark, 'transition-colors', leaving && 'text-[#4D55F5]')}
            />
          </a>
          <span className={cn('w-px bg-gray-300', MOBILE.divider)} />
        </>
      ) : null}
      <Link href="/" aria-label="오늘의 공고 홈">
        <Logo
          className={cn(
            MOBILE.logo,
            'transition-colors',
            leaving ? 'text-blue-200' : 'text-blue-500',
          )}
        />
      </Link>
    </div>
  );
}
