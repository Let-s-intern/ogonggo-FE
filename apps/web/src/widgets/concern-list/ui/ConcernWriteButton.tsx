'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Button } from '@ogonggo/ui';
import { ConcernFormModal } from '@/features/concern-form';
import { useSignedIn } from '@/shared/api/useSignedIn';

/** 비로그인이 `고민 올리기` 를 누르면 로그인 화면으로 보내고, 로그인하면 이 목록으로 돌아온다. */
const SIGN_IN_HREF = '/login?redirect=/concerns';

export interface ConcernWriteButtonProps {
  className?: string;
  children: ReactNode;
}

/**
 * 목록 위와 아래 배너에 같은 모양으로 놓이는 `고민 올리기` 버튼. 읽기는 로그인 없이 되고 쓰기만
 * 로그인이 필요하다(PRD 결정 4). 로그인한 사용자가 누르면 작성 모달(`features/concern-form`)이 열리고,
 * 등록하면 모달이 새 글 상세(`/concerns/<id>`)로 보낸다. 버튼마다 모달을 하나씩 갖는다 — 위와 아래
 * 버튼이 함께 열릴 일은 없다.
 *
 * 토큰이 브라우저 저장소에만 있어 서버 렌더와 첫 하이드레이션은 늘 비로그인이다. 그래서 처음에는
 * 로그인 링크로 그려졌다가 로그인한 사용자에게는 마운트 뒤 버튼으로 바뀐다. 두 모양이 같아 화면은
 * 튀지 않는다.
 */
export function ConcernWriteButton({ className, children }: ConcernWriteButtonProps) {
  const signedIn = useSignedIn();
  const [open, setOpen] = useState(false);

  if (!signedIn) {
    return (
      <Button className={className} asChild>
        <Link href={SIGN_IN_HREF}>{children}</Link>
      </Button>
    );
  }

  return (
    <>
      <Button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ConcernFormModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
