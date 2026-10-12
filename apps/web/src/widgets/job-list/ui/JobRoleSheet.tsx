'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { httpClient } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { Button, CircleIconButton, cn } from '@ogonggo/ui';
import { JOB_FIELD_LABELS, JOB_ROLES, jobRolesOf } from '@/entities/job/model/labels';
import type { JobField, JobRole } from '@/entities/job/model/types';
import { track } from '@/shared/analytics/dataLayer';
import { JOB_MAJORS } from '@/widgets/job-calendar/lib/job-majors';
import { buildJobsApiUrl, type JobListQuery } from '../lib/query';
import { JOB_ROLE_CHIPS } from '../lib/roleChips';

/** 왼쪽 목록. 직무 칩에 있는 직군만, 칩 순서대로다. */
const JOB_FIELDS = JOB_ROLE_CHIPS.map(({ field }) => field);

/** 직군 아이콘. 공고 달력의 관심 직무 칸과 같은 그림을 쓴다. */
const FIELD_ICONS = new Map<string, string>(JOB_MAJORS.map(({ field, icon }) => [field, icon]));

/** 창에서 고르는 직무. `fields` 는 통째로 고른 직군이고 `roles` 는 하나씩 고른 직무다. */
export interface JobRoleSelection {
  fields: JobField[];
  roles: JobRole[];
}

/** 창 버튼의 `N개 공고보기`. 목록과 같은 필터에 고르는 중인 직무만 바꿔 건수만 받는다. */
async function fetchCount(
  query: JobListQuery,
  selection: JobRoleSelection,
): Promise<number | undefined> {
  const response = await httpClient<SuccessResponsePageResponseUserJobSummaryResponse>(
    buildJobsApiUrl(
      { ...query, page: 1, jobFields: selection.fields, jobRoles: selection.roles },
      1,
    ),
  );
  return response.data?.pageInfo.totalElements;
}

function trackChanges(filterType: string, before: string[], after: string[]) {
  for (const value of after.filter((item) => !before.includes(item))) {
    track('filter_apply', {
      filter_type: filterType,
      filter_value: value,
      filter_action: 'select',
    });
  }
  for (const value of before.filter((item) => !after.includes(item))) {
    track('filter_apply', {
      filter_type: filterType,
      filter_value: value,
      filter_action: 'deselect',
    });
  }
}

/**
 * 직무 선택 창. 직무 칩(`JobRoleChips`)의 직군 칩을 누르면 뜬다. 왼쪽에 직군, 오른쪽에 그 직군의
 * 직무 칩이 있고, 눌린 칩의 직군이 펼쳐진 채 열린다. 한 직군 안에서는 직무를 여러 개 고를 수 있고,
 * `전체` 는 그 직군을 통째로 고른다. 다른 직군에서 고르면 앞 직군의 선택은 지운다 — 직무 칩이 한 번에
 * 하나만 켜지게 한다(2026-10-12, 사용자).
 *
 * 창 안에서 고르는 것은 초안이다. `N개 공고보기` 를 눌러야 `onApply` 로 넘어가 주소가 바뀐다 —
 * 칩 하나마다 페이지를 다시 그리면 창이 닫히고 스크롤이 튄다. 건수는 초안이 바뀔 때마다 한 번
 * 받는다. 주소를 바꾸는 것은 부르는 쪽이다(`JobRoleChips`) — 사이드바의 미적용 선택을 합치는 일이
 * 거기 있다.
 *
 * 창은 공유 창(`features/share-posting/ui/SharePostingButton.tsx`)과 같은 틀이다. 데스크톱은
 * 가운데, 모바일은 아래에서 올라온다.
 */
export function JobRoleSheet({
  query,
  initial,
  initialField,
  onApply,
  onClose,
}: {
  query: JobListQuery;
  /** 지금 주소에 반영된 직무. `N개 공고보기` 를 누를 때 이것과 비교해 달라진 것만 이벤트로 보낸다. */
  initial: JobRoleSelection;
  /** 창을 열었을 때 오른쪽에 펼쳐 둘 직군. 누른 칩의 직군이다. */
  initialField: JobField;
  onApply: (selection: JobRoleSelection) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [selection, setSelection] = useState<JobRoleSelection>(initial);
  const [activeField, setActiveField] = useState<JobField>(initialField);
  const [count, setCount] = useState<number | undefined>();

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  // 칩을 빠르게 여러 번 누르면 요청이 쌓인다. 잠깐 멈췄을 때 한 번만 받고, 늦게 온 옛 응답은 버린다.
  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => {
      fetchCount(query, selection)
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
  }, [query, selection]);

  const roles = useMemo(() => jobRolesOf(activeField), [activeField]);
  const fieldSelected = selection.fields.includes(activeField);
  const empty = selection.fields.length === 0 && selection.roles.length === 0;

  // 직군을 통째로 고르면 다른 선택은 모두 지운다(한 직군만). 끄면 아무것도 고르지 않은 상태다.
  const toggleField = () =>
    setSelection(() =>
      fieldSelected ? { fields: [], roles: [] } : { fields: [activeField], roles: [] },
    );

  const toggleRole = (role: JobRole) =>
    setSelection(({ fields, roles: picked }) => {
      // 이 직군에서 고른 직무만 남긴다. 다른 직군의 선택과 이 직군의 `전체` 는 지운다.
      const sameField = fields.includes(activeField)
        ? []
        : picked.filter((item) => JOB_ROLES[item].field === activeField);
      return {
        fields: [],
        roles: sameField.includes(role)
          ? sameField.filter((item) => item !== role)
          : [...sameField, role],
      };
    });

  const apply = () => {
    trackChanges('job_field', initial.fields, selection.fields);
    trackChanges('job_role', initial.roles, selection.roles);
    onApply(selection);
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-role-filter-title"
        className="flex h-[85vh] w-full flex-col rounded-t-3xl bg-white md:h-[680px] md:w-[600px] md:rounded-3xl"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <p className="flex items-baseline gap-2">
            <span id="job-role-filter-title" className="text-xl font-bold text-gray-900">
              직무
            </span>
            <span className="text-sm text-gray-500">중복 선택 가능</span>
          </p>
          <CircleIconButton
            ref={closeRef}
            label="직무 선택 닫기"
            onClick={onClose}
            className="size-10 border border-gray-200 bg-white"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block h-5 w-5 text-gray-700" />
          </CircleIconButton>
        </div>

        <div className="flex min-h-0 flex-1">
          <ul className="w-32 shrink-0 overflow-y-auto border-r border-gray-100 px-3 pb-4 md:w-40">
            {JOB_FIELDS.map((field) => {
              // 직군을 통째로 골랐으면 `전체`, 아니면 그 직군에서 고른 직무 수다.
              const picked = selection.fields.includes(field)
                ? '전체'
                : selection.roles.filter((role) => JOB_ROLES[role].field === field).length || null;
              return (
                <li key={field}>
                  <button
                    type="button"
                    onClick={() => setActiveField(field)}
                    aria-current={field === activeField}
                    className={cn(
                      'flex w-full items-center justify-between gap-1 rounded-md px-3 py-3 text-left text-sm md:text-base',
                      field === activeField
                        ? 'bg-gray-100 font-semibold text-gray-900'
                        : 'text-gray-800 hover:bg-gray-50',
                    )}
                  >
                    <span className="break-keep">{JOB_FIELD_LABELS[field]}</span>
                    {picked ? (
                      <span className="text-xs font-semibold text-blue-500">{picked}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="min-w-0 flex-1 overflow-y-auto px-4 pb-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-400 text-white">
                <span
                  aria-hidden="true"
                  className={cn(FIELD_ICONS.get(activeField), 'block h-6 w-6')}
                />
              </span>
              <h3 className="text-lg font-bold text-gray-900">{JOB_FIELD_LABELS[activeField]}</h3>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <RoleChip label="전체" selected={fieldSelected} onClick={toggleField} />
              {roles.map((role) => (
                <RoleChip
                  key={role}
                  label={JOB_ROLES[role].label}
                  selected={!fieldSelected && selection.roles.includes(role)}
                  onClick={() => toggleRole(role)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button
            variant="ghost"
            disabled={empty}
            onClick={() => setSelection({ fields: [], roles: [] })}
            className="gap-1 bg-gray-100 disabled:bg-gray-100"
          >
            <span aria-hidden="true" className="icon-[lucide--rotate-cw] block h-4 w-4" />
            초기화
          </Button>
          <Button onClick={apply} className="min-w-40">
            {count === undefined ? '공고보기' : `${count.toLocaleString('ko-KR')}개 공고보기`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RoleChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'h-9 rounded-md border px-3 text-sm transition-colors',
        selected
          ? 'border-blue-500 bg-blue-50 font-semibold text-blue-500'
          : 'border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200',
      )}
    >
      {label}
    </button>
  );
}
