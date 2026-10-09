'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from '@ogonggo/ui';
import { useSignedIn } from '@/shared/api/useSignedIn';

/** 비로그인이 `고민 올리기` 를 누르면 로그인 화면으로 보내고, 로그인하면 이 목록으로 돌아온다. */
const SIGN_IN_HREF = '/login?redirect=/concerns';

export interface ConcernWriteButtonProps {
  className?: string;
  children: ReactNode;
}

/**
 * 로그인한 사용자가 `고민 올리기` 를 눌렀을 때. 작성 모달(`features/concern-form`)은 v13 Push 3 이
 * 만들고, 목록과의 연결은 두 Push 가 머지된 뒤에 한다(PRD 의 `Push 1 + Push 3`). 그 연결이 이 함수를
 * 채운다 — 지금은 모달이 없어 아무 일도 하지 않는다.
 */
function handleWrite() {}

/**
 * 목록 위와 아래 배너에 같은 모양으로 놓이는 `고민 올리기` 버튼. 읽기는 로그인 없이 되고 쓰기만
 * 로그인이 필요하다(PRD 결정 4).
 *
 * 토큰이 브라우저 저장소에만 있어 서버 렌더와 첫 하이드레이션은 늘 비로그인이다. 그래서 처음에는
 * 로그인 링크로 그려졌다가 로그인한 사용자에게는 마운트 뒤 버튼으로 바뀐다. 두 모양이 같아 화면은
 * 튀지 않는다.
 */
export function ConcernWriteButton({ className, children }: ConcernWriteButtonProps) {
  const signedIn = useSignedIn();

  if (!signedIn) {
    return (
      <Button className={className} asChild>
        <Link href={SIGN_IN_HREF}>{children}</Link>
      </Button>
    );
  }

  return (
    <Button type="button" className={className} onClick={handleWrite}>
      {children}
    </Button>
  );
}
