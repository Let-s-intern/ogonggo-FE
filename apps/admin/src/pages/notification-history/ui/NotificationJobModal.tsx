import { Link } from 'react-router';
import { Button, DescriptionList, Modal } from '@ogonggo/ui';
import {
  NotificationStatusBadge,
  commentPushTitle,
  notificationChannelLabel,
  notificationRecipientTypeLabel,
  notificationTargetTypeLabel,
  notificationTemplateLabel,
} from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';
import { pushTitleOf, resultText, type BatchContents, type RecentItem } from './RecentResultsTable';

/**
 * 전송 내역 한 줄의 상세. 위에 보낸 내용, 아래에 발송 작업 정보다.
 *
 * 보낸 내용은 종류마다 되찾을 수 있는 만큼만 보인다. 관리자 발송은 묶음 상세의 제목·본문이고, 댓글 푸시는 늘 같은
 * 제목과 본문 꼴이다(실제 작성자·미리보기는 발송 작업 응답에 없다). 알림톡·이메일은 템플릿이 정해져 있어 종류가 곧
 * 내용이다.
 */
export function NotificationJobModal({
  row,
  contents,
  onClose,
}: {
  row: RecentItem;
  contents: BatchContents;
  onClose: () => void;
}) {
  const kind = notificationTemplateLabel(row.templateCode);
  const isPush = row.channel === 'FCM';
  const title = (isPush ? pushTitleOf(row, contents) : undefined) ?? kind;
  const batch = row.batchId ? contents.get(row.batchId) : undefined;
  const commentTitle = commentPushTitle(row.templateCode);

  return (
    <Modal open title={title} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {batch ? (
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <p className="pb-1 text-xs text-gray-500">본문</p>
            <p className="text-sm whitespace-pre-wrap text-gray-900">{batch.body}</p>
          </div>
        ) : commentTitle ? (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
            본문은 <span className="font-medium">작성자 닉네임: 댓글 앞 100자</span> 꼴로 갔어요.
            실제 문구는 발송 작업 응답에 없어요.
          </div>
        ) : row.batchId ? (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-700">
            발송 묶음의 결과 조회 기간(30일)이 지나 본문을 불러올 수 없어요.
          </div>
        ) : null}

        <DescriptionList
          items={[
            { label: '종류', value: kind },
            { label: '상태', value: <NotificationStatusBadge value={row.status} /> },
            { label: '채널', value: notificationChannelLabel(row.channel) },
            { label: '대상 유형', value: notificationRecipientTypeLabel(row.recipientType) },
            ...(batch
              ? [{ label: '발송 대상', value: notificationTargetTypeLabel(batch.targetType) }]
              : []),
            { label: '수신 회원 ID', value: row.recipientUserId ?? '-' },
            { label: '알림함 ID', value: row.userNotificationId ?? '-' },
            { label: '작업 ID', value: row.notificationId },
            { label: '예정 시각', value: formatDateTime(row.scheduledAt) },
            { label: '접수 시각', value: formatDateTime(row.sentAt) },
            { label: '수정 시각', value: formatDateTime(row.updatedAt) },
            { label: '시도 횟수', value: row.attemptCount },
            { label: '결과', value: resultText(row), full: true },
            ...(row.resultDetail
              ? [{ label: '결과 상세', value: row.resultDetail, full: true }]
              : []),
          ]}
        />

        <div className="flex justify-end gap-2">
          {row.batchId ? (
            <Button variant="secondary" asChild>
              <Link to={`/notifications/batches/${row.batchId}`}>발송 결과 보기</Link>
            </Button>
          ) : null}
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </Modal>
  );
}
