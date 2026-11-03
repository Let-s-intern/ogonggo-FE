import { useState } from 'react';
import { Button, Callout, Card, CardTitle, Field, Select, Textarea } from '@ogonggo/ui';
import {
  AD_APPLICATION_STATUS_LABELS,
  adErrorMessage,
  useConfirmAdApplication,
  useUpdateAdApplicationStatus,
  type AdApplication,
  type AdApplicationStatus,
} from '@/entities/advertisement/api/useAdvertisements';

/** `확정` 은 배치를 함께 해야 해서 상태 변경으로 고르지 못한다. 목록에서 빼지 않고 회색으로 둔다. */
const STATUS_OPTIONS = Object.entries(AD_APPLICATION_STATUS_LABELS).map(([value, label]) => ({
  value,
  label: value === 'CONFIRMED' ? `${label}(아래 확정·배치로)` : label,
  disabled: value === 'CONFIRMED',
}));

/** 확정하지 못하는 이유. 없으면 `null`. 서버(목)도 같은 조건을 409 로 막는다. */
function confirmBlocker(application: AdApplication): string | null {
  if (application.status !== 'REVIEWING') {
    return '검수 단계의 신청만 확정할 수 있습니다.';
  }
  if (application.rejection) {
    return '반려를 먼저 풀어야 합니다. 반려 사유를 비우고 상태를 저장하세요.';
  }
  if (application.items.some((item) => item.creative.confirmStatus !== 'APPROVED')) {
    return '광고주가 모든 소재를 확인한 뒤 확정할 수 있습니다.';
  }
  return null;
}

/**
 * 처리 구역. 상태 변경·반려와 확정·배치.
 *
 * 상태 전이를 막지 않는다. 광고 문의(`AdvertisementInquiryStatus`)처럼 운영자가 잘못 누른 것을 되돌릴 수 있어야 하고,
 * 입금·계약은 화면 밖(메일, 모두싸인)에서 일어나 순서를 화면이 장담할 수 없다
 * (memos `결정-광고시스템-admin-신청상태전이-2026-11-03.md`).
 */
export function AdApplicationActions({ application }: { application: AdApplication }) {
  const statusMutation = useUpdateAdApplicationStatus(application.id);
  const confirmMutation = useConfirmAdApplication(application.id);
  const [status, setStatus] = useState<AdApplicationStatus>(application.status);
  const [reason, setReason] = useState(application.rejection?.reason ?? '');
  const blocker = confirmBlocker(application);

  return (
    <Card>
      <CardTitle>처리</CardTitle>

      {statusMutation.isError ? (
        <Callout tone="error" className="mt-4">
          {adErrorMessage(statusMutation.error, '상태를 바꾸지 못했습니다.')}
        </Callout>
      ) : null}

      <div className="grid grid-cols-[12rem_1fr] gap-4 pt-4">
        <Field label="진행 단계" htmlFor="ad-application-status">
          <Select
            id="ad-application-status"
            className="w-full"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) => setStatus(event.target.value as AdApplicationStatus)}
          />
        </Field>
        <Field
          label="반려 사유"
          htmlFor="ad-application-rejection"
          hint="적으면 고른 단계에서 반려합니다. 비우고 저장하면 반려를 풉니다. 광고주 화면에 그대로 보입니다."
        >
          <Textarea
            id="ad-application-rejection"
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </div>
      <Button
        onClick={() =>
          statusMutation.mutate({ status, rejectionReason: reason.trim() || undefined })
        }
        disabled={statusMutation.isPending}
      >
        {statusMutation.isPending ? '저장 중' : '상태 저장'}
      </Button>

      <div className="mt-6 border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-900">확정·배치</p>
        <p className="pt-1 text-sm text-gray-500">
          이 신청의 지면 {application.items.length}개를 한 번에 확정하고, 각 구좌의 노출 순서 맨
          뒤에 넣습니다. 순서는 구좌 설정에서 바꿉니다.
        </p>
        {blocker ? <p className="pt-2 text-sm text-gray-700">{blocker}</p> : null}
        {confirmMutation.isError ? (
          <Callout tone="error" className="mt-2">
            {adErrorMessage(confirmMutation.error, '확정하지 못했습니다.')}
          </Callout>
        ) : null}
        {confirmMutation.isSuccess ? (
          <Callout tone="success" className="mt-2">
            확정했습니다. 구좌 설정의 노출 순서에 들어갔습니다.
          </Callout>
        ) : null}
        <Button
          className="mt-3"
          onClick={() => confirmMutation.mutate(undefined)}
          disabled={blocker !== null || confirmMutation.isPending}
        >
          {confirmMutation.isPending ? '확정 중' : '확정·배치'}
        </Button>
      </div>
    </Card>
  );
}
