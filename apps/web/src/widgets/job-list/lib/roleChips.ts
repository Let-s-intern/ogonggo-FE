import { JOB_FIELD_LABELS } from '@/entities/job/model/labels';
import type { JobField } from '@/entities/job/model/types';

/**
 * 직무 칩과 직군의 대응. 직무 칩 줄(`ui/JobRoleChips.tsx`)과 직무 창 왼쪽 목록(`ui/JobRoleSheet.tsx`)이
 * 이 다섯만 쓴다 — 칩에 없는 직군은 창에도 보이지 않는다(2026-10-12, 사용자).
 *
 * 시안(`docs/asset/v12 채용공고 상세/목록.webp`)에는 칩 이름만 있고 어느 직군인지 적혀 있지 않아
 * PRD(`prd-v12-home-list.md`) 결정 4 의 제안을 그대로 둔다. 바뀌면 이 상수만 고친다. 칩 이름은
 * 직군 라벨(enum 카탈로그) 그대로이고, 다섯만 두는 것과 차례는 화면의 선택이다.
 */
export const JOB_ROLE_CHIPS: { label: string; field: JobField }[] = (
  [
    'MARKETING_ADVERTISING',
    'HR_GENERAL_AFFAIRS',
    'PLANNING_STRATEGY',
    'SALES',
    'IT_DEVELOPMENT',
  ] as const
).map((field) => ({ label: JOB_FIELD_LABELS[field], field }));
