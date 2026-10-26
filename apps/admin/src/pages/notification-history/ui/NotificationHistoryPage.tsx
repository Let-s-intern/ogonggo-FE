import { useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { PageHeader } from '@/widgets/page-header';
import { NotificationJobModal } from './NotificationJobModal';
import {
  HISTORY_CHANNELS,
  RecentResultsTable,
  type BatchContents,
  type HistoryChannel,
  type RecentItem,
} from './RecentResultsTable';

const isHistoryChannel = (value: string | undefined): value is HistoryChannel =>
  value !== undefined && value in HISTORY_CHANNELS;

/**
 * `알림` 메뉴의 푸시·알림톡·이메일 전송 내역. 세 메뉴가 이 페이지를 채널만 바꿔 쓴다(`/notifications/history/:channel`).
 * 모르는 채널 주소는 푸시 내역으로 보낸다.
 */
export function NotificationHistoryPage() {
  const { channel } = useParams();
  const [selected, setSelected] = useState<{ row: RecentItem; contents: BatchContents } | null>(
    null,
  );

  if (!isHistoryChannel(channel)) {
    return <Navigate to="/notifications/history/push" replace />;
  }

  return (
    <>
      <PageHeader title={HISTORY_CHANNELS[channel].title} />
      <RecentResultsTable
        key={channel}
        channel={channel}
        onSelect={(row, contents) => setSelected({ row, contents })}
      />
      {selected ? (
        <NotificationJobModal
          row={selected.row}
          contents={selected.contents}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </>
  );
}
