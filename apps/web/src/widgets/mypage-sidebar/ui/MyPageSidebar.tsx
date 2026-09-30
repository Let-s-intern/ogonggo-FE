'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@ogonggo/ui';
import type { MyPageMenuItem } from '../model/menu';
import { MyPageProfileCard, type MyPageProfileCardProps } from './MyPageProfileCard';

export interface MyPageSidebarProps extends MyPageProfileCardProps {
  /** 그릴 메뉴. 일반 회원은 넷, 기업 회원(v5)은 둘이다. */
  menuItems: readonly MyPageMenuItem[];
}

/**
 * 마이페이지 좌측 사이드바. 위에서부터 프로필 카드 · 메뉴다(PRD 1 절, 목업
 * `docs/asset/v4 마이페이지/개인정보/image.png`). 목업의 셋째 조각인 광고 자리는 내용이 정해지지
 * 않아 빈 회색 상자만 보여서 그리지 않는다(2026-09-30, 사용자).
 *
 * **v5(기업 회원 마이페이지) 가 이 컴포넌트를 그대로 쓴다.** 그래서 메뉴 목록도 프로필 카드의
 * 값도 prop 이다 — 이 파일은 어떤 메뉴가 있는지, 이름 아래 무엇이 오는지 모른다.
 *
 * 현재 항목은 경로로 고른다. 정확히 같은 경로거나 그 아래 경로면 현재 항목이다 — 나중에
 * `/mypage/posts/new` 같은 하위 경로가 생겨도 `작성한 모집글` 이 계속 켜져 있어야 한다.
 *
 * 목업 실측값: 메뉴 한 줄 44px, 현재 항목만 `blue-50` 배경에 `blue-500` 글자, 나머지는
 * `gray-500`. 조각 사이 간격 28px.
 */
export function MyPageSidebar({ menuItems, ...profile }: MyPageSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex w-full shrink-0 flex-col gap-7 md:w-64">
      <MyPageProfileCard {...profile} />

      <nav aria-label="마이페이지 메뉴">
        <ul>
          {menuItems.map((item) => {
            const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center rounded-sm px-4 text-base',
                    current ? 'bg-blue-50 text-blue-500' : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
