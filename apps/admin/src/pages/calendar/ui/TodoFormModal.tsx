import { useState } from 'react';
import { Button, Callout, Checkbox, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import {
  useDeleteCalendarTodo,
  useSaveCalendarTodo,
  type CalendarTodo,
} from '@/entities/calendar/api/useCalendar';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

const TITLE_MAX_LENGTH = 100;
const CONTENT_MAX_LENGTH = 2000;

/** 새 할 일이면 고른 날짜, 고치는 중이면 그 할 일. */
export type TodoEditing =
  | { todo: null; startDate: string; endDate: string }
  | { todo: CalendarTodo; startDate?: undefined; endDate?: undefined };

/**
 * 할 일 등록·수정 모달. 제목(필수), 내용, 시작일·끝나는 날(같으면 하루), 완료.
 *
 * 삭제는 모달 안에서 한 번 더 묻는다. 확인 문구를 입력하는 `ConfirmDelete` 는 광고처럼 사용자 화면에 나가는 것을 지울 때
 * 쓰는 것이라 운영자 할 일에는 무겁다.
 */
export function TodoFormModal({
  editing,
  onClose,
  notify,
}: {
  editing: TodoEditing;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const { todo } = editing;
  const save = useSaveCalendarTodo(todo?.id ?? null);
  const remove = useDeleteCalendarTodo();
  const [title, setTitle] = useState(todo?.title ?? '');
  const [content, setContent] = useState(todo?.content ?? '');
  const [startDate, setStartDate] = useState(todo?.startDate ?? editing.startDate ?? '');
  const [endDate, setEndDate] = useState(todo?.endDate ?? editing.endDate ?? '');
  const [done, setDone] = useState(todo?.done ?? false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const titleError = submitted && !title.trim() ? '제목을 입력해 주세요.' : undefined;
  const startError = submitted && !startDate ? '시작일을 골라 주세요.' : undefined;
  const endError =
    submitted && !endDate
      ? '끝나는 날을 골라 주세요.'
      : endDate && startDate && endDate < startDate
        ? '끝나는 날은 시작일과 같거나 뒤여야 합니다.'
        : undefined;

  const submit = () => {
    setSubmitted(true);
    if (!title.trim() || !startDate || !endDate || endDate < startDate) {
      return;
    }
    save.mutate(
      { title: title.trim(), content: content.trim() || null, startDate, endDate, done },
      {
        onSuccess: () => {
          notify(todo ? '할 일을 고쳤습니다.' : '할 일을 더했습니다.');
          onClose();
        },
      },
    );
  };

  const deleteTodo = () => {
    if (!todo) {
      return;
    }
    remove.mutate(todo.id, {
      onSuccess: () => {
        notify('할 일을 지웠습니다.');
        onClose();
      },
    });
  };

  return (
    <Modal
      open
      title={todo ? '할 일 수정' : '할 일 추가'}
      onClose={onClose}
      className="w-[min(36rem,calc(100vw-2rem))]"
    >
      {save.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(save.error) ?? '저장하지 못했습니다.'}
        </Callout>
      ) : null}
      {remove.isError ? (
        <Callout tone="error" className="mb-4">
          삭제하지 못했습니다.
        </Callout>
      ) : null}
      <Field label="제목" htmlFor="todo-title" required error={titleError}>
        <Input
          id="todo-title"
          value={title}
          maxLength={TITLE_MAX_LENGTH}
          autoFocus
          onChange={(event) => setTitle(event.target.value)}
        />
      </Field>
      <Field
        label="내용"
        htmlFor="todo-content"
        hint={`${content.length.toLocaleString('ko-KR')} / ${CONTENT_MAX_LENGTH.toLocaleString('ko-KR')}자`}
      >
        <Textarea
          id="todo-content"
          rows={4}
          value={content}
          maxLength={CONTENT_MAX_LENGTH}
          onChange={(event) => setContent(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="시작일" htmlFor="todo-start" required error={startError}>
          <Input
            id="todo-start"
            type="date"
            value={startDate}
            onChange={(event) => {
              const next = event.target.value;
              setStartDate(next);
              // 하루짜리를 고치다 시작을 끝 뒤로 옮기면 끝도 따라온다.
              if (next && (!endDate || endDate < next)) {
                setEndDate(next);
              }
            }}
          />
        </Field>
        <Field label="끝나는 날" htmlFor="todo-end" required error={endError} hint="하루면 같은 날">
          <Input
            id="todo-end"
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </Field>
      </div>
      <Checkbox checked={done} onChange={setDone} label="완료" className="mb-6" />

      {confirmingDelete ? (
        <div className="flex items-center justify-between gap-2 rounded-md bg-red-50 px-4 py-3">
          <p className="text-sm text-gray-900">이 할 일을 지울까요? 되돌릴 수 없습니다.</p>
          <span className="flex shrink-0 gap-2">
            <Button size="sm" variant="secondary" onClick={() => setConfirmingDelete(false)}>
              취소
            </Button>
            <Button
              size="sm"
              className="bg-red-500 hover:bg-red-600"
              disabled={remove.isPending}
              onClick={deleteTodo}
            >
              {remove.isPending ? '지우는 중' : '지우기'}
            </Button>
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          {todo ? (
            <Button
              variant="secondary"
              className="border-red-200 text-error hover:bg-red-50"
              onClick={() => setConfirmingDelete(true)}
            >
              삭제
            </Button>
          ) : (
            <span />
          )}
          <span className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              닫기
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? '저장 중' : '저장'}
            </Button>
          </span>
        </div>
      )}
    </Modal>
  );
}
