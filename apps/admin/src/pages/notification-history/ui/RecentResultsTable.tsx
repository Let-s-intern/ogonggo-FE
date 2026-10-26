import { Button, Callout, DataTable, type DataTableColumn } from '@ogonggo/ui';
import type {
  AdminNotificationBatchResultResponse,
  AdminNotificationRecentResultItemResponse,
} from '@ogonggo/api/src/admin';
import {
  useNotificationBatchContents,
  useRecentNotificationResults,
} from '@/entities/notification-batch/api/useNotificationBatches';
import {
  NotificationStatusBadge,
  commentPushTitle,
  notificationRecipientTypeLabel,
  notificationResultCategoryLabel,
  notificationTemplateLabel,
} from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';

export type RecentItem = AdminNotificationRecentResultItemResponse;
export type BatchContents = ReadonlyMap<string, AdminNotificationBatchResultResponse>;

/** 메뉴 주소의 채널 이름과 응답의 `channel` 값. */
export const HISTORY_CHANNELS = {
  push: { channel: 'FCM', title: '푸시 전송 내역' },
  alimtalk: { channel: 'KAKAO', title: '알림톡 전송 내역' },
  email: { channel: 'EMAIL', title: '이메일 전송 내역' },
} as const;
export type HistoryChannel = keyof typeof HISTORY_CHANNELS;

/**
 * 푸시의 제목. 발송 작업 응답에 payload 가 없어 종류마다 되찾는 길이 다르다. 관리자 발송은 묶음 상세의 `title`, 댓글
 * 푸시는 백엔드가 늘 쓰는 제목이다. 둘 다 못 찾으면(묶음 결과 조회 기간 30일이 지남, FCM 테스트 발송) `undefined` 이고,
 * 부르는 쪽이 종류 이름으로 대신한다.
 */
export function pushTitleOf(row: RecentItem, contents: BatchContents): string | undefined {
  if (row.batchId) {
    const batch = contents.get(row.batchId);
    if (batch) {
      return batch.title;
    }
  }
  return commentPushTitle(row.templateCode);
}

/**
 * 한 채널의 최근 발송 작업 표(PRD `prd-notifications.md` "최근 발송 작업 표"). 서버는 채널을 섞어 최근 100건을 주므로
 * 여기서 거른다 — 한 채널은 100건보다 적게 보일 수 있다.
 *
 * 푸시는 첫 칸에 제목을 굵게 둔다. 알림톡·이메일은 내용이 템플릿마다 정해져 있어 템플릿 이름이 곧 내용이다. 행을
 * 누르면 상세 모달이 열린다(`onSelect`). 상세에 두는 값(작업 ID·알림함 ID·예정 시각·시도 횟수)은 표에서 뺐다.
 */
export function RecentResultsTable({
  channel,
  onSelect,
}: {
  channel: HistoryChannel;
  onSelect: (row: RecentItem, contents: BatchContents) => void;
}) {
  const { data, isPending, isError, isFetching, refetch } = useRecentNotificationResults();
  const rows = (data?.items ?? []).filter(
    (row) => row.channel === HISTORY_CHANNELS[channel].channel,
  );
  const contents = useNotificationBatchContents(
    channel === 'push' ? rows.flatMap((row) => (row.batchId ? [row.batchId] : [])) : [],
  );

  const contentColumn: DataTableColumn<RecentItem> =
    channel === 'push'
      ? {
          key: 'title',
          header: '제목',
          render: (row) => <PushTitle row={row} contents={contents} />,
        }
      : {
          key: 'templateCode',
          header: '내용',
          render: (row) => (
            <span className="font-medium text-gray-900">
              {notificationTemplateLabel(row.templateCode)}
            </span>
          ),
        };

  const columns: DataTableColumn<RecentItem>[] = [
    contentColumn,
    {
      key: 'status',
      header: '상태',
      render: (row) => <NotificationStatusBadge value={row.status} />,
    },
    ...(channel === 'push'
      ? [
          {
            key: 'recipientType',
            header: '대상',
            render: (row: RecentItem) => notificationRecipientTypeLabel(row.recipientType),
          },
        ]
      : []),
    { key: 'recipientUserId', header: '수신 회원 ID', render: (row) => row.recipientUserId ?? '-' },
    { key: 'sentAt', header: '접수 시각', render: (row) => formatDateTime(row.sentAt) },
    { key: 'result', header: '결과', render: (row) => resultText(row) },
    { key: 'updatedAt', header: '수정 시각', render: (row) => formatDateTime(row.updatedAt) },
  ];

  return (
    <section aria-label={HISTORY_CHANNELS[channel].title}>
      <div className="flex items-end justify-between gap-4 pb-3">
        <p className="text-xs text-gray-500">
          최근 수정된 발송 작업 100건 가운데 이 채널만 보여요. 줄을 누르면 자세히 볼 수 있어요.
        </p>
        <Button size="sm" variant="secondary" disabled={isFetching} onClick={() => void refetch()}>
          새로고침
        </Button>
      </div>

      {isError ? (
        <Callout tone="error">전송 내역을 불러오지 못했어요.</Callout>
      ) : (
        <DataTable
          className="[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
          columns={columns}
          rows={rows}
          rowKey={(row) => row.notificationId}
          onRowClick={(row) => onSelect(row, contents)}
          isLoading={isPending}
          emptyMessage="전송 내역이 없어요"
        />
      )}
    </section>
  );
}

/** 제목을 굵게, 그 아래 종류를 작게. 제목을 못 찾았으면 종류만 굵게 둔다. */
function PushTitle({ row, contents }: { row: RecentItem; contents: BatchContents }) {
  const title = pushTitleOf(row, contents);
  const kind = notificationTemplateLabel(row.templateCode);
  return (
    <div className="max-w-sm">
      <p className="truncate font-semibold text-gray-900">{title ?? kind}</p>
      {title ? <p className="text-xs text-gray-500">{kind}</p> : null}
    </div>
  );
}

/** 결과 분류 라벨과 서버 결과 코드. 없으면 `-` 다. 분류 라벨은 모르는 값이면 원래 값이다. */
export function resultText(row: RecentItem): string {
  const parts = [
    row.resultCategory ? notificationResultCategoryLabel(row.resultCategory) : undefined,
    row.resultCode,
  ].filter(Boolean);
  return parts.join(' · ') || '-';
}
