'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@ogonggo/ui';
import type { MyPageMenuItem } from '../model/menu';

export interface MyPageTabsProps {
  menuItems: readonly MyPageMenuItem[];
  /** 탭 줄 오른쪽 끝. 작성한 모집글의 `새 모집글 작성하기` 가 여기 온다(v11). */
  action?: ReactNode;
}

/**
 * 일반 회원 마이페이지의 상단 탭(v11 `docs/asset/v11/`). v4~v7 의 좌측 사이드바를 대신한다.
 * 모바일도 같은 탭이다 — 글자와 간격만 줄인다. 버튼(`action`)은 모바일에서 숨긴다. 모바일
 * 작성한 모집글은 목록 위 배너에 같은 버튼이 있다(`docs/asset/v10 mobile/작성한 모집글.png`).
 *
 * 모양은 `widgets/mypage-list` 의 `MyPageListTabs` 와 같다 — 파란 글자에 파란 밑줄. 그 컴포넌트는
 * `?tab=` 을 바꾸는 링크라 값과 주소 조립 함수를 받는데, 이 줄은 경로 자체가 탭이라 따로 둔다.
 *
 * 현재 탭은 사이드바와 같은 규칙으로 고른다. 정확히 같은 경로거나 그 아래 경로다 —
 * `/mypage/posts/new` 에서도 `작성한 모집글` 이 켜져 있어야 한다.
 */
export function MyPageTabs({ menuItems, action }: MyPageTabsProps) {
  const pathname = usePathname();

  return (
    // 버튼은 탭보다 키가 커서 같은 줄에 흘리면 탭 줄이 화면마다 높이가 달라진다. 그래서 띄워서
    // 탭 글자의 가운데에 맞춘다(`pb-3` 은 탭 밑줄 아래 여백만큼 올린 것이다).
    <div className="relative">
      <nav
        aria-label="마이페이지 메뉴"
        className="flex items-center gap-5 overflow-x-auto whitespace-nowrap md:gap-8"
      >
        {menuItems.map((item) => {
          const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? 'page' : undefined}
              className={cn(
                'shrink-0 border-b-2 pb-3 text-base md:text-lg',
                current
                  ? 'border-blue-500 font-bold text-blue-500'
                  : 'border-transparent font-medium text-gray-400 hover:text-gray-600',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {action ? (
        <div className="absolute inset-y-0 right-0 hidden items-center pb-3 md:flex">{action}</div>
      ) : null}
    </div>
  );
}
