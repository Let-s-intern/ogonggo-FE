import { Badge, type BadgeProps } from '@ogonggo/ui';
import { AD_APPLICATION_STATUS_LABELS, type AdApplicationSummary } from '../api/useAdvertisements';

type Tone = NonNullable<BadgeProps['tone']>;

const TONES: Record<AdApplicationSummary['status'], Tone> = {
  RECEIVED: 'urgent',
  QUOTED: 'neutral',
  CONTRACTED: 'neutral',
  PAID: 'neutral',
  REVIEWING: 'main',
  CONFIRMED: 'success',
  RUNNING: 'success',
  ENDED: 'neutral',
};

/**
 * 진행 단계 배지. 반려된 신청은 단계 이름 뒤에 `반려` 를 붙이고 빨갛게 그린다 — 시안이 반려 난 단계 칸을 빨간
 * `반려` 로 바꾼다(PRD `광고 진행 단계`).
 */
export function AdApplicationStatusBadge({
  application,
}: {
  application: Pick<AdApplicationSummary, 'status' | 'rejection'>;
}) {
  if (application.rejection) {
    return (
      <Badge tone="danger">{AD_APPLICATION_STATUS_LABELS[application.rejection.status]} 반려</Badge>
    );
  }
  return (
    <Badge tone={TONES[application.status]}>
      {AD_APPLICATION_STATUS_LABELS[application.status]}
    </Badge>
  );
}
