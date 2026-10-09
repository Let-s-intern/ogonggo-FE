'use client';

import {
  useQualificationChecklist,
  type ChecklistGroup,
  type QualificationChecklist as Checklist,
} from '../model/useQualificationChecklist';

export interface QualificationChecklistProps {
  jobId: number;
  /** 자격 요건을 항목으로 나눈 것. `splitLines` 의 결과다. 없으면 빈 배열. */
  required: string[];
  /** 우대 사항을 항목으로 나눈 것. 없으면 빈 배열. */
  preferred: string[];
}

/**
 * 자격 요건 체크리스트(`docs/asset/v12 채용공고 상세/상세 자격요건 체크.webp`). 필수와 우대를 묶음으로
 * 나누고, 항목마다 체크박스를 둔다. 맨 위 배지가 `필수 2/3 · 우대 2/4 충족` 처럼 체크한 만큼 바뀐다.
 * 체크는 이 브라우저에만 남는다(`useQualificationChecklist`).
 *
 * 나눈 결과가 항목 하나뿐인 묶음은 체크할 것이 없는 글이라 체크박스 대신 글로 보이고 배지에서 빠진다.
 * 두 묶음이 모두 글이면 배지와 안내 문구도 없다.
 *
 * 둘 다 비어 있으면 부르는 쪽이 이 구역을 그리지 않는다.
 */
export function QualificationChecklist({
  jobId,
  required,
  preferred,
}: QualificationChecklistProps) {
  const requiredChecks = required.length > 1;
  const preferredChecks = preferred.length > 1;
  const checklist = useQualificationChecklist(
    jobId,
    requiredChecks ? required.length : 0,
    preferredChecks ? preferred.length : 0,
  );

  const summary = [
    requiredChecks ? `필수 ${checklist.required[0]}/${checklist.required[1]}` : null,
    preferredChecks ? `우대 ${checklist.preferred[0]}/${checklist.preferred[1]}` : null,
  ].filter(Boolean);

  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h2 className="text-lg font-bold text-gray-900">자격 요건</h2>
        {summary.length > 0 ? (
          <p className="text-xs text-gray-400">본인에게 해당하는 항목을 체크해보세요.</p>
        ) : null}
      </div>
      {summary.length > 0 ? (
        <p
          role="status"
          className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600"
        >
          {summary.join(' · ')} 충족
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-4">
        {required.length > 0 ? (
          <Group
            label="자격 요건"
            group="required"
            lines={required}
            checklist={checklist}
            checkable={requiredChecks}
          />
        ) : null}
        {preferred.length > 0 ? (
          <Group
            label="우대 사항"
            group="preferred"
            lines={preferred}
            checklist={checklist}
            checkable={preferredChecks}
          />
        ) : null}
      </div>
    </section>
  );
}

interface GroupProps {
  label: string;
  group: ChecklistGroup;
  lines: string[];
  checklist: Checklist;
  /** 체크박스로 보일지. 항목이 하나뿐이면 글이다. */
  checkable: boolean;
}

function Group({ label, group, lines, checklist, checkable }: GroupProps) {
  if (!checkable) {
    return (
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="mt-2 text-sm text-gray-700">{lines.join(' ')}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500">
        {label} · {lines.length}개
      </p>
      <ul className="mt-2 rounded-lg bg-gray-50 py-1">
        {lines.map((line, index) => {
          const checked = checklist.isChecked(group, index);
          return (
            <li key={`${group}-${index}`}>
              <label className="flex cursor-pointer items-start gap-2.5 px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => checklist.toggle(group, index)}
                  className="mt-0.5 size-4 shrink-0 cursor-pointer accent-blue-500"
                />
                <span className={checked ? 'min-w-0 text-gray-900' : 'min-w-0 text-gray-600'}>
                  {line}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
