import Link from 'next/link';
import { cn, MenuItem } from '@ogonggo/ui';
import { SortToggle, type SortOption } from '@/shared/ui/SortToggle';
import {
  BOOTCAMP_TABS,
  buildBootcampListHref,
  type BootcampListQuery,
  type BootcampSort,
  type BootcampTab,
} from '../lib/query';

/** API 없음: 탭 네 개는 목록 API에 대응 파라미터가 없다 — 매핑은 `lib/query.ts` 참고. */
const TAB_LABELS: Record<BootcampTab, string> = {
  all: '전체',
  bootcamp: '부트캠프',
  government: '국비지원',
  free: '무료특강',
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
 * `교육부트캠프.png`의 카드 그리드 바로 위 한 줄 — 왼쪽에 탭 네 개, 오른쪽에 `모집 중만`
 * 토글과 정렬 드롭다운. 자바스크립트 없이 전부 URL 쿼리 파라미터를 바꾸는 `<Link>`다
 * (채용공고 목록의 필터와 같은 방식).
 *
 * 탭 글자는 `MenuItem`이 그린다(`docs/asset/v3-1/menu/`). 현재 탭에 **밑줄이 생기는 것이
 * 이번 변화**다 — 전에는 굵은 진한 글자뿐이었다(PRD 5절). 굵기는 상태에 따라 변하지 않고
 * 색만 진해진다. `<Link>`로 감싸는 것은 여기가 한다(`packages/ui`는 `next/link`를 모른다).
 *
 * 글자 크기만 `text-lg`로 덮어쓴다. 컴포넌트 기본값은 16px인데 목록 탭은 18px이고, 목업
 * (`docs/asset/v3 변경사항/사이드 스터디 디자인변경.png`)을 재면 오히려 20px 쪽이다. 근거는
 * `.claude/tasks/memos/결정-menuitem-글자크기-2026-09-21.md`.
 *
 * `모집 중만` 알약은 `filter/`의 선택됨과 닮았지만 드롭다운이 아니라 토글이고 에셋에 대응하는
 * 그림이 없어 그대로 둔다(PRD 5절).
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
      <div className="flex items-center gap-2">
        {/* API 없음: `모집 중만`에 해당하는 파라미터가 목록 API에 없다. MSW에서만
            `status=RECRUITING`으로 걸러진다(PRD 2절). */}
        <Link
          href={buildBootcampListHref(query, { openOnly: !query.openOnly })}
          aria-pressed={query.openOnly}
          className={cn(
            'flex h-9 items-center rounded-full border px-3 text-sm font-medium',
            query.openOnly
              ? 'border-blue-500 bg-blue-50 text-blue-600'
              : 'border-gray-200 bg-white text-gray-600',
          )}
        >
          모집 중만
        </Link>
        <SortToggle
          options={SORT_OPTIONS}
          current={query.sort}
          buildHref={(sort) => buildBootcampListHref(query, { sort })}
        />
      </div>
    </div>
  );
}
