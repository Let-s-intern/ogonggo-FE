'use client';

import Link from 'next/link';
import { type MouseEvent, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { LETSCAREER_WEB_HOME, letsCareerWebHref } from '@/shared/api/letsCareerHandoff';
import { LetsCareerMark } from '@/shared/ui/LetsCareerMark';
import { Logo } from '@/shared/ui/Logo';

const SIZES = {
  desktop: { mark: 'h-[26px] w-[26px]', divider: 'h-[26px]', logo: 'h-[25px] w-[52px]' },
  mobile: { mark: 'h-[22px] w-[22px]', divider: 'h-[22px]', logo: 'h-[21px] w-[44px]' },
} as const;

export interface ServiceLogoToggleProps {
  size: keyof typeof SIZES;
}

/**
 * 헤더 왼쪽의 `[렛츠커리어 마크 | 오공고 로고]`. 전에는 셋이 한 링크로 홈에만 갔는데, 이제 두 서비스를
 * 오가는 토글이다. 오공고 로고는 전처럼 홈이고, 렛츠커리어 마크는 렛츠커리어 웹으로 간다.
 *
 * 렛츠커리어로 갈 때 로그인을 이어 준다. 주소는 누르는 순간 만든다(`letsCareerWebHref`) — 토큰이
 * 브라우저 저장소에만 있어 서버 렌더에서는 알 수 없고, `href` 에 미리 박아 두면 로그아웃한 뒤에도 옛
 * 토큰이 남는다. `href` 자체는 토큰 없는 첫 화면이라, 새 탭으로 열면(Cmd·Ctrl·가운데 버튼) 로그인 없이
 * 열린다.
 *
 * 누르면 떠나기 전까지 토글이 넘어간 모양을 보인다. 렛츠커리어 마크가 렛츠커리어 색(`#4D55F5`,
 * `lets-intern-client` `apps/web/public/logo/logo-simple.svg`)으로 칠해지고 오공고 로고가 연해진다.
 */
export function ServiceLogoToggle({ size }: ServiceLogoToggleProps) {
  const [leaving, setLeaving] = useState(false);
  const sizes = SIZES[size];

  const goToLetsCareer = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    setLeaving(true);
    window.location.assign(letsCareerWebHref());
  };

  return (
    <div className="flex items-center gap-3">
      <a href={LETSCAREER_WEB_HOME} aria-label="렛츠커리어로 이동" onClick={goToLetsCareer}>
        <LetsCareerMark
          flat={leaving}
          className={cn(sizes.mark, 'transition-colors', leaving && 'text-[#4D55F5]')}
        />
      </a>
      <span className={cn('w-px bg-gray-300', sizes.divider)} />
      <Link href="/" aria-label="오늘의 공고 홈">
        <Logo
          className={cn(
            sizes.logo,
            'transition-colors',
            leaving ? 'text-blue-200' : 'text-blue-500',
          )}
        />
      </Link>
    </div>
  );
}
