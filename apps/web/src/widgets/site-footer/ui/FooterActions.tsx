'use client';

import { useState } from 'react';
import {
  CONTACT_DIALOG_COPY,
  ContactEmailDialog,
  SUPPORT_PHONE,
} from '@/shared/ui/ContactEmailDialog';

/**
 * 푸터에서 클라이언트여야 하는 부분. 푸터 자체는 서버 컴포넌트로 두고 이것만 뺀다.
 *
 * `제휴 문의`·`고객센터` 는 이메일을 알리는 모달을 연다(`ContactEmailDialog`).
 */
export function FooterContactButton({
  kind,
  className,
}: {
  kind: 'partnership' | 'support';
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const copy = CONTACT_DIALOG_COPY[kind];

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {kind === 'partnership' ? '제휴 문의' : '고객센터'}
      </button>
      <ContactEmailDialog
        open={open}
        onClose={() => setOpen(false)}
        {...copy}
        phone={kind === 'support' ? SUPPORT_PHONE : undefined}
      />
    </>
  );
}
