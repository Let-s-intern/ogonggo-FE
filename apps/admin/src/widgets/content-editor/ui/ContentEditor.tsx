import { useEffect, useState } from 'react';
import { Button, Callout, Field, Input, Modal, Textarea } from '@ogonggo/ui';

export interface ContentEditorField {
  /** 서버로 되돌려 보낼 칸 이름. */
  field: string;
  label: string;
  /** 지금 값. 비어 있을 수 있다. */
  value: string;
}

export interface ContentEditorProps {
  open: boolean;
  title: string;
  fields: ContentEditorField[];
  isSaving?: boolean;
  errorMessage?: string;
  onSave: (input: { title: string; fields: Record<string, string> }) => void;
  onClose: () => void;
}

/**
 * 제목과 본문을 고치는 모달.
 *
 * 크롤링 수집분도 고칠 수 있다. 크롤러가 원문 구조를 잘못 읽어 오는 일이 있고, 그때 고칠 방법이
 * 없으면 그 공고는 통째로 내리는 수밖에 없다.
 *
 * 바뀐 칸만 보낸다. 전부 보내면 운영자가 열어보기만 한 칸도 같은 값으로 덮어쓰게 되고, 그 사이
 * 크롤러가 갱신한 내용이 조용히 되돌아간다.
 *
 * 비어 있던 칸도 입력란으로 보여준다. 크롤러가 못 읽어 온 칸을 채우는 것이 이 화면의 주된
 * 쓰임이라, 없는 칸을 숨기면 채울 자리가 사라진다.
 */
export function ContentEditor({
  open,
  title,
  fields,
  isSaving = false,
  errorMessage,
  onSave,
  onClose,
}: ContentEditorProps) {
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftFields, setDraftFields] = useState<Record<string, string>>({});

  // 열 때마다 서버 값으로 되돌린다. 고치다 닫은 값이 다음에 열었을 때 남아 있으면 헷갈린다.
  useEffect(() => {
    if (!open) {
      return;
    }
    setDraftTitle(title);
    setDraftFields(Object.fromEntries(fields.map((entry) => [entry.field, entry.value])));
  }, [open, title, fields]);

  const changed = fields.filter((entry) => (draftFields[entry.field] ?? '') !== entry.value);
  const isDirty = draftTitle.trim() !== title || changed.length > 0;
  const canSave = isDirty && draftTitle.trim().length > 0 && !isSaving;

  return (
    <Modal
      open={open}
      title="내용 수정"
      description="운영자가 고친 내용은 사용자 화면에 그대로 나갑니다."
      onClose={onClose}
      className="w-[min(48rem,calc(100vw-2rem))]"
    >
      {errorMessage ? (
        <Callout tone="error" className="mb-4">
          {errorMessage}
        </Callout>
      ) : null}

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <Field label="제목" htmlFor="content-title" required>
          <Input
            id="content-title"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
          />
        </Field>

        {fields.map((entry) => (
          <Field
            key={entry.field}
            label={entry.label}
            htmlFor={`content-${entry.field}`}
            hint={entry.value === '' ? '수집되지 않은 칸입니다.' : undefined}
          >
            <Textarea
              id={`content-${entry.field}`}
              rows={5}
              value={draftFields[entry.field] ?? ''}
              onChange={(event) =>
                setDraftFields((previous) => ({ ...previous, [entry.field]: event.target.value }))
              }
            />
          </Field>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-4">
        <Button
          disabled={!canSave}
          onClick={() =>
            onSave({
              title: draftTitle.trim(),
              fields: Object.fromEntries(
                changed.map((entry) => [entry.field, draftFields[entry.field] ?? '']),
              ),
            })
          }
        >
          {isSaving ? '저장 중' : '저장'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
        {isDirty ? (
          <span className="text-sm text-gray-500">
            제목 외 {changed.length}개 칸이 바뀌었습니다.
          </span>
        ) : null}
      </div>
    </Modal>
  );
}
