'use client';

import { useEffect, useId, useState } from 'react';
import { Button, Callout, Modal, Textarea } from '@ogonggo/ui';

/** 신고 사유 최대 길이. 백엔드 `CreateRecruitmentPostCommentReportRequest.reason` 의 500 자다. */
const MAX_REASON_LENGTH = 500;

export interface ReportCommentModalProps {
  open: boolean;
  pending: boolean;
  errorMessage?: string;
  /** 사유. 비어 있으면 사유 없이 신고한다. */
  onSubmit: (reason: string) => void;
  onClose: () => void;
}

/**
 * 댓글 신고. 사유는 선택이다 — 백엔드가 생략을 받는다(생성 타입 설명). 고르는 목록이 아니라
 * 자유 입력인 것도 백엔드가 사유 종류를 두지 않아서다.
 */
export function ReportCommentModal({
  open,
  pending,
  errorMessage,
  onSubmit,
  onClose,
}: ReportCommentModalProps) {
  const id = useId();
  const [reason, setReason] = useState('');

  // 열 때마다 비운다. 앞서 다른 댓글에 쓰던 사유가 남으면 엉뚱한 사유로 신고된다.
  useEffect(() => {
    if (open) {
      setReason('');
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title="댓글 신고"
      description="운영 정책에 맞지 않는 댓글을 알려 주세요. 사유는 적지 않아도 됩니다."
      onClose={onClose}
    >
      <label htmlFor={id} className="sr-only">
        신고 사유
      </label>
      <Textarea
        id={id}
        rows={4}
        value={reason}
        maxLength={MAX_REASON_LENGTH}
        placeholder="신고 사유(선택)"
        onChange={(event) => setReason(event.target.value)}
        className="resize-none"
      />
      {errorMessage ? (
        <Callout tone="error" className="mt-3">
          {errorMessage}
        </Callout>
      ) : null}
      <div className="flex items-center gap-2 pt-4">
        <Button disabled={pending} onClick={() => onSubmit(reason.trim())}>
          {pending ? '신고 중' : '신고하기'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
      </div>
    </Modal>
  );
}
