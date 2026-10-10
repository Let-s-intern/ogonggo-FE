'use client';

import { useCallback, useEffect, useState } from 'react';

/** `localStorage` 키 앞머리. 뒤에 공고 번호가 붙는다. */
const STORAGE_PREFIX = 'job-checklist:';

export type ChecklistGroup = 'required' | 'preferred';

/** `[체크한 개수, 전체 개수]` */
export type ChecklistCount = [checked: number, total: number];

export interface QualificationChecklist {
  required: ChecklistCount;
  preferred: ChecklistCount;
  isChecked: (group: ChecklistGroup, index: number) => boolean;
  toggle: (group: ChecklistGroup, index: number) => void;
}

function storageKey(jobId: number): string {
  return `${STORAGE_PREFIX}${jobId}`;
}

interface StoredChecklist {
  required: number;
  preferred: number;
  checked: number[];
}

function readChecked(jobId: number, requiredTotal: number, preferredTotal: number): number[] {
  try {
    const raw = window.localStorage.getItem(storageKey(jobId));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (typeof parsed !== 'object' || parsed === null) {
      return [];
    }
    const { required, preferred, checked } = parsed as Partial<StoredChecklist>;
    if (required !== requiredTotal || preferred !== preferredTotal || !Array.isArray(checked)) {
      return [];
    }
    const lines = checked.filter((line): line is number => Number.isInteger(line) && line >= 0);
    return Array.from(new Set(lines));
  } catch {
    return [];
  }
}

function writeChecked(
  jobId: number,
  requiredTotal: number,
  preferredTotal: number,
  checked: number[],
): void {
  try {
    if (checked.length === 0) {
      window.localStorage.removeItem(storageKey(jobId));
    } else {
      const stored: StoredChecklist = {
        required: requiredTotal,
        preferred: preferredTotal,
        checked,
      };
      window.localStorage.setItem(storageKey(jobId), JSON.stringify(stored));
    }
  } catch {
    // 저장이 막혔으면 이 컴포넌트가 마운트된 동안만 체크가 유지된다.
  }
}

/**
 * 채용공고 상세의 자격 요건 체크 상태. 이 브라우저의 `localStorage` 에만 두고 서버에는 보내지 않는다.
 * 로그인과 무관하다.
 *
 * 저장 모양: 키 `job-checklist:<jobId>`, 값은 `{ required, preferred, checked }`(JSON, 예
 * `{"required":3,"preferred":4,"checked":[0,2,5]}`). `checked` 는 체크한 줄 번호 목록이다.
 * 줄 번호는 필수 → 우대 순서로 이어 붙여 0 부터 센다. 필수가 3줄이면 필수는 0~2, 우대는 3 부터다.
 * `required`·`preferred` 는 저장할 때의 두 묶음 항목 수다. 읽을 때 지금 항목 수와 다르면 항목이 바뀌어
 * 번호가 어긋난 것이므로 저장된 체크를 없는 것으로 본다(저장소에서 지우지는 않고, 다음에 체크할 때
 * 덮어쓴다). 항목 수 없이 번호만 있던 이전 모양(`[0,2,5]`)도 같은 이유로 없는 것으로 본다.
 *
 * 서버 렌더와 첫 하이드레이션은 빈 체크로 시작하고, 마운트 뒤에 저장된 값을 읽어 채운다. 하이드레이션
 * 불일치를 피하는 값이라 저장된 체크가 있으면 첫 화면 직후 한 번 바뀐다.
 *
 * 읽기·쓰기는 `try/catch` 로 감싼다. 저장소가 막힌 브라우저에서는 체크가 저장되지 않는다. 그래도 같은
 * 화면에서는 `checked` 상태(`useState`)로 체크가 동작한다. 다만 그 상태는 이 훅을 쓰는 컴포넌트가
 * 마운트된 동안만 산다. 상세는 고른 탭의 내용만 그려서(`JobDetailTabs`) `공고 원문` 탭에 갔다 오면
 * 컴포넌트가 언마운트됐다 다시 마운트되고, 그때는 저장소에서만 복원하므로 저장소가 막혔다면 체크가
 * 풀려 있다.
 *
 * @param requiredTotal 체크박스로 보여주는 필수 요건 줄 수. 글로 보여주는 묶음은 0 으로 넘긴다.
 * @param preferredTotal 체크박스로 보여주는 우대 사항 줄 수. 글로 보여주는 묶음은 0 으로 넘긴다.
 */
export function useQualificationChecklist(
  jobId: number,
  requiredTotal: number,
  preferredTotal: number,
): QualificationChecklist {
  const [checked, setChecked] = useState<number[]>([]);

  useEffect(() => {
    setChecked(readChecked(jobId, requiredTotal, preferredTotal));
  }, [jobId, requiredTotal, preferredTotal]);

  const lineOf = useCallback(
    (group: ChecklistGroup, index: number) =>
      group === 'required' ? index : requiredTotal + index,
    [requiredTotal],
  );

  const isChecked = useCallback(
    (group: ChecklistGroup, index: number) => checked.includes(lineOf(group, index)),
    [checked, lineOf],
  );

  const toggle = useCallback(
    (group: ChecklistGroup, index: number) => {
      const line = lineOf(group, index);
      const next = checked.includes(line)
        ? checked.filter((value) => value !== line)
        : [...checked, line].sort((a, b) => a - b);
      setChecked(next);
      writeChecked(jobId, requiredTotal, preferredTotal, next);
    },
    [checked, jobId, lineOf, requiredTotal, preferredTotal],
  );

  const countIn = (from: number, total: number): ChecklistCount => [
    checked.filter((line) => line >= from && line < from + total).length,
    total,
  ];

  return {
    required: countIn(0, requiredTotal),
    preferred: countIn(requiredTotal, preferredTotal),
    isChecked,
    toggle,
  };
}
