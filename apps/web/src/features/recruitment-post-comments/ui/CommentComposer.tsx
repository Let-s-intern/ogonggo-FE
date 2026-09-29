'use client';

import { useId, useState } from 'react';
import { Button, Textarea } from '@ogonggo/ui';

/** 댓글 본문 최대 길이. 백엔드 `@Size(max = 1000)` 과 같다. */
const MAX_LENGTH = 1000;

export interface CommentComposerProps {
  placeholder: string;
  /** 버튼 이름. 부모 댓글은 `등록`, 대댓글은 `답글 등록` 처럼 무엇을 쓰는지 드러낸다. */
  submitLabel: string;
  pending: boolean;
  /** 성공하면 resolve, 실패하면 reject 한다. 성공했을 때만 입력을 비운다. */
  onSubmit: (content: string) => Promise<unknown>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

/**
 * 댓글·대댓글 입력칸. 목업(`사이드스터디 상세페이지.png`) 의 `응원과 질문을 남겨보세요...` 한 줄
 * 입력에 등록 버튼을 붙였다 — 목업에는 버튼이 없지만 여러 줄을 쓸 수 있는 칸에서 Enter 만으로
 * 보내면 줄바꿈을 쓸 수 없다.
 *
 * 공백만 있는 글은 보내지 않는다. 백엔드도 `@NotBlank` 로 400 을 준다.
 */
export function CommentComposer({
  placeholder,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  autoFocus,
}: CommentComposerProps) {
  const id = useId();
  const [content, setContent] = useState('');
  const trimmed = content.trim();

  const submit = () => {
    if (!trimmed || pending) {
      return;
    }
    // 실패는 부르는 쪽이 토스트로 알린다. 입력은 그대로 두어 다시 보낼 수 있게 한다.
    onSubmit(trimmed).then(
      () => setContent(''),
      () => undefined,
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Textarea
        id={id}
        rows={2}
        value={content}
        maxLength={MAX_LENGTH}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(event) => setContent(event.target.value)}
        className="resize-none"
      />
      <div className="flex items-center justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
        ) : null}
        <Button type="button" size="sm" disabled={!trimmed || pending} onClick={submit}>
          {pending ? '등록 중' : submitLabel}
        </Button>
      </div>
    </div>
  );
}
