import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ActionAlert,
  Badge,
  Button,
  Callout,
  DataTable,
  Modal,
  Pagination,
  Select,
  Textarea,
  type DataTableColumn,
} from '@ogonggo/ui';
import {
  useRejectionList,
  useUpdateRejectionReason,
  type RejectionListItem,
} from '@/entities/rejection/api/useRejections';
import { PageHeader } from '@/widgets/page-header';
import { ListToolbar, SearchBox } from '@/widgets/list-toolbar';
import { formatDateTime } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

const TYPE_OPTIONS = [
  { value: '', label: '종류 전체' },
  { value: 'JOB', label: '채용공고' },
  { value: 'BOOTCAMP', label: '부트캠프' },
];

/**
 * 반려 보관.
 *
 * 반려한 것들과 그때 보낸 사유를 모아 본다. 사유를 고칠 수도 있다 — 급하게 보낸 사유가
 * 불친절했거나 사실과 달랐을 때, 올린 사람에게 다시 설명할 길이 이것뿐이다.
 *
 * 사유가 목록의 한 칸이다. 상세로 들어가야 보이면 "무엇을 왜 돌려보냈는지"를 훑을 수 없고,
 * 그 훑어보기가 이 화면의 전부다.
 */
export function RejectionsPage() {
  const navigate = useNavigate();
  const { get, page, setFilter, setPage } = useListQuery();
  const [editing, setEditing] = useState<RejectionListItem | null>(null);
  const [alert, setAlert] = useState<{ message: string; nonce: number } | null>(null);

  const filters = { page, keyword: get('keyword'), type: get('type') };
  const { data, isPending, isError } = useRejectionList(filters);

  const columns: DataTableColumn<RejectionListItem>[] = [
    {
      key: 'type',
      header: '종류',
      width: 'w-28',
      render: (row) => <Badge tone="neutral">{row.type === 'JOB' ? '채용공고' : '부트캠프'}</Badge>,
    },
    {
      key: 'title',
      header: '제목',
      width: 'w-80',
      render: (row) => (
        <span className="flex flex-col">
          <span>{row.title}</span>
          <span className="text-gray-500">{row.companyName}</span>
          {!row.contentExists ? (
            <span className="pt-1 text-gray-400">반려 후 삭제된 콘텐츠입니다.</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'reason',
      header: '보낸 사유',
      render: (row) => <span className="whitespace-pre-wrap">{row.reason}</span>,
    },
    {
      key: 'rejectedAt',
      header: '반려일',
      width: 'w-44',
      render: (row) => (
        <span className="flex flex-col">
          <span>{formatDateTime(row.rejectedAt)}</span>
          {row.reasonUpdatedAt ? (
            <span className="text-gray-400">사유 수정 {formatDateTime(row.reasonUpdatedAt)}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: 'w-52',
      render: (row) => (
        // 버튼 글자가 줄바꿈되면 행 높이가 들쭉날쭉해진다.
        <span className="flex gap-1 whitespace-nowrap">
          <Button
            size="sm"
            variant="secondary"
            onClick={(event) => {
              event.stopPropagation();
              setEditing(row);
            }}
          >
            사유 수정
          </Button>
          {row.contentExists ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                navigate(
                  row.type === 'JOB' ? `/content/jobs/${row.id}` : `/content/bootcamps/${row.id}`,
                );
              }}
            >
              원글
            </Button>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <>
      {alert ? (
        <ActionAlert message={alert.message} nonce={alert.nonce} onDismiss={() => setAlert(null)} />
      ) : null}

      <PageHeader title="반려 보관" />

      <ListToolbar>
        <SearchBox
          value={filters.keyword}
          onSubmit={(keyword) => setFilter('keyword', keyword)}
          placeholder="제목·회사·사유 검색"
        />
        <Select
          options={TYPE_OPTIONS}
          value={filters.type}
          onChange={(event) => setFilter('type', event.target.value)}
          aria-label="종류"
        />
      </ListToolbar>

      {isError ? (
        <Callout tone="error">목록을 불러오지 못했습니다.</Callout>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={data?.items ?? []}
            rowKey={(row) => `${row.type}-${row.id}`}
            isLoading={isPending}
            emptyMessage="반려한 것이 없습니다."
          />
          <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
        </>
      )}

      {editing ? (
        <ReasonEditor
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setAlert({ message: '반려 사유를 수정했습니다.', nonce: Date.now() });
          }}
        />
      ) : null}
    </>
  );
}

function ReasonEditor({
  record,
  onClose,
  onSaved,
}: {
  record: RejectionListItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState(record.reason);
  const mutation = useUpdateRejectionReason();

  const trimmed = reason.trim();
  const canSave = trimmed.length > 0 && trimmed !== record.reason && !mutation.isPending;

  return (
    <Modal
      open
      title="반려 사유 수정"
      description={`「${record.title}」 에 보낸 사유를 고칩니다. 올린 회원에게 다시 전달됩니다.`}
      onClose={onClose}
    >
      {mutation.isError ? (
        <Callout tone="error" className="mb-4">
          저장하지 못했습니다.
        </Callout>
      ) : null}

      <Textarea
        rows={5}
        autoFocus
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <p className="pt-1.5 text-sm text-gray-500">
        사유를 비울 수는 없습니다. 무엇을 고쳐야 하는지 알 수 없는 반려는 같은 글을 다시 부릅니다.
      </p>

      <div className="flex items-center gap-2 pt-4">
        <Button
          disabled={!canSave}
          onClick={() =>
            mutation.mutate(
              { type: record.type, id: record.id, reason: trimmed },
              { onSuccess: onSaved },
            )
          }
        >
          {mutation.isPending ? '저장 중' : '저장'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
      </div>
    </Modal>
  );
}
