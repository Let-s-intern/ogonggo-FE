'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 채용공고 상세의 자격 요건 체크 상태. 이 브라우저의 `localStorage` 에만 두고 서버에는 보내지 않는다.
 * 로그인과 무관하다.
 *
 * 저장 모양: 키 `job-checklist:<jobId>`, 값은 체크한 줄 번호 목록(JSON, 예 `[0,2,5]`).
 * 줄 번호는 필수 → 우대 순서로 이어 붙여 0 부터 센다. 필수가 3줄이면 필수는 0~2, 우대는 3 부터다.
 * 공고 본문이 바뀌어 줄 수가 달라지면 체크가 밀릴 수 있다 — 줄 번호로 저장하는 한 같은 약점이다.
 *
 * 서버 렌더와 첫 하이드레이션은 빈 체크로 시작하고, 마운트 뒤에 저장된 값을 읽어 채운다. 하이드레이션
 * 불일치를 피하는 값이라 저장된 체크가 있으면 첫 화면 직후 한 번 바뀐다.
 *
 * 읽기·쓰기는 `try/catch` 로 감싼다. 저장소가 막힌 브라우저(시크릿 창 등)에서는 체크가 저장되지 않을 뿐
 * 화면에서는 체크가 그대로 동작한다.
 */
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

function readChecked(jobId: number): number[] {
  try {
    const raw = window.localStorage.getItem(storageKey(jobId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return [];
    }
    const lines = parsed.filter((line): line is number => Number.isInteger(line) && line >= 0);
    return Array.from(new Set(lines));
  } catch {
    return [];
  }
}

function writeChecked(jobId: number, checked: number[]): void {
  try {
    if (checked.length === 0) {
      window.localStorage.removeItem(storageKey(jobId));
    } else {
      window.localStorage.setItem(storageKey(jobId), JSON.stringify(checked));
    }
  } catch {
    // 저장이 막혔으면 이번 방문 동안만 체크가 유지된다.
  }
}

/**
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
    setChecked(readChecked(jobId));
  }, [jobId]);

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
      writeChecked(jobId, next);
    },
    [checked, jobId, lineOf],
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
