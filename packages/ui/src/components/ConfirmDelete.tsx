import { useEffect, useState } from 'react';
import { Button } from './Button';
import { Callout } from './Callout';
import { Field } from './Field';
import { Input } from './Input';
import { Modal } from './Modal';

/** 삭제를 열려면 그대로 입력해야 하는 문구. */
export const DELETE_CONFIRM_PHRASE = '삭제하겠습니다.';

export interface ConfirmDeleteProps {
  open: boolean;
  /** 무엇을 지우는지. 제목을 그대로 넘긴다. */
  targetName: string;
  /** 지운 뒤 무슨 일이 벌어지는지. 되돌릴 수 없다는 사실 외에 더 있을 때만. */
  description?: string;
  isDeleting?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * 삭제 확인. **문구를 그대로 입력해야만 버튼이 열린다.**
 *
 * "정말 삭제할까요?" 에 확인을 누르는 대화상자는 몇 번 쓰고 나면 읽지 않고 누르게 된다.
 * 손으로 문구를 치는 동안에는 무엇을 지우는지 한 번 더 보게 되고, 잘못 누른 사람은 거기서
 * 멈춘다.
 *
 * 삭제는 되돌릴 수 없다. 그래서 확인이 되돌리기를 대신한다.
 */
export function ConfirmDelete({
  open,
  targetName,
  description,
  isDeleting = false,
  errorMessage,
  onConfirm,
  onClose,
}: ConfirmDeleteProps) {
  const [typed, setTyped] = useState('');

  // 열 때마다 비운다. 앞서 친 문구가 남아 있으면 확인이 확인이 아니게 된다.
  useEffect(() => {
    if (open) {
      setTyped('');
    }
  }, [open]);

  const canDelete = typed.trim() === DELETE_CONFIRM_PHRASE && !isDeleting;

  return (
    <Modal open={open} title="삭제" onClose={onClose}>
      <Callout tone="error">
        <span className="font-semibold">「{targetName}」</span> 을(를) 삭제합니다. 되돌릴 수
        없습니다.
        {description ? <span className="block pt-1">{description}</span> : null}
      </Callout>

      {errorMessage ? (
        <Callout tone="error" className="mt-3">
          {errorMessage}
        </Callout>
      ) : null}

      <div className="pt-4">
        <Field
          label={`확인을 위해 "${DELETE_CONFIRM_PHRASE}" 를 그대로 입력해 주세요`}
          htmlFor="delete-confirm"
          required
        >
          <Input
            id="delete-confirm"
            value={typed}
            autoFocus
            placeholder={DELETE_CONFIRM_PHRASE}
            onChange={(event) => setTyped(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canDelete) {
                onConfirm();
              }
            }}
          />
        </Field>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            className="bg-error hover:bg-red-600 disabled:bg-red-200"
            disabled={!canDelete}
            onClick={onConfirm}
          >
            {isDeleting ? '삭제 중' : '삭제'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
        </div>
      </div>
    </Modal>
  );
}
