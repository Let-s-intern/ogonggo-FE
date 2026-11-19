import { JOB_ROLES } from '@/entities/job/model/labels';
import type { JobField } from '@/entities/job/model/types';
import type { JobListQuery } from './query';
import { JOB_ROLE_CHIPS } from './roleChips';

/**
 * 리스트 상단 고정 광고(`JOB_LIST`, 계약 8·10절)를 받을 탭. `null` 은 `전체` 탭이다. 켜진 직무 칩(`ui/JobRoleChips.tsx`)과 같은 판정이다 — 그
 * 직군을 통째로 골랐거나 그 직군의 직무(직렬)를 하나라도 골랐으면 그 탭이다. 직렬은 광고와 상관없다.
 *
 * `전체`(아무것도 안 고름)면 `[null]` 이라 `전체` 탭의 광고를 받는다. 창에서 여러 직군을 섞어 고르면 칩도 여럿 켜지므로
 * 켜진 탭마다 하나씩 받는다(탭당 1칸). 차례는 칩 차례다.
 */
export function adJobFields({ jobFields = [], jobRoles = [] }: JobListQuery): (JobField | null)[] {
  const picked = new Set<JobField>([
    ...jobFields,
    ...jobRoles.map((role) => JOB_ROLES[role].field),
  ]);
  if (picked.size === 0) {
    return [null];
  }
  return JOB_ROLE_CHIPS.map(({ field }) => field).filter((field) => picked.has(field));
}
