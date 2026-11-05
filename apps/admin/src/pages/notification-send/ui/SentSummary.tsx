import { Link } from 'react-router';
import type { AdminNotificationBatchCreatedResponse } from '@ogonggo/api/src/admin';
import { notificationDeliveryTypeLabel } from '@/shared/config/labels';
import { formatCount } from '@/shared/lib/format';
import { CountTile } from '@/shared/ui/CountTile';

/**
 * 201 뒤의 요약. 요청 시점에 저장·적재한 것까지이고 실제 접수 결과는 발송 결과 상세에 있다.
 *
 * 토큰 없음은 `noTokenUserCount` 다. `skippedNoTokenUserCount` 는 호환용 별칭이다(PRD "결정한 것" 9).
 * 마케팅 수신 미동의 제외(`noMarketingConsentUserCount`)는 광고성 발송에서만 뜻이 있어, 아니면 `해당 없음` 이다.
 */
export function SentSummary({ created }: { created: AdminNotificationBatchCreatedResponse }) {
  const tiles = [
    { label: '발송 방식', value: notificationDeliveryTypeLabel(created.deliveryTargetType) },
    { label: '요청 대상', value: `${formatCount(created.targetUserCount)}명` },
    { label: '푸시 수신 가능', value: `${formatCount(created.recipientUserCount)}명` },
    { label: '토큰 없음(알림함에만 저장)', value: `${formatCount(created.noTokenUserCount)}명` },
    { label: '비활성 제외', value: `${formatCount(created.skippedInactiveUserCount)}명` },
    { label: '적재한 발송 작업', value: `${formatCount(created.enqueuedCount)}건` },
    { label: '광고성', value: created.advertisement ? '광고성' : '아님' },
    {
      label: '마케팅 수신 미동의 제외',
      value: created.advertisement
        ? `${formatCount(created.noMarketingConsentUserCount)}명`
        : '해당 없음',
    },
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
      <div className="grid grid-cols-4 gap-3">
        {tiles.map((tile) => (
          <CountTile key={tile.label} label={tile.label} value={tile.value} />
        ))}
      </div>
      {created.imageUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={created.imageUrl}
            alt="보낸 알림 이미지"
            className="h-16 w-28 rounded border border-gray-200 object-cover"
          />
          <span className="text-xs text-gray-500">이미지를 붙여 보냈어요.</span>
        </div>
      ) : null}
      <p className="text-xs text-gray-500">
        요청 성공은 저장과 발송 대기열 적재까지예요. 실제 접수 결과는 발송 결과에서 확인해요.
      </p>
    </section>
  );
}
