import { enumLabels } from '@ogonggo/api';

import type { BootcampOperationType, BootcampStatus, BootcampTuitionType } from './types';

/**
 * 카드 메타 줄(`프로그램유형 · 수강료구분`)과 배지, 그리고 목록 탭이 같은 라벨을 쓴다 —
 * `entities/job/model/labels.ts`와 같은 이유로 한 곳에 모은다. 라벨은 enum 카탈로그에서 온다.
 */
export const OPERATION_TYPE_LABELS: Record<BootcampOperationType, string> =
  enumLabels('BootcampOperationType');

export const TUITION_TYPE_LABELS: Record<BootcampTuitionType, string> =
  enumLabels('BootcampTuitionType');

export const STATUS_LABELS: Record<BootcampStatus, string> = enumLabels(
  'BootcampRecruitmentStatus',
);
