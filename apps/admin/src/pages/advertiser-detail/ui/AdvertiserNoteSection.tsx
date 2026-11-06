import { useState } from 'react';
import { Button, Callout, Card, ConfirmDelete, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import {
  useAdvertiserNotes,
  useDeleteAdvertiserNote,
  useSaveAdvertiserNote,
  type AdvertiserNote,
} from '@/entities/advertiser-note/api/useAdvertiserNotes';
import { formatKst } from '@/entities/banner/lib/banner';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { formatCount } from '@/shared/lib/format';

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;

/**
 * 어드민 메모(이슈 #573, 2026-11-06 사용자). 광고주별 광고 상세에 운영자가 여러 건 남긴다. 최신순, 쓴 사람과 시각(KST)을
 * 보이고 고치고 지운다. 비회원 광고주 정보의 한 칸짜리 `메모` 와는 따로다.
 */
export function AdvertiserNoteSection({ advertiserId }: { advertiserId: number }) {
  const { data, isPending, isError } = useAdvertiserNotes(advertiserId);
  const [editing, setEditing] = useState<{ note: AdvertiserNote | null } | null>(null);
  const [deleting, setDeleting] = useState<AdvertiserNote | null>(null);
  const deleteMutation = useDeleteAdvertiserNote(advertiserId);
  const notes = data ?? [];

  return (
    <>
      <div className="flex items-center justify-between gap-2 pt-8 pb-3">
        <h2 className="text-base font-bold text-gray-900">
          어드민 메모 {formatCount(notes.length)}건
        </h2>
        <Button size="sm" onClick={() => setEditing({ note: null })}>
          메모 추가
        </Button>
      </div>
      {isError ? <Callout tone="error">메모를 불러오지 못했습니다.</Callout> : null}
      {isPending ? (
        <p className="text-sm text-gray-500">불러오는 중입니다.</p>
      ) : notes.length === 0 && !isError ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
          남긴 메모가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="어드민 메모">
          {notes.map((note) => (
            <li key={note.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold break-words text-gray-900">
                      {note.title}
                    </h3>
                    <p className="pt-1 text-xs text-gray-500">
                      {note.authorName ?? '관리자'} · {formatKst(note.createdAt)}
                      {note.updatedAt !== note.createdAt
                        ? ` · 수정 ${formatKst(note.updatedAt)}`
                        : ''}
                    </p>
                  </div>
                  <span className="flex shrink-0 gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setEditing({ note })}>
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      aria-label={`${note.title} 메모 삭제`}
                      className="border-red-200 text-error hover:bg-red-50"
                      onClick={() => {
                        deleteMutation.reset();
                        setDeleting(note);
                      }}
                    >
                      삭제
                    </Button>
                  </span>
                </div>
                <p className="pt-3 text-sm break-words whitespace-pre-line text-gray-700">
                  {note.content}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editing ? (
        <NoteFormModal
          key={editing.note?.id ?? 'new'}
          advertiserId={advertiserId}
          note={editing.note}
          onClose={() => setEditing(null)}
        />
      ) : null}
      <ConfirmDelete
        open={deleting !== null}
        targetName={deleting?.title ?? ''}
        description="지운 메모는 되돌릴 수 없습니다."
        isDeleting={deleteMutation.isPending}
        errorMessage={deleteMutation.isError ? '삭제하지 못했습니다.' : undefined}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
          }
        }}
      />
    </>
  );
}

function NoteFormModal({
  advertiserId,
  note,
  onClose,
}: {
  advertiserId: number;
  note: AdvertiserNote | null;
  onClose: () => void;
}) {
  const save = useSaveAdvertiserNote(advertiserId, note?.id ?? null);
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [submitted, setSubmitted] = useState(false);
  const titleError = submitted && !title.trim() ? '제목을 입력해 주세요.' : undefined;
  const contentError = submitted && !content.trim() ? '내용을 입력해 주세요.' : undefined;

  const submit = () => {
    setSubmitted(true);
    if (!title.trim() || !content.trim()) {
      return;
    }
    save.mutate({ title: title.trim(), content: content.trim() }, { onSuccess: onClose });
  };

  return (
    <Modal
      open
      title={note ? '메모 수정' : '메모 추가'}
      onClose={onClose}
      className="w-[min(40rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다.'}
        </Callout>
      ) : null}
      <Field label="제목" htmlFor="note-title" required error={titleError}>
        <Input
          id="note-title"
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <Field
        label="내용"
        htmlFor="note-content"
        required
        error={contentError}
        hint={`${content.length.toLocaleString('ko-KR')} / ${CONTENT_MAX_LENGTH.toLocaleString('ko-KR')}자`}
      >
        <Textarea
          id="note-content"
          rows={8}
          value={content}
          maxLength={CONTENT_MAX_LENGTH}
          onChange={(event) => setContent(event.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
        <Button onClick={submit} disabled={save.isPending}>
          {save.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </Modal>
  );
}
