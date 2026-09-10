import { useState } from 'react';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardTitle,
  DataTable,
  Field,
  Input,
  Textarea,
  type DataTableColumn,
} from '@ogonggo/ui';
import type { Notice } from '@ogonggo/api/src/mocks/fixtures/admin-notice';
import { useNoticeList, useSaveNotice } from '@/entities/notice/api/useNotices';
import { PageHeader } from '@/widgets/page-header';
import { formatDate, toDateInputValue } from '@/shared/lib/format';

/**
 * 공지사항 목록과 작성·수정.
 *
 * 목록과 폼을 한 화면에 둔다. 공지는 수십 건을 넘지 않고, 상단 고정이 하나뿐이라 무엇이 고정돼
 * 있는지 보면서 쓰는 편이 낫다.
 *
 * 고정을 옮기면 먼저 걸린 공지가 풀린다. 조용히 풀지 않고 무엇이 풀렸는지 알린다
 * (PRD "고객 지원 · 공지사항"). 그 판단은 목 핸들러가 하고 화면은 응답에 실려 온 제목을 보여준다.
 */
export function NoticeListPage() {
  const { data, isPending, isError } = useNoticeList();
  const [editing, setEditing] = useState<Notice | null>(null);
  const [isWriting, setIsWriting] = useState(false);

  const columns: DataTableColumn<Notice>[] = [
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
      key: 'publication',
      header: '게시 기간',
      width: 'w-56',
      render: (row) =>
        `${formatDate(row.publicationStartAt)} ~ ${
          row.publicationEndAt ? formatDate(row.publicationEndAt) : '무기한'
        }`,
    },
    {
      key: 'active',
      header: '활성',
      width: 'w-24',
      render: (row) => (
        <Badge tone={row.active ? 'success' : 'neutral'}>{row.active ? '활성' : '비활성'}</Badge>
      ),
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
              setEditing(null);
              setIsWriting(true);
            }}
          >
            새 공지
          </Button>
        }
      />

      {isError ? <Callout tone="error">목록을 불러오지 못했습니다.</Callout> : null}

      {isWriting ? (
        <NoticeForm
          notice={editing}
          onClose={() => {
            setIsWriting(false);
            setEditing(null);
          }}
        />
      ) : null}

      <DataTable
        className={isWriting ? 'mt-4' : undefined}
        columns={columns}
        rows={data ?? []}
        rowKey={(row) => row.id}
        onRowClick={(row) => {
          setEditing(row);
          setIsWriting(true);
        }}
        isLoading={isPending}
        emptyMessage="등록된 공지가 없습니다."
      />
    </>
  );
}

interface NoticeFormProps {
  /** `null` 이면 새 공지다. */
  notice: Notice | null;
  onClose: () => void;
}

function NoticeForm({ notice, onClose }: NoticeFormProps) {
  const saveMutation = useSaveNotice(notice?.id ?? null);

  const [title, setTitle] = useState(notice?.title ?? '');
  const [content, setContent] = useState(notice?.content ?? '');
  const [startAt, setStartAt] = useState(
    toDateInputValue(notice?.publicationStartAt ?? new Date().toISOString()),
  );
  const [endAt, setEndAt] = useState(toDateInputValue(notice?.publicationEndAt));
  const [pinned, setPinned] = useState(notice?.pinned ?? false);
  const [active, setActive] = useState(notice?.active ?? true);

  const canSave = title.trim().length > 0 && content.trim().length > 0 && startAt.length > 0;
  const unpinnedTitle = saveMutation.data?.unpinnedNoticeTitle;

  return (
    <Card>
      <CardTitle>{notice ? '공지 수정' : '새 공지'}</CardTitle>

      {saveMutation.isSuccess ? (
        <Callout tone={unpinnedTitle ? 'warning' : 'success'} className="mt-4">
          {unpinnedTitle
            ? `저장했습니다. 고정이 옮겨지면서 "${unpinnedTitle}" 의 고정이 풀렸습니다.`
            : '저장했습니다.'}
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
          hint="본문 형식(마크다운 여부)은 아직 정해지지 않아 지금은 평문입니다."
          required
        >
          <Textarea
            id="notice-content"
            rows={6}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="게시 시작" htmlFor="notice-start" required>
            <Input
              id="notice-start"
              type="date"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </Field>
          <Field label="게시 종료" htmlFor="notice-end" hint="비우면 무기한입니다.">
            <Input
              id="notice-end"
              type="date"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </Field>
        </div>

        <div className="flex gap-6 pb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />
            상단 고정 (동시에 하나만 가능)
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            활성
          </label>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() =>
              saveMutation.mutate({
                title: title.trim(),
                content: content.trim(),
                publicationStartAt: startAt,
                publicationEndAt: endAt || undefined,
                pinned,
                active,
              })
            }
            disabled={!canSave || saveMutation.isPending}
          >
            {saveMutation.isPending ? '저장 중' : '저장'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </Card>
  );
}
