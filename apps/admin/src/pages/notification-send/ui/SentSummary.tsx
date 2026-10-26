import { Link } from 'react-router';
import type { AdminNotificationBatchCreatedResponse } from '@ogonggo/api/src/admin';
import { notificationDeliveryTypeLabel } from '@/shared/config/labels';
import { formatCount } from '@/shared/lib/format';
import { CountTile } from '@/shared/ui/CountTile';

/**
 * 201 뒤의 요약. 요청 시점에 저장·적재한 것까지이고 실제 접수 결과는 발송 결과 상세에 있다.
 *
 * 토큰 없음은 `noTokenUserCount` 다. `skippedNoTokenUserCount` 는 호환용 별칭이다(PRD "결정한 것" 9).
 */
export function SentSummary({ created }: { created: AdminNotificationBatchCreatedResponse }) {
  const tiles = [
    { label: '발송 방식', value: notificationDeliveryTypeLabel(created.deliveryTargetType) },
    { label: '요청 대상', value: `${formatCount(created.targetUserCount)}명` },
    { label: '푸시 수신 가능', value: `${formatCount(created.recipientUserCount)}명` },
    { label: '토큰 없음(알림함에만 저장)', value: `${formatCount(created.noTokenUserCount)}명` },
    { label: '비활성 제외', value: `${formatCount(created.skippedInactiveUserCount)}명` },
    { label: '적재한 발송 작업', value: `${formatCount(created.enqueuedCount)}건` },
  ];

  return (
    <section
      aria-label="발송 결과"
      className="mt-6 flex flex-col gap-3.5 rounded-lg border border-blue-150 bg-white px-6 py-5"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-gray-900">발송을 요청했어요</h2>
        <Link
          to={`/notifications/batches/${created.batchId}`}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          발송 결과 보기
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
        {tiles.map((tile) => (
          <CountTile key={tile.label} label={tile.label} value={tile.value} />
        ))}
      </div>
      <p className="text-xs text-gray-500">
        요청 성공은 저장과 발송 대기열 적재까지예요. 실제 접수 결과는 발송 결과에서 확인해요.
      </p>
    </section>
  );
}
