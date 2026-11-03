'use client';

import { Button } from '@ogonggo/ui';
import { useSignOut } from '../model/useSignOut';

/** 로그아웃 버튼. 하는 일과 `redirectTo` 는 `useSignOut` 에 적었다. */
export function SignOutButton({ redirectTo }: { redirectTo?: string }) {
  const { signOut, pending } = useSignOut();

  return (
    <Button size="sm" variant="secondary" disabled={pending} onClick={() => signOut(redirectTo)}>
      로그아웃
    </Button>
  );
}
