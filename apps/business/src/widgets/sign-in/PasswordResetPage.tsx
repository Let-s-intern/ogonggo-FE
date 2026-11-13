'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { HttpError, resetCompanyPassword } from '@ogonggo/api';
import { Button, Input } from '@ogonggo/ui';

/**
 * 기업 회원 비밀번호 찾기(BE LC-3600 `POST /api/v1/auth/company/password-resets`). 이메일을 보내면 서버가 비밀번호를
 * 임시 비밀번호로 바꾸고 메일로 보낸다. 재설정 링크는 없다.
 *
 * 서버는 계정이 없거나 정지·탈퇴여도, 5분 안에 다시 요청해도 같은 200 을 준다(계정이 있는지 드러내지 않는다). 그래서 화면도
 * 보냈다는 말 하나만 하고 메일이 오지 않을 때의 경우를 함께 적는다. 받은 비밀번호는 로그인 뒤
 * `/mypage/company/profile` 의 비밀번호 변경에서 바꾼다.
 */
export function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'pending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === 'pending') {
      return;
    }
    const trimmed = email.trim();
    if (!trimmed) {
      setError('이메일을 입력해 주세요.');
      return;
    }
    setState('pending');
    setError(null);
    try {
      await resetCompanyPassword({ email: trimmed });
      setState('sent');
    } catch (caught) {
      setError(
        caught instanceof HttpError && caught.status === 400
          ? '이메일 형식이 올바르지 않습니다.'
          : '요청하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      );
      setState('idle');
    }
  };

  return (
    <div className="flex justify-center px-5 pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="flex w-full max-w-104 flex-col">
        <h1 className="text-center text-xl font-bold text-gray-900">비밀번호 찾기</h1>
        {state === 'sent' ? (
          <>
            <p className="pt-2 pb-8 text-center text-sm text-gray-500">
              {email.trim()} 로 임시 비밀번호를 보냈습니다.
            </p>
            <p className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-700">
              메일의 임시 비밀번호로 로그인한 뒤 마이페이지의 기업/기관 정보에서 비밀번호를 바꿔
              주세요. 메일이 오지 않으면 기업 회원으로 가입한 이메일인지 확인해 주세요. 같은
              이메일은 5분에 한 번만 보낼 수 있습니다.
            </p>
            <Button asChild className="mt-6 h-12 w-full rounded-xs">
              <Link href="/login">로그인하러 가기</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="pt-2 pb-8 text-center text-sm text-gray-500">
              가입한 업무용 이메일로 임시 비밀번호를 보내 드립니다.
            </p>
            <form className="flex flex-col gap-2" onSubmit={handleSubmit} noValidate>
              <Input
                type="email"
                name="email"
                autoComplete="email"
                aria-label="업무용 이메일"
                placeholder="업무용 이메일"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={error ? true : undefined}
                className="h-14 rounded-xs"
              />
              {error ? (
                <p role="alert" className="pt-1 text-sm text-error">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                className="h-12 w-full rounded-xs"
                disabled={state === 'pending'}
              >
                {state === 'pending' ? '보내는 중...' : '임시 비밀번호 받기'}
              </Button>
            </form>
            <div className="flex justify-center pt-12 text-sm">
              <Link href="/login" className="font-medium text-gray-900 hover:underline">
                로그인으로 돌아가기
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
