'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, SearchInput } from '@ogonggo/ui';
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
import {
  buildJobListHref,
  KEYWORD_MAX_LENGTH,
  KEYWORD_MIN_LENGTH,
  type JobListQuery,
} from '../lib/query';
import { pendingFilter } from '../lib/pendingFilter';
import { FilterCheckGroup } from './FilterCheckGroup';
import { FilterChipGroup } from './FilterChipGroup';

/** 체크박스를 연달아 누르는 동안은 주소를 바꾸지 않고, 멈춘 뒤 한 번만 바꾼다. */
const DEBOUNCE_MS = 300;

/**
 * 검색 입력칸의 값을 직접 쓴다. 칸은 비제어라 주소가 바뀌어도 따라가지 않는다. `key` 로 새로 만들면
 * 제출할 때마다 초점을 잃으므로 칸은 그대로 두고 값만 맞춘다.
 */
function writeKeyword(form: HTMLFormElement | null, value: string) {
  const input = form?.elements.namedItem('q');
  if (input instanceof HTMLInputElement) {
    input.value = value;
  }
}

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
  const formRef = useRef<HTMLFormElement>(null);
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

  // 뒤로 가기처럼 주소의 검색어가 밖에서 바뀌면 입력칸도 그 값으로 맞춘다.
  useEffect(() => {
    writeKeyword(formRef.current, query.q ?? '');
  }, [query.q]);

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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    const next = { ...view, q: text.length >= KEYWORD_MIN_LENGTH ? text : undefined };
    cancelTimer();
    setDraft(next);
    go(next);
  };

  const reset = () => {
    cancelTimer();
    writeKeyword(formRef.current, '');
    setDraft({ employmentTypes: [], experienceTypes: [], regions: [], q: undefined });
    go(
      { employmentTypes: [], experienceTypes: [], regions: [], q: undefined },
      { jobFields: undefined, jobRoles: undefined },
    );
  };

  // 검색 form 이 실어 보낼 나머지 상태. 주소를 되읽어 만들어서 필터가 늘어도 빠지지 않는다. 스크립트가
  // 켜지기 전에 제출해도 걸어 둔 필터가 풀리지 않게 하는 용도다.
  const carried = new URLSearchParams(
    buildJobListHref(query, { ...view, q: undefined }).split('?')[1] ?? '',
  );
  const hasFilters =
    !isSelectionEmpty(view) ||
    view.q !== undefined ||
    (query.jobFields?.length ?? 0) > 0 ||
    (query.jobRoles?.length ?? 0) > 0;

  return (
    <aside aria-label="공고 필터" className="flex flex-col gap-6">
      <form ref={formRef} action="/" method="GET" onSubmit={submit}>
        {[...carried].map(([name, value]) => (
          <input key={`${name}=${value}`} type="hidden" name={name} value={value} />
        ))}
        <SearchInput
          name="q"
          defaultValue={view.q}
          placeholder="공고 검색"
          aria-label="공고 검색"
          minLength={KEYWORD_MIN_LENGTH}
          maxLength={KEYWORD_MAX_LENGTH}
        />
        <button type="submit" className="sr-only">
          검색
        </button>
      </form>

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
