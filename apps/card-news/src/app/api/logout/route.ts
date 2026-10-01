import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/server/auth';

/** 세션 쿠키를 지운다. */
export function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
