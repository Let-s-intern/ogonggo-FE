'use client';

import { CircleIconButton } from '@ogonggo/ui';
import type { LetsCareerSocialProvider } from '@/shared/api/letscareer';
import { RecentSignInBubble } from './RecentSignInBubble';

const BUBBLE_CLASS = 'absolute bottom-full left-1/2 mb-2 -translate-x-1/2';

export interface SocialSignInButtonsProps {
  onSelect: (provider: LetsCareerSocialProvider) => void;
}

/**
 * 카카오·네이버 간편 로그인 버튼. 렛츠커리어 계정으로 로그인한다.
 *
 * 브랜드 색(카카오 `#FEE500`, 네이버 `#2DB400`) 과 그림은 두 서비스의 것이라 토큰을 쓰지 않는다. 그림은
 * `lets-intern-client` 의 `public/icons/kakao-icon.svg`·`naver-icon.svg` 와 같다.
 *
 * 마지막으로 성공한 수단이면 버튼 위에 "최근 로그인" 말풍선이 뜬다.
 */
export function SocialSignInButtons({ onSelect }: SocialSignInButtonsProps) {
  return (
    <div className="flex justify-center gap-4">
      <div className="relative">
        <RecentSignInBubble method="kakao" className={BUBBLE_CLASS} />
        <CircleIconButton
          label="카카오 로그인"
          className="bg-[#FEE500]"
          onClick={() => onSelect('kakao')}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true" className="size-5">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 .6C4.03.6 0 3.713 0 7.552c0 2.388 1.558 4.493 3.932 5.745l-.999 3.648c-.088.322.28.58.564.392l4.377-2.889c.37.036.745.057 1.126.057 4.97 0 9-3.113 9-6.953S13.97.6 9 .6Z"
              fill="black"
            />
          </svg>
        </CircleIconButton>
      </div>
      <div className="relative">
        <RecentSignInBubble method="naver" className={BUBBLE_CLASS} />
        <CircleIconButton
          label="네이버 로그인"
          className="bg-[#2DB400]"
          onClick={() => onSelect('naver')}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
            <path
              d="M10.849 8.563 4.917 0H0v16h5.151V7.436L11.083 16H16V0h-5.151v8.563Z"
              fill="white"
            />
          </svg>
        </CircleIconButton>
      </div>
    </div>
  );
}
