import { Link } from 'react-router';
import { Button, Callout, DataTable, type DataTableColumn } from '@ogonggo/ui';
import type { AdminNotificationRecentResultItemResponse } from '@ogonggo/api/src/admin';
import { useRecentNotificationResults } from '@/entities/notification-batch/api/useNotificationBatches';
import {
  NotificationStatusBadge,
  notificationChannelLabel,
  notificationRecipientTypeLabel,
  notificationResultCategoryLabel,
} from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';

type RecentItem = AdminNotificationRecentResultItemResponse;

/**
 * 최근 발송 작업 표(PRD `prd-notifications.md` "최근 발송 작업 표"). 칸이 열셋이라 좁은 창에서는 가로로 민다 —
 * 칸 안을 줄바꿈하지 않는다. 줄이 꺾이면 행마다 높이가 달라져 시각·ID 를 위아래로 견주기 어렵다.
 *
 * 묶음 목록 API 가 없어 이 표의 `발송 묶음` 링크가 지난 발송의 결과 상세로 가는 길이다(PRD "백엔드 요청" 1).
 */
export function RecentResultsTable() {
  const { data, isPending, isError, isFetching, refetch } = useRecentNotificationResults();

  const columns: DataTableColumn<RecentItem>[] = [
    { key: 'notificationId', header: '작업 ID', render: (row) => row.notificationId },
    { key: 'channel', header: '채널', render: (row) => notificationChannelLabel(row.channel) },
    {
      key: 'status',
      header: '상태',
      render: (row) => <NotificationStatusBadge value={row.status} />,
    },
    {
      key: 'recipientType',
      header: '대상 유형',
      render: (row) => notificationRecipientTypeLabel(row.recipientType),
    },
    { key: 'templateCode', header: '템플릿', render: (row) => row.templateCode },
    {
      key: 'recipientUserId',
      header: '수신 회원 ID',
      render: (row) => orDash(row.recipientUserId),
    },
    {
      key: 'userNotificationId',
      header: '알림함 ID',
      render: (row) => orDash(row.userNotificationId),
    },
    { key: 'batchId', header: '발송 묶음', render: (row) => <BatchLink batchId={row.batchId} /> },
    { key: 'scheduledAt', header: '예정 시각', render: (row) => formatDateTime(row.scheduledAt) },
    { key: 'sentAt', header: '접수 시각', render: (row) => formatDateTime(row.sentAt) },
    { key: 'result', header: '결과', render: (row) => <ResultCell row={row} /> },
    { key: 'attemptCount', header: '시도 횟수', align: 'right', render: (row) => row.attemptCount },
    { key: 'updatedAt', header: '수정 시각', render: (row) => formatDateTime(row.updatedAt) },
  ];

  return (
    <section aria-label="최근 발송 작업" className="pt-10">
      <div className="flex items-end justify-between gap-4 pb-3">
        <div>
          <h2 className="text-base font-bold text-gray-900">최근 발송 작업</h2>
          <p className="pt-1 text-xs text-gray-500">
            최근 수정된 100건. 푸시, 알림톡, 이메일이 함께 보여요. 작업 ID는 발송 작업 번호예요.
            회원 알림함의 알림 번호는 알림함 ID예요.
          </p>
        </div>
        <Button size="sm" variant="secondary" disabled={isFetching} onClick={() => void refetch()}>
          새로고침
        </Button>
      </div>

      {isError ? (
        <Callout tone="error">최근 발송 작업을 불러오지 못했어요.</Callout>
      ) : (
        <DataTable
          className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.notificationId}
          isLoading={isPending}
          emptyMessage="발송 작업이 없어요"
        />
      )}
    </section>
  );
}

/** 없는 값은 `-` 다. 알림톡·이메일은 알림함 ID 가, 토픽 작업은 수신 회원이 없다. */
const orDash = (value: number | undefined) => value ?? '-';

/** 묶음 ID 는 UUID 라 앞 여덟 자만 보이고, 전체는 마우스를 올리면 보인다. */
function BatchLink({ batchId }: { batchId?: string }) {
  if (!batchId) {
    return '-';
  }
  return (
    <Link
      to={`/support/notifications/batches/${batchId}`}
      title={batchId}
      className="text-blue-600 hover:text-blue-700"
    >
      {batchId.slice(0, 8)}
    </Link>
  );
}

/**
 * 결과 분류 라벨과 서버 결과 코드. 분류 라벨은 모르는 값이면 원래 값이다.
 *
 * `resultDetail`(최대 500자)은 길어 칸에 펼쳐 두지 않는다. 마우스를 올리면 보이고, `사유` 를 누르면 칸 안에서
 * 펼쳐진다.
 */
function ResultCell({ row }: { row: RecentItem }) {
  const parts = [
    row.resultCategory ? notificationResultCategoryLabel(row.resultCategory) : undefined,
    row.resultCode,
  ].filter(Boolean);
  if (parts.length === 0 && !row.resultDetail) {
    return '-';
  }
  return (
    <div title={row.resultDetail}>
      <span>{parts.join(' · ') || '-'}</span>
      {row.resultDetail ? (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer">사유</summary>
          <p className="max-w-md whitespace-normal pt-1">{row.resultDetail}</p>
        </details>
      ) : null}
    </div>
  );
}
