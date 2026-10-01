'use client';

import { type FormEvent, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@ogonggo/ui';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? '로그인하지 못했습니다.');
      }
      // 같은 앱 안의 경로로만 돌려보낸다.
      const next = params.get('next');
      router.replace(next?.startsWith('/') && !next.startsWith('//') ? next : '/');
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '로그인하지 못했습니다.');
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(event) => void submit(event)}
      className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm"
    >
      <h1 className="text-lg font-bold">오공고 카드뉴스</h1>
      <p className="text-sm text-gray-500">비밀번호를 입력해 주세요.</p>
      <Input
        type="password"
        aria-label="비밀번호"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <Button type="submit" disabled={busy || !password}>
        {busy ? '확인 중' : '들어가기'}
      </Button>
    </form>
  );
}

/** 비밀번호 하나로 들어가는 로그인 화면(`lib/server/auth.ts`). */
export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
