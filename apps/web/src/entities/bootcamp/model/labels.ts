import type { BootcampOperationType, BootcampStatus, BootcampTuitionType } from './types';

/**
 * 카드 메타 줄(`프로그램유형 · 수강료구분`)과 배지, 그리고 목록 탭이 같은 라벨을 쓴다 —
 * `entities/job/model/labels.ts`와 같은 이유로 한 곳에 모은다.
 */
export const OPERATION_TYPE_LABELS: Record<BootcampOperationType, string> = {
  ONLINE: '온라인',
  OFFLINE: '오프라인',
  HYBRID: '온·오프라인',
};

export const TUITION_TYPE_LABELS: Record<BootcampTuitionType, string> = {
  FREE: '무료',
  PAID: '유료',
  GOVERNMENT_FUNDED: '국비지원',
};

export const STATUS_LABELS: Record<BootcampStatus, string> = {
  DRAFT: '준비 중',
  RECRUITING: '모집 중',
  CLOSED: '마감',
};
