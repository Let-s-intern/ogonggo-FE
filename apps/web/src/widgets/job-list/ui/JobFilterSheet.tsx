'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { httpClient } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { Button, CircleIconButton, cn, Tabs, type TabItem } from '@ogonggo/ui';
import { useScrollLock } from '@/shared/lib/useScrollLock';
import {
  clearSelection,
  FILTER_GROUPS,
  isSameSelection,
  isSelectionEmpty,
  selectionOf,
  toggleSelection,
  trackAddedSelections,
  type FilterKey,
  type FilterSelection,
} from '../lib/filter';
import { rememberJobFilters } from '../lib/filterCookie';
import { buildJobListHref, buildJobsApiUrl, type JobListQuery } from '../lib/query';
import { FilterCheckGroup } from './FilterCheckGroup';
import { FilterChipGroup } from './FilterChipGroup';

const TABS: TabItem<FilterKey>[] = [
  { value: 'experienceTypes', label: FILTER_GROUPS.experienceTypes.label },
  { value: 'employmentTypes', label: FILTER_GROUPS.employmentTypes.label },
  { value: 'regions', label: FILTER_GROUPS.regions.label },
];

/** 시트의 `N개 공고보기`. 목록과 같은 필터에 고르는 중인 값만 바꿔 건수만 받는다. */
async function fetchCount(
  query: JobListQuery,
  selection: FilterSelection,
): Promise<number | undefined> {
  const response = await httpClient<SuccessResponsePageResponseUserJobSummaryResponse>(
    buildJobsApiUrl({ ...query, page: 1, ...selection }, 1),
  );
  return response.data?.pageInfo.totalElements;
}

/**
 * lg 미만의 `필터` 버튼. 누르면 채용 형태·요구 경력을 고르는 시트가 열린다. 고른 값이 있으면 개수를
 * 달고 파랗게 켜진다.
 *
 * 직무는 시트 안으로 옮기지 않았다. 직군·직무 선택 창(`JobRoleSheet`)은 위의 직무 칩(`JobRoleChips`)이
 * 연다.
 */
export function JobFilterButton({
  query,
  totalCount,
}: {
  query: JobListQuery;
  /** 지금 목록의 전체 건수. 시트를 열 때 `N개 공고보기` 의 첫 값이다. */
  totalCount: number;
}) {
  const [open, setOpen] = useState(false);
  const applied = selectionOf(query);
  const count =
    applied.employmentTypes.length + applied.experienceTypes.length + applied.regions.length;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-9 cursor-pointer items-center gap-1 rounded-full border px-4 text-sm font-normal transition-colors lg:hidden',
          count > 0
            ? 'border-transparent bg-blue-50 font-semibold text-blue-500 hover:bg-blue-100'
            : 'border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-500',
        )}
      >
        <span aria-hidden="true" className="icon-[lucide--sliders-horizontal] block h-4 w-4" />
        {count > 0 ? `필터 ${count}` : '필터'}
      </button>
      {open ? (
        <JobFilterSheet query={query} totalCount={totalCount} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

/**
 * 아래에서 올라오는 시트(데스크톱 폭에서는 가운데 창). 탭은 `요구 경력`, `채용 형태`, `지역`이다.
 *
 * 시트 안에서 고르는 것은 초안이다. `공고보기` 를 눌러야 주소가 바뀐다 — 값 하나마다 페이지를 다시
 * 그리면 시트가 닫힌다. `초기화` 는 초안만 비운다. 건수는 초안이 바뀔 때마다 한 번 받는다
 * (`JobRoleSheet` 와 같은 방식). 닫으면 초안은 버려지고 다음에 열면 주소의 값에서 다시 시작한다.
 *
 * PC 사이드바(`JobFilterSidebar`)와 같은 체크박스 묶음(`FilterCheckGroup`)·같은 선택 규칙
 * (`lib/filter.ts`)·같은 주소 만들기(`buildJobListHref`)를 쓴다.
 */
function JobFilterSheet({
  query,
  totalCount,
  onClose,
}: {
  query: JobListQuery;
  totalCount: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [initial] = useState(() => selectionOf(query));
  const [draft, setDraft] = useState<FilterSelection>(initial);
  const [tab, setTab] = useState<FilterKey>('experienceTypes');
  const [count, setCount] = useState<number | undefined>(totalCount);
  const unchanged = isSameSelection(draft, initial);

  useScrollLock(true);

  // 열면 초점을 닫기 버튼으로 옮기고, 닫으면 시트를 연 버튼으로 돌려 놓는다. 부모가 다시 그려져
  // `onClose` 가 바뀌어도 되돌리지 않도록 아래 키 입력 효과와 나눴다.
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  // `aria-modal` 은 보조기술에게 뒤쪽을 숨기라고 알릴 뿐 Tab 이 창 밖으로 나가는 것을 막지 않는다.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable?.item(0);
      const last = focusable?.item(focusable.length - 1);
      if (!first || !last) return;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current?.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // 값을 빠르게 여러 번 누르면 요청이 쌓인다. 잠깐 멈췄을 때 한 번만 받고, 늦게 온 옛 응답은 버린다.
  // 초안이 열 때와 같으면 목록이 이미 가진 건수를 그대로 쓴다.
  useEffect(() => {
    if (unchanged) {
      setCount(totalCount);
      return;
    }
    // 새 건수가 오기 전까지 옛 초안의 건수가 남지 않게 먼저 비운다.
    setCount(undefined);
    let current = true;
    const timer = window.setTimeout(() => {
      fetchCount(query, draft)
        .then((total) => {
          if (current) setCount(total);
        })
        .catch(() => {
          if (current) setCount(undefined);
        });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [query, draft, unchanged, totalCount]);

  const apply = () => {
    if (!unchanged) {
      trackAddedSelections(initial, draft);
      const href = buildJobListHref(query, draft);
      rememberJobFilters(href);
      router.push(href, { scroll: false });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-gray-950/50 md:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-filter-title"
        className="flex h-[75dvh] max-h-[640px] w-full flex-col rounded-t-3xl bg-white md:w-[480px] md:rounded-3xl"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <span id="job-filter-title" className="text-xl font-bold text-gray-900">
            필터
          </span>
          <CircleIconButton
            ref={closeRef}
            label="필터 닫기"
            onClick={onClose}
            className="size-10 border border-gray-200 bg-white"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block h-5 w-5 text-gray-700" />
          </CircleIconButton>
        </div>

        <Tabs
          items={TABS}
          value={tab}
          onValueChange={setTab}
          aria-label="필터 종류"
          className="px-6"
        />

        <div
          role="tabpanel"
          aria-label={FILTER_GROUPS[tab].label}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5"
        >
          {FILTER_GROUPS[tab].single ? (
            <FilterChipGroup
              key={tab}
              group={FILTER_GROUPS[tab]}
              columnsClassName="grid-cols-4"
              hideLabel
              selected={draft[tab]}
              onSelect={(value) => setDraft((current) => toggleSelection(current, tab, value))}
              onClear={() => setDraft((current) => clearSelection(current, tab))}
            />
          ) : (
            <FilterCheckGroup
              key={tab}
              group={FILTER_GROUPS[tab]}
              hideLabel
              selected={draft[tab]}
              onToggle={(value) => setDraft((current) => toggleSelection(current, tab, value))}
              onClear={() => setDraft((current) => clearSelection(current, tab))}
            />
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            disabled={isSelectionEmpty(draft)}
            onClick={() => setDraft({ employmentTypes: [], experienceTypes: [], regions: [] })}
            className="gap-1 bg-gray-100 disabled:bg-gray-100"
          >
            <span aria-hidden="true" className="icon-[lucide--rotate-cw] block h-4 w-4" />
            초기화
          </Button>
          <Button
            variant="secondary"
            onClick={apply}
            className="min-w-40 border-blue-500 bg-white text-blue-500 hover:bg-blue-50"
          >
            {count === undefined ? '공고보기' : `${count.toLocaleString('ko-KR')}개 공고보기`}
          </Button>
        </div>
      </div>
    </div>
  );
}
