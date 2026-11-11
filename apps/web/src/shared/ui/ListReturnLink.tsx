'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { readListHref, rememberListHref, type ListKind } from '@/shared/lib/listReturn';

/** 목록이 그려질 때 지금 목록 주소를 적는다(`shared/lib/listReturn.ts`). 화면에는 아무것도 그리지 않는다. */
export function RememberListHref({ kind, href }: { kind: ListKind; href: string }) {
  useEffect(() => rememberListHref(kind, href), [kind, href]);
  return null;
}

/**
 * 상세의 `‹ 목록` 링크. 마지막으로 본 목록 주소로 간다. 서버 렌더와 첫 화면은 `fallback` 이고, 브라우저에서
 * 적어 둔 주소를 읽은 뒤 바꾼다 — 렌더 중에 저장소를 읽으면 서버 HTML 과 달라 하이드레이션이 어긋난다.
 */
export function ListReturnLink({
  kind,
  fallback,
  className,
  children,
}: {
  kind: ListKind;
  fallback: string;
  className?: string;
  children: ReactNode;
}) {
  const [href, setHref] = useState(fallback);
  useEffect(() => {
    setHref(readListHref(kind) ?? fallback);
  }, [kind, fallback]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
