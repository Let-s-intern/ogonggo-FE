import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  passwordConfigured,
  passwordMatches,
  sessionToken,
} from '@/lib/server/auth';

/** 비밀번호가 맞으면 세션 쿠키를 준다. */
export async function POST(request: Request) {
  if (!passwordConfigured()) {
    return NextResponse.json(
      { message: '서버에 비밀번호(CARD_NEWS_PASSWORD)가 설정되지 않았습니다.' },
      { status: 503 },
    );
  }
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const input = typeof body?.password === 'string' ? body.password : '';
  if (!passwordMatches(input)) {
    return NextResponse.json({ message: '비밀번호가 맞지 않습니다.' }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionToken() as string, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
