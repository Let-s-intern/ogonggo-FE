'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@ogonggo/ui';
import { SearchCommand } from '@/features/search-command';
import { rememberJobFilters } from '../lib/filterCookie';
import {
  clearSelection,
  FILTER_GROUPS,
  isSelectionEmpty,
  selectionOf,
  toggleSelection,
  trackFilterSelected,
  type FilterKey,
  type FilterSelection,
} from '../lib/filter';
import { buildJobListHref, KEYWORD_MIN_LENGTH, type JobListQuery } from '../lib/query';
import { pendingFilter } from '../lib/pendingFilter';
import { FilterCheckGroup } from './FilterCheckGroup';
import { FilterChipGroup } from './FilterChipGroup';

/** 체크박스를 연달아 누르는 동안은 주소를 바꾸지 않고, 멈춘 뒤 한 번만 바꾼다. */
const DEBOUNCE_MS = 300;

interface SidebarState extends FilterSelection {
  q: string | undefined;
}

/**
 * PC(lg 이상) 왼쪽 필터. 검색창, 채용 형태, 요구 경력, 지역, 필터 초기화.
 *
 * 체크 상태는 누르는 즉시 바뀌고, 주소는 300ms 멈춘 뒤 한 번만 바뀐다. 누를 때마다 주소를 바꾸면 홈
 * 전체(인기 공고 요청 포함)가 서버에서 다시 그려져 연달아 누르기가 느리다. 그래서 체크박스는 링크가
 * 아니라 입력이다 — 필터 조합이 전부 크롤 가능한 주소가 되는 것도 피한다.
 *
 * 주소가 따라잡기 전까지 `draft` 가 화면 값이다. 요청이 끝나면(`isPending` 이 꺼지면) 비우고 주소의
 * 값을 그대로 보인다 — 실패해도 주소가 진실이다. 요청 중에 더 누른 값이 옛 응답에 덮이지 않는다.
 */
export function JobFilterSidebar({ query }: { query: JobListQuery }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<SidebarState | null>(null);
  const applied: SidebarState = { ...selectionOf(query), q: query.q };
  const view = draft ?? applied;

  // 타이머와 요청 중 여부는 렌더와 무관해야 해서 ref 에 둔다. 타이머 안에서 읽을 때 옛 값이면 안 된다.
  const timer = useRef<number | undefined>(undefined);
  const latestQuery = useRef(query);
  const pending = useRef(false);
  const draftRef = useRef<SidebarState | null>(null);
  useEffect(() => {
    latestQuery.current = query;
    pending.current = isPending;
    draftRef.current = draft;
  });

  // `query` 도 본다. 직무 칩이 이 쪽의 미적용 선택을 가져가 이동하면 타이머가 취소돼 `isPending` 도
  // `draft` 도 그대로인 채 주소만 바뀐다. 그때 남은 `draft` 가 뒤로 가기 같은 바깥 변경을 가리지 않게 한다.
  useEffect(() => {
    if (!isPending && timer.current === undefined) {
      setDraft(null);
    }
  }, [isPending, draft, query]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // 직무 칩이 이동하기 전에 이 쪽의 미적용 선택을 가져가 자기 주소에 합친다(`lib/pendingFilter.ts`).
  // 합친 이동이 이 쪽 몫까지 하므로 대기 중인 타이머는 취소한다.
  useEffect(() => {
    pendingFilter.takeSidebarDraft = () => {
      const unapplied = draftRef.current;
      if (unapplied) {
        window.clearTimeout(timer.current);
        timer.current = undefined;
      }
      return unapplied;
    };
    return () => {
      pendingFilter.takeSidebarDraft = () => null;
    };
  }, []);

  const cancelTimer = () => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  };

  /**
   * 필터를 주소로 옮긴다. 쪽은 1쪽으로 돌아가고, 필터가 그대로면 가지 않는다 — 2쪽 이상에서도
   * 바뀐 것이 없는 조작이 1쪽으로 보내서는 안 된다.
   */
  const go = (next: SidebarState, reset: Partial<JobListQuery> = {}) => {
    // 칩 이동이 끝나기 전이면 칩이 고른 직무를 얹는다. 옛 `query` 만 쓰면 이 이동이 칩 선택을 지운다.
    const base = { ...latestQuery.current, ...pendingFilter.roleInFlight() };
    const href = buildJobListHref(base, {
      employmentTypes: next.employmentTypes,
      experienceTypes: next.experienceTypes,
      regions: next.regions,
      q: next.q,
      ...reset,
    });
    if (href === buildJobListHref(base) && !pending.current) {
      setDraft(null);
      return;
    }
    rememberJobFilters(href);
    startTransition(() => router.push(href, { scroll: false }));
  };

  const goLater = (next: SidebarState) => {
    cancelTimer();
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      go(next);
    }, DEBOUNCE_MS);
  };

  const change = (next: SidebarState) => {
    setDraft(next);
    goLater(next);
  };

  const toggle = (key: FilterKey, value: string) => {
    const current: readonly string[] = view[key];
    if (!current.includes(value)) {
      trackFilterSelected(FILTER_GROUPS[key].filterType, value);
    }
    change(toggleSelection(view, key, value));
  };

  const search = (text: string | undefined) => {
    const next = { ...view, q: text && text.length >= KEYWORD_MIN_LENGTH ? text : undefined };
    cancelTimer();
    setDraft(next);
    go(next);
  };

  const reset = () => {
    cancelTimer();
    setDraft({ employmentTypes: [], experienceTypes: [], regions: [], q: undefined });
    go(
      { employmentTypes: [], experienceTypes: [], regions: [], q: undefined },
      { jobFields: undefined, jobRoles: undefined },
    );
  };

  const hasFilters =
    !isSelectionEmpty(view) ||
    view.q !== undefined ||
    (query.jobFields?.length ?? 0) > 0 ||
    (query.jobRoles?.length ?? 0) > 0;

  return (
    <aside aria-label="공고 필터" className="flex flex-col gap-6">
      <SearchCommand scope="jobs" value={view.q} onSearch={search} />

      {(['employmentTypes', 'experienceTypes'] as const).map((key) => (
        <FilterCheckGroup
          key={key}
          group={FILTER_GROUPS[key]}
          selected={view[key]}
          onToggle={(value) => toggle(key, value)}
          onClear={() => change(clearSelection(view, key))}
        />
      ))}

      <FilterChipGroup
        group={FILTER_GROUPS.regions}
        // `전체` 와 앞쪽 5개가 3열 두 줄이다. 나머지는 `펼치기` 로 본다.
        collapsedCount={5}
        selected={view.regions}
        onSelect={(value) => toggle('regions', value)}
        onClear={() => change(clearSelection(view, 'regions'))}
      />

      <Button
        variant="secondary"
        size="sm"
        disabled={!hasFilters}
        onClick={reset}
        className="w-full gap-1 rounded-full border-gray-200 text-gray-500"
      >
        <span aria-hidden="true" className="icon-[lucide--rotate-cw] block h-4 w-4" />
        필터 초기화
      </Button>
    </aside>
  );
}
