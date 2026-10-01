'use client';

import { type FormEvent, useState } from 'react';
import { Button, Modal, Textarea } from '@ogonggo/ui';

interface RegenerateModalProps {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmit: (instruction: string) => void;
}

const EXAMPLES = [
  '제목을 더 짧고 임팩트 있게',
  '첫 인턴 경험을 강조해 줘',
  '담당 업무를 4개로 줄여 줘',
  '자격 요건을 더 쉬운 말로',
];

/**
 * 다시 쓰기. 어떻게 바꿀지 적으면 AI 가 지금 초안을 그 지시대로 고친다. 비워 두면 다른 표현으로
 * 새로 쓴다. 문구만 바뀌고 색·배경·3장 안내는 그대로다.
 */
export function RegenerateModal({ open, busy, onClose, onSubmit }: RegenerateModalProps) {
  const [instruction, setInstruction] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(instruction.trim());
  };

  return (
    <Modal
      open={open}
      title="AI로 다시 쓰기"
      description="어떻게 바꿀지 적어 주세요. 비워 두면 다른 표현으로 새로 씁니다."
      onClose={onClose}
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Textarea
          aria-label="추가 지시"
          rows={4}
          autoFocus
          placeholder="예: 제목에 '대규모 채용'을 넣고, 담당 업무는 3개만"
          value={instruction}
          onChange={(event) => setInstruction(event.target.value)}
        />
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() =>
                setInstruction((current) => (current ? `${current}\n${example}` : example))
              }
              className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              {example}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            닫기
          </Button>
          <Button type="submit" size="sm" disabled={busy}>
            {busy ? '쓰는 중' : '다시 쓰기'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
