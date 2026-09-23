import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  ConfirmDelete,
  DataTable,
  Field,
  Input,
  Pagination,
  Textarea,
  Toggle,
  type DataTableColumn,
} from '@ogonggo/ui';
import {
  useDeleteNotice,
  useNoticeDetail,
  useNoticeList,
  usePatchNoticeVisibility,
  useSaveNotice,
  type NoticeDetail,
  type NoticeSummary,
} from '@/entities/notice/api/useNotices';
import { lexicalToText } from '@/entities/notice/lib/content';
import { PageHeader } from '@/widgets/page-header';
import { formatDate } from '@/shared/lib/format';
import { useListQuery } from '@/shared/lib/useListQuery';

/**
 * 공지사항 목록과 작성·수정·삭제.
 *
 * 목록과 폼을 한 화면에 둔다. 공지는 수십 건을 넘지 않고, 무엇이 고정돼 있는지 보면서 쓰는
 * 편이 낫다.
 *
 * 목록에는 본문이 없다(`GET /notices` 는 요약만 준다). 그래서 행을 누르면 그 행의 값으로 폼을
 * 채우지 않고 상세를 한 번 더 받는다.
 */
export function NoticeListPage() {
  const { page, setPage } = useListQuery();
  const { data, isPending, isError } = useNoticeList(page);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  const closeForm = () => {
    setIsWriting(false);
    setEditingId(null);
  };

  const columns: DataTableColumn<NoticeSummary>[] = [
    {
      key: 'title',
      header: '제목',
      render: (row) => (
        <span className="flex items-center gap-2">
          {row.pinned ? <Badge tone="main">고정</Badge> : null}
          {row.title}
        </span>
      ),
    },
    {
      key: 'visibility',
      header: '노출',
      width: 'w-24',
      render: (row) => <VisibilityToggle notice={row} />,
    },
    {
      key: 'registeredAt',
      header: '등록일',
      width: 'w-32',
      render: (row) => formatDate(row.registeredAt),
    },
    {
      key: 'updatedAt',
      header: '수정일',
      width: 'w-32',
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  return (
    <>
      <PageHeader
        title="공지사항"
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditingId(null);
              setIsWriting(true);
            }}
          >
            새 공지
          </Button>
        }
      />

      {isError ? <Callout tone="error">목록을 불러오지 못했습니다.</Callout> : null}

      {isWriting ? (
        <NoticeEditor key={editingId ?? 'new'} noticeId={editingId} onClose={closeForm} />
      ) : null}

      <DataTable
        className={isWriting ? 'mt-4' : undefined}
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          setEditingId(row.id);
          setIsWriting(true);
        }}
        isLoading={isPending}
        emptyMessage="등록된 공지가 없습니다."
      />
      <Pagination page={page} totalPages={data?.pageInfo.totalPages ?? 1} onChange={setPage} />
    </>
  );
}

interface NoticeEditorProps {
  /** `null` 이면 새 공지다. */
  noticeId: number | null;
  onClose: () => void;
}

/**
 * 수정 폼에 넣을 본문을 받아 온다.
 *
 * 폼은 처음 그려질 때 칸의 초기값을 잡으므로 본문이 도착하기 전에 폼을 띄우면 빈 칸으로 고정된다.
 * 그래서 받아 온 뒤에 폼을 그린다.
 */
function NoticeEditor({ noticeId, onClose }: NoticeEditorProps) {
  const { data, isPending, isError } = useNoticeDetail(noticeId);

  if (noticeId !== null) {
    if (isPending) {
      return (
        <Card>
          <CardTitle>공지 수정</CardTitle>
          <p className="pt-4 text-sm text-gray-500">불러오는 중입니다.</p>
        </Card>
      );
    }
    if (isError || !data) {
      return <Callout tone="error">공지를 불러오지 못했습니다.</Callout>;
    }
  }

  return <NoticeForm notice={data ?? null} onClose={onClose} />;
}

interface NoticeFormProps {
  notice: NoticeDetail | null;
  onClose: () => void;
}

function NoticeForm({ notice, onClose }: NoticeFormProps) {
  const saveMutation = useSaveNotice(notice?.id ?? null);
  const deleteMutation = useDeleteNotice();

  const [title, setTitle] = useState(notice?.title ?? '');
  const [content, setContent] = useState(notice ? lexicalToText(notice.content) : '');
  const [pinned, setPinned] = useState(notice?.pinned ?? false);
  const [visible, setVisible] = useState(notice ? notice.visibility === 'VISIBLE' : true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  return (
    <Card>
      <CardTitle>{notice ? '공지 수정' : '새 공지'}</CardTitle>

      {saveMutation.isSuccess ? (
        <Callout tone="success" className="mt-4">
          저장했습니다.
        </Callout>
      ) : null}

      {saveMutation.isError ? (
        <Callout tone="error" className="mt-4">
          저장하지 못했습니다. 입력값을 확인해 주세요.
        </Callout>
      ) : null}

      <div className="pt-4">
        <Field label="제목" htmlFor="notice-title" required>
          <Input
            id="notice-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>

        <Field
          label="본문"
          htmlFor="notice-content"
          hint="지금은 평문으로 씁니다. 저장할 때 사용자 화면이 읽는 에디터 JSON 으로 바뀝니다."
          required
        >
          <Textarea
            id="notice-content"
            rows={6}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </Field>

        <div className="flex gap-6 pb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            상단 고정
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={visible}
              onChange={(event) => setVisible(event.target.checked)}
            />
            사용자에게 노출
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() =>
              saveMutation.mutate({
                title: title.trim(),
                content: content.trim(),
                pinned,
                visibility: visible ? 'VISIBLE' : 'HIDDEN',
              })
            }
            disabled={!canSave || saveMutation.isPending}
          >
            {saveMutation.isPending ? '저장 중' : '저장'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          {notice ? (
            <Button
              variant="secondary"
              className="border-red-200 text-error hover:bg-red-50"
              onClick={() => setIsConfirmingDelete(true)}
            >
              삭제
            </Button>
          ) : null}
        </div>
      </div>

      {notice ? (
        <ConfirmDelete
          open={isConfirmingDelete}
          targetName={notice.title}
          description="사용자 화면에서도 즉시 사라집니다."
          isDeleting={deleteMutation.isPending}
          errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={() =>
            deleteMutation.mutate(notice.id, {
              onSuccess: () => {
                setIsConfirmingDelete(false);
                onClose();
              },
            })
          }
        />
      ) : null}
    </Card>
  );
}

/**
 * 목록에서 노출을 바로 끈다. 상세로 들어가 고치고 나오는 것이 노출 하나 때문이면 왕복이 아깝다.
 *
 * 클릭을 행에서 멈춘다. 행 전체가 상세를 여는 자리라 멈추지 않으면 토글을 누르는 순간 폼이 열린다.
 * 채용공고·부트캠프 목록이 같은 모양이다(`pages/job-list` 의 `VisibilityToggle`).
 */
function VisibilityToggle({ notice }: { notice: NoticeSummary }) {
  const patchMutation = usePatchNoticeVisibility(notice.id);
  const visible = notice.visibility === 'VISIBLE';

  return (
    // 라벨이 줄바꿈되면 행 높이가 들쭉날쭉해진다.
    <span className="whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
      <Toggle
        checked={visible}
        disabled={patchMutation.isPending}
        label={visible ? '노출' : '비노출'}
        onChange={(next) => patchMutation.mutate(next ? 'VISIBLE' : 'HIDDEN')}
      />
    </span>
  );
}
