import { useState } from 'react';
import {
  Button,
  Callout,
  DataTable,
  DescriptionList,
  Modal,
  Pagination,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { AdminServiceFeedbackResponse } from '@ogonggo/api/src/admin';
import { useServiceFeedbackList } from '@/entities/service-feedback/api/useServiceFeedbacks';
import { PageHeader } from '@/widgets/page-header';
import { formatDateTime } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 서비스 개선 의견 목록. 읽기 전용이다.
 *
 * API 가 페이지 말고는 파라미터를 받지 않아 검색·필터는 없다. 순서는 서버가 정한 최신순이다.
 * 두 문항은 길 수 있어 표에서는 한 줄로 자르고, 행을 누르면 모달에서 전문을 보여 준다.
 */
export function ServiceFeedbackListPage() {
  const [selected, setSelected] = useState<AdminServiceFeedbackResponse | null>(null);
  const { page, setPage } = useListQuery();
  const { data, isPending, isError } = useServiceFeedbackList(page);

  const columns: DataTableColumn<AdminServiceFeedbackResponse>[] = [
    {
      key: 'registeredAt',
      header: '등록 일시',
      width: 'w-44',
      render: (row) => (
        <span className="whitespace-nowrap">{formatDateTime(row.registeredAt)}</span>
      ),
    },
    {
      key: 'author',
      header: '작성자',
      width: 'w-32',
      render: (row) => <span className="whitespace-nowrap">{authorLabel(row)}</span>,
    },
    {
      key: 'email',
      header: '이메일',
      width: 'w-48',
      render: (row) => <OneLine text={row.userEmail} />,
    },
    {
      key: 'satisfaction',
      header: '만족한 점',
      render: (row) => <OneLine text={row.satisfaction} />,
    },
    {
      key: 'improvement',
      header: '아쉬운 점',
      render: (row) => <OneLine text={row.improvement} />,
    },
  ];

  return (
    <>
      <PageHeader title="서비스 의견" />

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => row.id}
            onRowClick={setSelected}
            isLoading={isPending}
            emptyMessage="들어온 의견이 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}

      {selected ? <FeedbackModal feedback={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}

/**
 * 작성자 칸. 닉네임, 없으면 이름, 그것도 없으면 회원 ID 다. 로그인 없이 보낸 의견은 `userId` 도 없다.
 * 프로필이 없는 회원(탈퇴 등)은 닉네임·이름이 모두 비어 회원 ID 로 떨어진다.
 */
const authorLabel = ({ userId, userNickname, userName }: AdminServiceFeedbackResponse) =>
  userNickname ?? userName ?? (userId === undefined ? '비로그인' : `회원 ${userId}`);

/**
 * 비운 문항은 `-` 로 둔다. 빈 칸은 값이 안 그려진 것과 구분되지 않는다. 표는 내용 폭으로 칸을
 * 나누므로, 긴 글 칸의 상한이 넓으면 등록 일시·작성자 칸이 한 글자씩 꺾일 만큼 좁아진다.
 */
function OneLine({ text }: { text: string | undefined }) {
  return <span className="block max-w-56 truncate">{text ?? '-'}</span>;
}

function FeedbackModal({
  feedback,
  onClose,
}: {
  feedback: AdminServiceFeedbackResponse;
  onClose: () => void;
}) {
  return (
    <Modal open title={`의견 #${feedback.id}`} onClose={onClose}>
      <DescriptionList
        items={[
          { label: '닉네임', value: feedback.userNickname ?? '-' },
          { label: '이름', value: feedback.userName ?? '-' },
          { label: '이메일', value: feedback.userEmail ?? '-', full: true },
          { label: '회원 ID', value: feedback.userId ?? '비로그인' },
          { label: '등록 일시', value: formatDateTime(feedback.registeredAt) },
          {
            label: '만족한 점',
            value: <p className="whitespace-pre-wrap">{feedback.satisfaction ?? '-'}</p>,
            full: true,
          },
          {
            label: '아쉬운 점',
            value: <p className="whitespace-pre-wrap">{feedback.improvement ?? '-'}</p>,
            full: true,
          },
        ]}
      />
      <div className="flex justify-end pt-6">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
    </Modal>
  );
}
