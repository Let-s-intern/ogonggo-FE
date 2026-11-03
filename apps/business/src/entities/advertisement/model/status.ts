import type {
  AdApplicationStatus,
  AdCreativeConfirmStatus,
  AdRejection,
} from '@ogonggo/api/src/mocks/fixtures/advertisement-types';

/** 진행 단계 여덟 칸. 시안 순서 그대로이고 세 번째 칸은 `계약` 이다(Push 1 결정, PRD `결정 필요` 8). */
export const AD_STATUS_ORDER: readonly AdApplicationStatus[] = [
  'RECEIVED',
  'QUOTED',
  'CONTRACTED',
  'PAID',
  'REVIEWING',
  'CONFIRMED',
  'RUNNING',
  'ENDED',
];

export const AD_STATUS_LABELS: Record<AdApplicationStatus, string> = {
  RECEIVED: '접수',
  QUOTED: '견적',
  CONTRACTED: '계약',
  PAID: '입금',
  REVIEWING: '검수',
  CONFIRMED: '확정',
  RUNNING: '집행',
  ENDED: '종료',
};

/** 목록·상세 머리의 상태 알약 글자. 반려면 `반려` 다. */
export function adStatusPill(
  status: AdApplicationStatus,
  rejection?: AdRejection,
): {
  label: string;
  tone: 'main' | 'danger' | 'neutral' | 'success';
} {
  if (rejection) return { label: `${AD_STATUS_LABELS[rejection.status]} 반려`, tone: 'danger' };
  if (status === 'ENDED') return { label: '종료', tone: 'neutral' };
  if (status === 'RUNNING') return { label: '집행 중', tone: 'success' };
  if (status === 'REVIEWING') return { label: '소재 검수', tone: 'main' };
  return { label: AD_STATUS_LABELS[status], tone: 'main' };
}

export const AD_CREATIVE_CONFIRM_LABELS: Record<AdCreativeConfirmStatus, string> = {
  PENDING: '확인 요청',
  APPROVED: '확인 완료',
  REVISION_REQUESTED: '수정 요청',
};
