import Link from 'next/link';
import { cn } from '@ogonggo/ui';

export interface MyPageListTab<TValue extends string> {
  value: TValue;
  label: string;
  /** 탭 글자 뒤 건수. 셀 곳이 없는 탭은 넘기지 않는다 — 0 과 "모름" 은 다른 말이다. */
  count?: number;
}

export interface MyPageListTabsProps<TValue extends string> {
  items: readonly MyPageListTab<TValue>[];
  current: TValue;
  buildHref: (value: TValue) => string;
  'aria-label': string;
  /**
   * `underline`(기본)은 파란 밑줄 탭, `segment` 는 회색 바탕 안의 흰 칸이다. v11 에서
   * `지원 · 신청 관리` 의 종류 탭이 `segment` 로 바뀌었다 — 바로 위에 마이페이지 상단 탭
   * (`MyPageTabs`)이 밑줄 모양으로 생겨서, 같은 모양이 두 줄 겹치지 않게 한 것이다.
   */
  variant?: 'underline' | 'segment';
}

/**
 * 마이페이지 표 위의 탭 줄(목업 `docs/asset/v4 마이페이지/지원 신청내역/`).
 *
 * `@ogonggo/ui` 의 `Tabs` 를 쓰지 않는다. 그쪽은 `onValueChange` 로 상태를 올리는 버튼이고
 * 칸이 폭을 똑같이 나누는데, 이 줄은 왼쪽에 몰린 링크 넷이고 탭이 URL(`?tab=`) 에 있다.
 * `MenuItem` 도 아니다 — 목업의 현재 탭은 파란 글자에 파란 밑줄이고 `MenuItem` 의 `current`
 * 는 검정 글자에 검정 밑줄이다.
 *
 * 밑줄은 고르지 않은 탭에도 투명하게 깔아 둔다. 없으면 탭을 옮길 때 글자가 2px 씩 위아래로
 * 움직인다(`MenuItem` 주석의 같은 이야기).
 */
export function MyPageListTabs<TValue extends string>({
  items,
  current,
  buildHref,
  'aria-label': ariaLabel,
  variant = 'underline',
}: MyPageListTabsProps<TValue>) {
  if (variant === 'segment') {
    return (
      // 모바일은 셋이 폭을 똑같이 나누고 글자를 줄인다. 데스크톱 크기 그대로면 `채용 공고`가
      // 두 줄로 꺾인다.
      <nav
        aria-label={ariaLabel}
        className="flex w-full items-center rounded-lg bg-gray-100 p-1 md:w-fit"
      >
        {items.map((item) => {
          const selected = item.value === current;
          return (
            <Link
              key={item.value}
              href={buildHref(item.value)}
              aria-current={selected ? 'page' : undefined}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm whitespace-nowrap md:flex-none md:px-4 md:text-lg',
                selected
                  ? 'bg-white font-bold text-gray-900 shadow-sm'
                  : 'font-medium text-gray-400 hover:text-gray-600',
              )}
            >
              {item.label}
              {item.count === undefined ? null : <span>{item.count}</span>}
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <nav aria-label={ariaLabel} className="flex items-center gap-8 border-b border-gray-100">
      {items.map((item) => {
        const selected = item.value === current;
        return (
          <Link
            key={item.value}
            href={buildHref(item.value)}
            aria-current={selected ? 'page' : undefined}
            className={cn(
              'flex items-center gap-1.5 border-b-2 pb-3 text-lg',
              selected
                ? 'border-blue-500 font-bold text-blue-500'
                : 'border-transparent font-medium text-gray-400 hover:text-gray-600',
            )}
          >
            {item.label}
            {item.count === undefined ? null : <span>{item.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
