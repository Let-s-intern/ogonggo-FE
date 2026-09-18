'use client';

import { type FormEvent, useState } from 'react';
import { Button, Input } from '@ogonggo/ui';
import { RecentSignInBubble } from './RecentSignInBubble';

export interface SignInFormProps {
  /** 제출 중이면 버튼을 막는다. 실패 문구는 `error` 로 받는다. */
  onSubmit: (credentials: { email: string; password: string }) => void;
  pending: boolean;
  error: string | null;
}

/**
 * 이메일·비밀번호 폼. 일반 회원(렛츠커리어) 과 기업 회원(오공고) 탭이 같은 모양을 쓰고, 보내는 곳만
 * 다르다.
 *
 * 마지막 로그인이 이메일(일반·기업 모두) 이면 로그인 버튼 오른쪽 위에 "최근 로그인" 말풍선이 뜬다. 버튼 바로
 * 위 가운데는 비밀번호 칸이라 입력 글자를 가리므로 오른쪽에 둔다.
 *
 * 칸 이름은 디자인대로 자리표시 글자로만 보인다. 화면에 라벨이 없으므로 `aria-label` 로 이름을 준다.
 */
export function SignInForm({ onSubmit, pending, error }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [missing, setMissing] = useState(false);

  // 빈 칸이어도 버튼을 막지 않는다. 디자인이 빈 폼에서도 버튼을 켜 두고, 막힌 버튼은 왜 막혔는지 말하지 않는다.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) {
      return;
    }
    const blank = !email.trim() || !password;
    setMissing(blank);
    if (!blank) {
      onSubmit({ email: email.trim(), password });
    }
  };

  const message = missing ? '이메일과 비밀번호를 입력해 주세요.' : error;

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit} noValidate>
      <Input
        type="email"
        name="email"
        autoComplete="email"
        aria-label="이메일"
        placeholder="이메일"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        aria-invalid={message ? true : undefined}
        className="h-14 rounded-xs"
      />
      <Input
        type="password"
        name="password"
        autoComplete="current-password"
        aria-label="비밀번호"
        placeholder="비밀번호"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-invalid={message ? true : undefined}
        className="h-14 rounded-xs"
      />
      {message ? (
        <p role="alert" className="pt-1 text-sm text-error">
          {message}
        </p>
      ) : null}
      <div className="relative">
        <RecentSignInBubble method="email" className="absolute -top-4 right-4 z-10" />
        <Button type="submit" className="h-12 w-full rounded-xs" disabled={pending}>
          {pending ? '로그인 중...' : '로그인'}
        </Button>
      </div>
    </form>
  );
}
