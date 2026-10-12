'use client';

import { useEffect, useOptimistic, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@ogonggo/ui';
import type { JobField } from '@/entities/job/model/types';
import { track } from '@/shared/analytics/dataLayer';
import { pendingFilter, type RoleSelection } from '../lib/pendingFilter';
import { buildJobListHref, type JobListQuery } from '../lib/query';

/**
 * 칩과 직군의 대응. 시안(`docs/asset/v12 채용공고 상세/목록.webp`)에는 칩 이름만 있고 어느 직군인지
 * 적혀 있지 않아 PRD(`prd-v12-home-list.md`) 결정 4 의 제안을 그대로 둔다. 바뀌면 이 상수만 고친다.
 */
const JOB_ROLE_CHIPS: { label: string; field: JobField }[] = [
  { label: '마케팅', field: 'MARKETING_ADVERTISING' },
  { label: '인사', field: 'HR_GENERAL_AFFAIRS' },
  { label: '기획', field: 'PLANNING_STRATEGY' },
  { label: '세일즈', field: 'SALES' },
  { label: '개발', field: 'IT_DEVELOPMENT' },
];

/**
 * 목록 줄의 직무 칩 `전체 · 마케팅 · 인사 · 기획 · 세일즈 · 개발`(md 이상). 새 주소 상태를 만들지
 * 않고 `직무` 창이 쓰는 `jobFields`·`jobRoles` 위에 올린다.
 *
 * 칩 하나를 누르면 `jobFields` 를 그 직군 하나로 바꾸고 `jobRoles` 는 비운다. `전체` 는 둘 다
 * 비운다. 켜진 칩은 `jobFields` 가 정확히 그 직군 하나이고 `jobRoles` 가 비어 있을 때다 — `직무`
 * 창에서 직군을 둘 이상 고르거나 세부 직무를 고르면 칩은 모두 꺼지고, 그 선택은 `직무` 버튼이 보인다.
 *
 * 이미 켜진 칩을 다시 누르면 직무 조건이 그대로라 이벤트는 없다. 1쪽이면 아무 일도 없고, 2쪽
 * 이상이면 이벤트 없이 1쪽으로만 돌아간다 — 쪽이 바뀌므로 보이는 목록도 바뀐다. 이벤트는 기존
 * `직무` 창과 같은 `filter_apply`(`filter_type: 'job_field'`)이고, 해제인 `전체` 는 보내지 않는다.
 */
export function JobRoleChips({ query }: { query: JobListQuery }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // 켜짐은 서버가 새 `query` 를 내려준 뒤에야 바뀐다. 그 사이 눌린 칩이 꺼져 보이면 다시 누르게 되므로
  // 이동 중에는 누른 칩을 먼저 켜 보인다. 이동이 끝나면 서버 값으로 돌아간다.
  const [shown, showOptimistically] = useOptimistic({
    fields: query.jobFields ?? [],
    roles: query.jobRoles ?? [],
  });
  const fields = shown.fields;
  const roles = shown.roles;
  const allOn = fields.length === 0 && roles.length === 0;

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

  const move = (field: JobField | undefined, announce: boolean) => {
    if (announce && field) {
      track('filter_apply', {
        filter_type: 'job_field',
        filter_value: field,
        filter_action: 'select',
      });
    }
    const next: RoleSelection = { jobFields: field ? [field] : undefined, jobRoles: undefined };
    // 사이드바에 아직 주소로 안 나간 선택이 있으면 같이 실어 보낸다. 안 그러면 이 이동이 그 선택을 지운다.
    const unapplied = pendingFilter.takeSidebarDraft();
    lastMove.current = next;
    startTransition(() => {
      showOptimistically({ fields: field ? [field] : [], roles: [] });
      router.push(buildJobListHref(query, { ...unapplied, ...next }), { scroll: false });
    });
  };

  const press = (field: JobField | undefined, active: boolean) => {
    if (!active) {
      move(field, true);
    } else if (query.page > 1 && !isPending) {
      // 직무 조건은 그대로이므로 이벤트 없이 쪽만 1쪽으로 돌린다. 이동 중이면 이미 1쪽으로 가는 중이다.
      move(field, false);
    }
  };

  return (
    // 한 줄에 안 들어가면 줄바꿈이 아니라 가로로 넘긴다. 안쪽 여백은 맨 끝 칩의 포커스 링이 잘리지
    // 않게 하는 것이고, 음수 바깥 여백으로 되돌린다(`MobileSiteHeader` 의 가로 넘김과 같다).
    <div
      role="group"
      aria-label="직무"
      className="-my-1 -ml-1 hidden min-w-0 items-center gap-2 overflow-x-auto p-1 whitespace-nowrap [scrollbar-width:none] md:flex md:w-full lg:w-auto [&::-webkit-scrollbar]:hidden"
    >
      <RoleChip label="전체" active={allOn} onSelect={() => press(undefined, allOn)} />
      {JOB_ROLE_CHIPS.map(({ label, field }) => {
        const active = fields.length === 1 && fields[0] === field && roles.length === 0;
        return (
          <RoleChip
            key={field}
            label={label}
            active={active}
            onSelect={() => press(field, active)}
          />
        );
      })}
    </div>
  );
}

/** 알약 하나. 모양은 `PopularJobsTabs` 의 탭 알약과 같고, 꺼짐은 시안대로 흰 바탕이다. */
function RoleChip({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
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
