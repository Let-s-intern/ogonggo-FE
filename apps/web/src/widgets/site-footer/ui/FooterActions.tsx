'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { companyJobRegisterHref } from '@/shared/lib/companyJobRegister';
import {
  CONTACT_DIALOG_COPY,
  ContactEmailDialog,
  SUPPORT_PHONE,
} from '@/shared/ui/ContactEmailDialog';

/**
 * 푸터에서 클라이언트여야 하는 두 가지. 푸터 자체는 서버 컴포넌트로 두고 이것만 뺀다.
 *
 * - `제휴 문의`·`고객센터` 는 이메일을 알리는 모달을 연다(`ContactEmailDialog`).
 * - `공고 등록` 은 헤더의 같은 링크처럼 역할에 따라 가는 곳이 다르다 — 기업 회원이면 등록 폼, 그 밖에는
 *   기업 회원 로그인(`shared/lib/companyJobRegister.ts`). 역할은 브라우저에서만 알 수 있다.
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

export function FooterRegisterLink({ className }: { className: string }) {
  const accountState = useMyAccount();
  const role = accountState.kind === 'ready' ? accountState.account.role : undefined;

  return (
    <Link href={companyJobRegisterHref(role)} className={className}>
      공고 등록
    </Link>
  );
}
