import { useParams } from 'react-router';
import {
  Badge,
  Callout,
  Card,
  DataTable,
  DescriptionList,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { AdminNotificationBatchFailureResponse } from '@ogonggo/api/src/admin';
import {
  isNotificationBatchNotFound,
  useNotificationBatch,
} from '@/entities/notification-batch/api/useNotificationBatches';
import { PageHeader } from '@/widgets/page-header';
import {
  NotificationStatusBadge,
  notificationDeliveryTypeLabel,
  notificationTargetTypeLabel,
} from '@/shared/config/labels';
import { formatCount, formatDateTime } from '@/shared/lib/format';
import { CountTile } from '@/shared/ui/CountTile';

const BACK_TO = { to: '/support/notifications', label: '알림 발송' };

const failureColumns: DataTableColumn<AdminNotificationBatchFailureResponse>[] = [
  {
    key: 'status',
    header: '상태',
    width: 'w-32',
    render: (row) => <NotificationStatusBadge value={row.status} />,
  },
  { key: 'resultCode', header: '결과 코드', render: (row) => row.resultCode },
  {
    key: 'count',
    header: '건수',
    align: 'right',
    width: 'w-24',
    render: (row) => formatCount(row.count),
  },
];

/**
 * 발송 결과 상세(PRD `prd-notifications.md` "발송 결과 상세"). 읽기 전용이다.
 *
 * 처리가 끝나지 않은 동안(`completed=false`) 10초마다 다시 받는다. 건수만 있고 수신 회원 목록은 없다 — 결과 상세
 * API 가 건수만 준다.
 */
export function NotificationBatchDetailPage() {
  const { batchId = '' } = useParams();
  const { data, isPending, isError, error } = useNotificationBatch(batchId);

  if (isPending) {
    return (
      <>
        <PageHeader title="발송 결과" backTo={BACK_TO} />
        <p className="text-sm text-gray-500">불러오는 중입니다.</p>
      </>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title="발송 결과" backTo={BACK_TO} />
        <Callout tone="error">
          {isNotificationBatchNotFound(error)
            ? '발송 묶음이 없거나 결과 조회 기간(30일)이 지났어요'
            : '발송 결과를 불러오지 못했어요.'}
        </Callout>
      </>
    );
  }

  const targets = [
    { label: '요청 대상', value: `${formatCount(data.targetUserCount)}명` },
    { label: '푸시 수신 가능', value: `${formatCount(data.recipientUserCount)}명` },
    { label: '토큰 없음(알림함에만 저장)', value: `${formatCount(data.noTokenUserCount)}명` },
    { label: '비활성 제외', value: `${formatCount(data.skippedInactiveUserCount)}명` },
    { label: '적재한 발송 작업', value: `${formatCount(data.enqueuedCount)}건` },
  ];

  // 대기는 `PENDING` 과 아직 발송사에 요청 중인 `PROCESSING` 을 함께 센다(백엔드 `pendingCount`).
  const results = [
    { label: '접수 성공', value: formatCount(data.sentCount) },
    { label: '실패', value: formatCount(data.failedCount) },
    { label: '미확정', value: formatCount(data.unknownCount) },
    { label: '대기·처리 중', value: formatCount(data.pendingCount) },
    { label: '기한 초과', value: formatCount(data.expiredCount) },
  ];

  return (
    <>
      <PageHeader
        title={data.title}
        backTo={BACK_TO}
        action={
          data.completed ? (
            <Badge tone="success">처리 끝</Badge>
          ) : (
            <Badge tone="main">발송 중 · 10초마다 갱신</Badge>
          )
        }
      />

      <Card className="px-6 py-5">
        <DescriptionList
          columns={4}
          items={[
            { label: '대상', value: notificationTargetTypeLabel(data.targetType) },
            { label: '발송 방식', value: notificationDeliveryTypeLabel(data.deliveryTargetType) },
            { label: '요청 관리자 ID', value: data.requestedByUserId },
            { label: '발송 묶음 ID', value: <span className="break-all">{data.batchId}</span> },
            { label: '요청 시각', value: formatDateTime(data.createdAt) },
            { label: '발송 기한', value: formatDateTime(data.dispatchExpiresAt) },
            {
              label: '결과 조회 가능',
              value: `${formatDateTime(data.resultsAvailableUntil)}까지`,
            },
            {
              label: '본문',
              value: <p className="whitespace-pre-wrap">{data.body}</p>,
              full: true,
            },
          ]}
        />
      </Card>

      <section className="pt-6">
        <h2 className="pb-2.5 text-base font-bold text-gray-900">대상</h2>
        <div className="grid grid-cols-5 gap-3">
          {targets.map((tile) => (
            <CountTile key={tile.label} label={tile.label} value={tile.value} />
          ))}
        </div>
      </section>

      <section className="pt-6">
        <h2 className="pb-2.5 text-base font-bold text-gray-900">발송 결과</h2>
        <div className="grid grid-cols-5 gap-3">
          {results.map((tile) => (
            <CountTile key={tile.label} label={tile.label} value={tile.value} />
          ))}
        </div>
        <ul className="list-disc pt-3 pl-5 text-xs text-gray-500">
          <li>접수 성공은 FCM이 받았다는 뜻이고, 기기 도착이나 열람을 뜻하지 않아요.</li>
          <li>처리 끝 뒤에도 미확정 건이 늦게 정정될 수 있어요.</li>
          {data.deliveryTargetType === 'TOPIC' ? (
            <li>전체 공지는 토픽 요청 한 건 단위로 집계돼요. 회원 수는 요청 시점 기준이에요.</li>
          ) : null}
        </ul>
      </section>

      <section className="pt-6">
        <h2 className="pb-2.5 text-base font-bold text-gray-900">실패·미확정 사유</h2>
        <DataTable
          columns={failureColumns}
          rows={data.failureReasons}
          rowKey={(row) => `${row.status}:${row.resultCode}`}
          emptyMessage="실패·미확정 없음"
        />
      </section>
    </>
  );
}
