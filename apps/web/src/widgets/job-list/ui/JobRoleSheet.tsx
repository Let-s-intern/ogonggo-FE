'use client';

import { useEffect, useRef, useState } from 'react';
import { httpClient } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserJobSummaryResponse } from '@ogonggo/api';
import { Button, Checkbox, CircleIconButton, cn } from '@ogonggo/ui';
import { JOB_FIELD_LABELS, JOB_ROLES } from '@/entities/job/model/labels';
import type { JobField, JobRole } from '@/entities/job/model/types';
import { track } from '@/shared/analytics/dataLayer';
import { JOB_MAJORS } from '@/widgets/job-calendar/lib/job-majors';
import { buildJobsApiUrl, type JobListQuery } from '../lib/query';
import { jobRoleGroupsOf, type JobRoleGroup } from '../lib/roleGroups';
import { JOB_ROLE_CHIPS } from '../lib/roleChips';

/** 창의 직군 목록. 직무 칩에 있는 직군만, 칩 순서대로다. */
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

/**
 * 직무 선택의 이벤트. 묶음(`lib/roleGroups.ts`) 하나를 통째로 켜거나 끈 것은 묶음 이벤트 하나로 보낸다
 * (`filter_type: 'job_role_group'`, 값은 `직군:묶음 이름`, 예 `HR_GENERAL_AFFAIRS:인사`). 묶음을 직무마다 보내면
 * 묶음 하나에 이벤트가 열 개씩 쌓인다. 묶음에 들지 않는 나머지는 지금처럼 직무마다 `job_role` 이다. 묶음이 하나뿐인
 * 직군(`영업`)은 묶음 줄이 없어 직무마다 보낸다.
 */
function trackRoleChanges(before: JobRole[], after: JobRole[]) {
  const added = after.filter((role) => !before.includes(role));
  const removed = before.filter((role) => !after.includes(role));
  const grouped = new Set<JobRole>();
  for (const field of JOB_FIELDS) {
    const groups = jobRoleGroupsOf(field, JOB_FIELD_LABELS[field]);
    if (groups.length < 2) continue;
    for (const group of groups) {
      for (const [changed, action] of [
        [added, 'select'],
        [removed, 'deselect'],
      ] as const) {
        if (group.roles.length > 1 && group.roles.every((role) => changed.includes(role))) {
          group.roles.forEach((role) => grouped.add(role));
          track('filter_apply', {
            filter_type: 'job_role_group',
            filter_value: `${field}:${group.label}`,
            filter_action: action,
          });
        }
      }
    }
  }
  trackChanges(
    'job_role',
    before.filter((role) => !grouped.has(role)),
    after.filter((role) => !grouped.has(role)),
  );
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
 * 직무 선택 창. 직무 칩(`JobRoleChips`)의 직군 칩을 누르면 뜬다. 직군 → 묶음 → 직무 체크박스가 접는
 * 목록으로 서고(LC-3566, PRD `prd-job-filter-improve.md` 결정 3 B), 눌린 칩의 직군이 펼쳐진 채 열린다.
 * 묶음은 FE 상수다(`lib/roleGroups.ts`) — 묶음을 고르면 그 안의 직무가 `jobRole` 여럿으로 실린다.
 * 직무는 여러 직군에 걸쳐 여러 개 고를 수 있고, `전체` 는 그 직군을 통째로 고른다. 한 직군에서 고른 것은
 * 다른 직군의 선택을 건드리지 않는다(2026-11-04, 사용자 설문. 2026-10-12 의 한 직군 제한을 뒤집었다).
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
  // 적용된 선택 그대로 연다. 누른 직군의 `전체` 를 켜 두지 않는다 — 켜 두면 세부 직무를 고르려다 그대로
  // `공고보기` 를 눌러 직군 전체로 걸린다(LC-3566, PRD `prd-job-filter-improve.md` 결정 2. 2026-10-19 의
  // `전체` 를 켜 두는 결정을 뒤집었다).
  const [selection, setSelection] = useState<JobRoleSelection>(initial);
  // 펼친 직군. 처음에는 누른 칩의 직군만 펼친다.
  const [expanded, setExpanded] = useState<JobField[]>([initialField]);
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

  const empty = selection.fields.length === 0 && selection.roles.length === 0;

  // 이 직군을 통째로 켜거나 끈다. 이 직군에서 하나씩 고른 직무는 지우고, 다른 직군의 선택은 그대로 둔다.
  const toggleField = (field: JobField) =>
    setSelection(({ fields, roles: picked }) => ({
      fields: fields.includes(field) ? fields.filter((item) => item !== field) : [...fields, field],
      roles: picked.filter((item) => JOB_ROLES[item].field !== field),
    }));

  // 직무 여럿(묶음 하나 또는 직무 하나)을 켜거나 끈다. 이 직군이 `전체` 로 골라져 있으면 `전체` 를 풀고
  // 누른 것만 고른다. 다른 직군의 선택은 그대로 둔다.
  const setRoles = (field: JobField, targets: JobRole[], on: boolean) =>
    setSelection(({ fields, roles: picked }) => {
      const rest = picked.filter((item) => !targets.includes(item));
      return {
        fields: fields.filter((item) => item !== field),
        roles: on ? [...rest, ...targets] : rest,
      };
    });

  const toggleExpanded = (field: JobField) =>
    setExpanded((open) =>
      open.includes(field) ? open.filter((item) => item !== field) : [...open, field],
    );

  const apply = () => {
    trackChanges('job_field', initial.fields, selection.fields);
    trackRoleChanges(initial.roles, selection.roles);
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

        <ul className="min-h-0 flex-1 overflow-y-auto border-t border-gray-100 px-4 pb-4 md:px-6">
          {JOB_FIELDS.map((field) => (
            <FieldSection
              key={field}
              field={field}
              selection={selection}
              expanded={expanded.includes(field)}
              onToggleExpanded={() => toggleExpanded(field)}
              onToggleField={() => toggleField(field)}
              onSetRoles={(targets, on) => setRoles(field, targets, on)}
            />
          ))}
        </ul>

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

/** 직군에서 고른 것을 한 줄로. 묶음을 다 골랐으면 묶음 이름, 아니면 직무 이름이다. */
function summarize(groups: JobRoleGroup[], picked: JobRole[]): string {
  return groups
    .flatMap((group) =>
      group.roles.length > 1 && group.roles.every((role) => picked.includes(role))
        ? [group.label]
        : group.roles.filter((role) => picked.includes(role)).map((role) => JOB_ROLES[role].label),
    )
    .join(', ');
}

/**
 * 직군 하나. 머리를 누르면 접히고 펼쳐진다. 펼치면 `전체`, 묶음, 묶음 안의 직무 체크박스가 차례로 선다.
 * `전체` 가 켜져 있으면 묶음·직무는 꺼진 채로 보인다 — `전체` 는 그 직군을 통째로 거는 다른 선택이다.
 * 묶음이 하나뿐인 직군(`영업`)은 묶음 줄이 직군 `전체` 와 같아 그리지 않는다.
 */
function FieldSection({
  field,
  selection,
  expanded,
  onToggleExpanded,
  onToggleField,
  onSetRoles,
}: {
  field: JobField;
  selection: JobRoleSelection;
  expanded: boolean;
  onToggleExpanded: () => void;
  onToggleField: () => void;
  onSetRoles: (roles: JobRole[], on: boolean) => void;
}) {
  const label = JOB_FIELD_LABELS[field];
  const groups = jobRoleGroupsOf(field, label);
  const fieldSelected = selection.fields.includes(field);
  const picked = fieldSelected
    ? []
    : selection.roles.filter((role) => JOB_ROLES[role].field === field);
  const summary = fieldSelected ? '전체' : summarize(groups, picked);
  const panelId = `job-role-field-${field}`;

  return (
    <li className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={onToggleExpanded}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-400 text-white">
          <span aria-hidden="true" className={cn(FIELD_ICONS.get(field), 'block size-5')} />
        </span>
        <span className="shrink-0 text-base font-bold text-gray-900">{label}</span>
        <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-blue-500">
          {summary}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            'icon-[lucide--chevron-down] block size-5 shrink-0 text-gray-500 transition-transform',
            expanded && 'rotate-180',
          )}
        />
      </button>
      {expanded ? (
        <div id={panelId} className="flex flex-col gap-4 pb-5 pl-1">
          <Checkbox
            label="전체"
            checked={fieldSelected}
            onChange={onToggleField}
            labelClassName="font-semibold"
          />
          {groups.map((group) => (
            <fieldset key={group.label} className="flex min-w-0 flex-col gap-3">
              {groups.length > 1 ? (
                <legend className="mb-3">
                  <Checkbox
                    label={group.label}
                    checked={group.roles.every((role) => picked.includes(role))}
                    onChange={(on) => onSetRoles(group.roles, on)}
                    labelClassName="font-semibold"
                  />
                </legend>
              ) : (
                <legend className="sr-only">{group.label}</legend>
              )}
              <div className={cn('grid grid-cols-2 gap-x-4 gap-y-3', groups.length > 1 && 'pl-7')}>
                {group.roles.map((role) => (
                  <Checkbox
                    key={role}
                    label={JOB_ROLES[role].label}
                    checked={picked.includes(role)}
                    onChange={(on) => onSetRoles([role], on)}
                    className="min-w-0"
                    labelClassName="break-keep"
                  />
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      ) : null}
    </li>
  );
}
