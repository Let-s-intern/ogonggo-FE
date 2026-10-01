import Link from 'next/link';
import { MenuItem, SearchInput } from '@ogonggo/ui';
import { SortToggle, type SortOption } from '@/shared/ui/SortToggle';
import {
  BOOTCAMP_TABS,
  buildBootcampListHref,
  type BootcampListQuery,
  type BootcampSort,
  type BootcampTab,
} from '../lib/query';

/** 탭이 보내는 `category`는 `lib/query.ts`의 `TAB_CATEGORIES`에 있다. */
const TAB_LABELS: Record<BootcampTab, string> = {
  all: '전체',
  bootcamp: '부트캠프',
  sesac: '새싹',
};

/** 목업 우측의 `최신순 ▾` 드롭다운. `listPublicBootcamps`의 `sort`에 대응한다. */
const SORT_OPTIONS: SortOption<BootcampSort>[] = [
  { value: 'LATEST', label: '최신순' },
  { value: 'VIEW_COUNT', label: '조회순' },
];

export interface BootcampListControlsProps {
  query: BootcampListQuery;
}

/**
 * `교육부트캠프.png`의 카드 그리드 바로 위 한 줄 — 왼쪽에 탭 세 개, 오른쪽에 검색칸과 정렬
 * 드롭다운. 탭과 정렬은 자바스크립트 없이 URL 쿼리 파라미터를 바꾸는 `<Link>`다(채용공고 목록의
 * 필터와 같은 방식).
 *
 * 검색어는 자유 텍스트라 `<Link>`로는 못 만들어 `<form method="GET">`이다. 채용공고 목록의
 * `SearchFilterBar`와 같은 방식이다 — 탭·정렬은 숨은 칸으로 들고 가고, 제출 버튼은 `sr-only`다.
 *
 * 탭 글자는 `MenuItem`이 그린다(`docs/asset/v3-1/menu/`). 현재 탭에 **밑줄이 생기는 것이
 * 이번 변화**다 — 전에는 굵은 진한 글자뿐이었다(PRD 5절). 굵기는 상태에 따라 변하지 않고
 * 색만 진해진다. `<Link>`로 감싸는 것은 여기가 한다(`packages/ui`는 `next/link`를 모른다).
 *
 * 글자 크기만 `text-lg`로 덮어쓴다. 컴포넌트 기본값은 16px인데 목록 탭은 18px이고, 목업
 * (`docs/asset/v3 변경사항/사이드 스터디 디자인변경.png`)을 재면 오히려 20px 쪽이다. 근거는
 * `.claude/tasks/memos/결정-menuitem-글자크기-2026-09-21.md`.
 */
export function BootcampListControls({ query }: BootcampListControlsProps) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-4">
      <nav className="flex items-center gap-5" aria-label="교육 유형">
        {BOOTCAMP_TABS.map((tab) => (
          <Link
            key={tab}
            href={buildBootcampListHref(query, { tab })}
            aria-current={tab === query.tab ? 'page' : undefined}
          >
            <MenuItem state={tab === query.tab ? 'current' : 'default'} className="text-lg">
              {TAB_LABELS[tab]}
            </MenuItem>
          </Link>
        ))}
      </nav>
      <div className="flex w-full items-center gap-2 md:w-auto">
        <form action="/bootcamps" method="GET" className="flex-1 md:w-60 md:flex-none">
          {query.tab !== 'all' ? <input type="hidden" name="tab" value={query.tab} /> : null}
          {query.sort !== 'LATEST' ? <input type="hidden" name="sort" value={query.sort} /> : null}
          <SearchInput name="q" defaultValue={query.q} placeholder="부트캠프 검색" />
          <button type="submit" className="sr-only">
            검색
          </button>
        </form>
        <SortToggle
          options={SORT_OPTIONS}
          current={query.sort}
          buildHref={(sort) => buildBootcampListHref(query, { sort })}
        />
      </div>
    </div>
  );
}
