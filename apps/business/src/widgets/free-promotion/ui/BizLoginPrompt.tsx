'use client';

import Link from 'next/link';
import { cn } from '@ogonggo/ui';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { loginHref } from '@/shared/lib/returnPath';

/** 로그인 뒤 신청 구역으로 돌아온다. */
const LOGIN_HREF = loginHref('/free-promotion#apply');

/**
 * 기존 기업 회원에게 로그인을 권한다(2026-11-10 사용자). 로그인하면 신청서가 기업 정보로 채워지고
 * (`BizApplyForm` 의 미리 채우기), 서버가 신청을 그 회원에게 묶는다. 로그인한 사람에게는 보이지 않는다.
 *
 * 토큰이 브라우저 저장소에만 있어 서버 렌더는 늘 로그아웃 상태다. 로그인한 사람은 마운트 뒤 사라진다.
 */
export function BizLoginPrompt({ variant }: { variant: 'inline' | 'card' }) {
  const account = useMyAccount();
  if (account.kind !== 'signedOut') return null;

  if (variant === 'inline') {
    return (
      <p className="mt-5 text-sm text-gray-600">
        이미 기업 회원이신가요?{' '}
        <Link
          href={LOGIN_HREF}
          className="font-semibold text-blue-600 underline underline-offset-2"
        >
          로그인
        </Link>
        하면 신청서에 회사 정보가 자동으로 채워져요.
      </p>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-blue-600">기존 기업 회원이라면</p>
      <p className="mt-2 text-lg leading-snug font-bold text-gray-900">
        로그인하고 더 빠르게 신청하세요
      </p>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        회사명과 담당자 정보가 미리 채워지고, 홍보한 공고를 내 계정에서 이어서 관리할 수 있어요.
      </p>
      <Link
        href={LOGIN_HREF}
        className={cn(
          'mt-5 w-full',
          'inline-flex items-center justify-center rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-700',
        )}
      >
        로그인하고 신청하기
      </Link>
    </div>
  );
}
