'use client';

import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@ogonggo/ui';
import { JOB_ROLES } from '@/entities/job/model/labels';
import type { JobField } from '@/entities/job/model/types';
import { rememberJobFilters } from '../lib/filterCookie';
import { pendingFilter, type RoleSelection } from '../lib/pendingFilter';
import { buildJobListHref, type JobListQuery } from '../lib/query';
import { JOB_ROLE_CHIPS } from '../lib/roleChips';
import { JobRoleSheet, type JobRoleSelection } from './JobRoleSheet';

/**
 * 목록 줄의 직무 칩 `전체 · 마케팅 · 인사 · 기획 · 세일즈 · 개발`. 새 주소 상태를 만들지 않고
 * `jobFields`·`jobRoles` 위에 올린다.
 *
 * 직군 칩을 누르면 바로 이동하지 않고 직무 창(`JobRoleSheet`)이 그 직군을 펼친 채 뜬다. 거기서
 * 세부 직무를 고르고 `N개 공고보기` 를 눌러야 주소가 바뀐다. `전체` 는 창 없이 직무 조건을 비운다.
 * 별도 `직무` 버튼은 없다 — 이 칩이 창의 유일한 입구다.
 *
 * 켜진 칩은 그 직군을 통째로 골랐거나 그 직군의 직무를 하나라도 고른 칩이다. 창은 한 번에 한 직군만
 * 고르게 하므로 칩도 하나만 켜진다(2026-10-12, 사용자). 칩에 없는 직군은 창에도 없다(`lib/roleChips.ts`).
 *
 * 이미 `전체` 인데 `전체` 를 다시 누르면 직무 조건이 그대로라 이벤트는 없다. 1쪽이면 아무 일도 없고,
 * 2쪽 이상이면 1쪽으로만 돌아간다 — 쪽이 바뀌므로 보이는 목록도 바뀐다. `filter_apply` 이벤트는
 * 창이 보낸다(`filter_type: 'job_field'`·`'job_role'`).
 */
export function JobRoleChips({ query }: { query: JobListQuery }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // 켜짐은 서버가 새 `query` 를 내려준 뒤에야 바뀐다. 그 사이 칩이 꺼져 보이면 다시 누르게 되므로
  // 이동 중에는 고른 값을 먼저 보인다. 이동이 끝나면 서버 값으로 돌아간다.
  const [shown, showOptimistically] = useOptimistic<JobRoleSelection>({
    fields: query.jobFields ?? [],
    roles: query.jobRoles ?? [],
  });
  const { fields, roles } = shown;
  const allOn = fields.length === 0 && roles.length === 0;
  // 열린 창이 펼쳐 둘 직군. 닫혀 있으면 `undefined` 다.
  const [sheetField, setSheetField] = useState<JobField | undefined>();
  const closeSheet = useCallback(() => setSheetField(undefined), []);

  // 이동이 끝나기 전에는 사이드바가 이 쪽 선택을 알아야 한다(`lib/pendingFilter.ts`). 진행 중 여부는
  // 렌더 값이라 타이머 안에서 읽을 수 있게 ref 에 옮겨 둔다.
  const lastMove = useRef<RoleSelection | undefined>(undefined);
  const movePending = useRef(false);
  useEffect(() => {
    movePending.current = isPending;
  });
  useEffect(() => {
    pendingFilter.roleInFlight = () => (movePending.current ? lastMove.current : undefined);
    return () => {
      pendingFilter.roleInFlight = () => undefined;
    };
  }, []);

  const move = (next: JobRoleSelection) => {
    const target: RoleSelection = {
      jobFields: next.fields.length > 0 ? next.fields : undefined,
      jobRoles: next.roles.length > 0 ? next.roles : undefined,
    };
    // 사이드바에 아직 주소로 안 나간 선택이 있으면 같이 실어 보낸다. 안 그러면 이 이동이 그 선택을 지운다.
    const unapplied = pendingFilter.takeSidebarDraft();
    lastMove.current = target;
    const href = buildJobListHref(query, { ...unapplied, ...target });
    rememberJobFilters(href);
    startTransition(() => {
      showOptimistically(next);
      router.push(href, { scroll: false });
    });
  };

  const pressAll = () => {
    // 이미 `전체` 인데 2쪽 이상이면 직무 조건은 그대로이므로 쪽만 1쪽으로 돌린다. 이동 중이면 이미 1쪽으로 가는 중이다.
    if (!allOn || (query.page > 1 && !isPending)) move({ fields: [], roles: [] });
  };

  // 고른 직군들. 직군을 통째로 골랐거나 그 직군의 직무를 하나라도 골랐으면 담긴다.
  const selectedFields = new Set([...fields, ...roles.map((role) => JOB_ROLES[role].field)]);

  return (
    <>
      {/* 한 줄에 안 들어가면 줄바꿈이 아니라 가로로 넘긴다. 안쪽 여백은 맨 끝 칩의 포커스 링이 잘리지
          않게 하는 것이고, 음수 바깥 여백으로 되돌린다(`MobileSiteHeader` 의 가로 넘김과 같다). */}
      <div
        role="group"
        aria-label="직무"
        className="-my-1 -ml-1 flex w-full min-w-0 items-center gap-2 overflow-x-auto p-1 whitespace-nowrap [scrollbar-width:none] lg:w-auto [&::-webkit-scrollbar]:hidden"
      >
        <RoleChip label="전체" active={allOn} onSelect={pressAll} />
        {JOB_ROLE_CHIPS.map(({ label, field }) => (
          <RoleChip
            key={field}
            label={label}
            active={selectedFields.has(field)}
            haspopup
            onSelect={() => setSheetField(field)}
          />
        ))}
      </div>
      {sheetField ? (
        <JobRoleSheet
          query={query}
          initial={shown}
          initialField={sheetField}
          onApply={move}
          onClose={closeSheet}
        />
      ) : null}
    </>
  );
}

/** 알약 하나. 모양은 `PopularJobsTabs` 의 탭 알약과 같고, 꺼짐은 시안대로 흰 바탕이다. */
function RoleChip({
  label,
  active,
  haspopup = false,
  onSelect,
}: {
  label: string;
  active: boolean;
  /** 누르면 창이 뜨는 칩이다. */
  haspopup?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-haspopup={haspopup ? 'dialog' : undefined}
      onClick={onSelect}
      className={cn(
        'inline-flex h-7 shrink-0 cursor-pointer items-center rounded-full border px-3 text-sm font-medium transition-colors',
        active
          ? 'border-blue-500 bg-blue-500 text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800',
      )}
    >
      {label}
    </button>
  );
}
