'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { Button, cn, Textarea } from '@ogonggo/ui';
import { COMMENT_MAX_LENGTH } from '../api/concernCommentsApi';

export interface ConcernCommentComposerProps {
  placeholder: string;
  /** 버튼 이름. 답변은 `답변 등록하기`, 답글은 `답글 등록` 처럼 무엇을 쓰는지 드러낸다. */
  submitLabel: string;
  pending: boolean;
  /** 성공하면 resolve, 실패하면 reject 한다. 성공했을 때만 입력을 비운다. */
  onSubmit: (content: string) => Promise<unknown>;
  onCancel?: () => void;
  autoFocus?: boolean;
  rows?: number;
  /**
   * 로그인하지 않았으면 이 주소(로그인 화면) 다. 입력칸은 잠그고 등록 버튼 자리에 로그인 링크를 둔다 —
   * 칸의 크기는 그대로라 로그인 여부를 아는 순간(마운트 뒤) 화면이 움직이지 않는다.
   */
  signInHref?: string | null;
  /** 로그인하지 않았을 때 링크 이름. */
  signInLabel?: string;
}

/**
 * 답변·답글 입력칸. 시안(`상세.webp`) 의 회색 입력칸과 오른쪽 아래 파란 버튼이다. 길이는 1000 자까지만
 * 쳐지고(`maxLength`, 백엔드도 400) 남은 글자는 왼쪽 아래에 보인다. 붙여 넣은 글이 넘으면 브라우저가
 * 1000 자에서 자른다 — 1001 자는 보내기 전에 막힌다.
 *
 * 공백만 있는 글은 보내지 않는다. 백엔드도 `@NotBlank` 로 400 을 준다.
 */
export function ConcernCommentComposer({
  placeholder,
  submitLabel,
  pending,
  onSubmit,
  onCancel,
  autoFocus,
  rows = 4,
  signInHref = null,
  signInLabel = '로그인하고 답변하기',
}: ConcernCommentComposerProps) {
  const id = useId();
  const [content, setContent] = useState('');
  const trimmed = content.trim();
  const locked = signInHref !== null;

  const submit = () => {
    if (!trimmed || pending || trimmed.length > COMMENT_MAX_LENGTH) {
      return;
    }
    // 실패는 부르는 쪽이 토스트로 알린다. 입력은 그대로 두어 다시 보낼 수 있게 한다.
    onSubmit(trimmed).then(
      () => setContent(''),
      () => undefined,
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Textarea
        id={id}
        rows={rows}
        value={content}
        maxLength={COMMENT_MAX_LENGTH}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={locked}
        onChange={(event) => setContent(event.target.value)}
        className={cn('resize-none border-transparent bg-gray-100 enabled:hover:border-gray-300')}
      />
      <div className="flex items-center justify-end gap-2">
        {locked ? null : (
          <span className="mr-auto text-xs text-gray-400">
            {content.length}/{COMMENT_MAX_LENGTH}
          </span>
        )}
        {onCancel ? (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            취소
          </Button>
        ) : null}
        {locked ? (
          <Button asChild size="sm">
            <Link href={signInHref}>{signInLabel}</Link>
          </Button>
        ) : (
          <Button type="button" size="sm" disabled={!trimmed || pending} onClick={submit}>
            {pending ? '등록 중' : submitLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
