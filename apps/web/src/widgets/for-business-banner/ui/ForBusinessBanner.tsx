'use client';

import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { companyJobRegisterHref } from '@/shared/lib/companyJobRegister';

/**
 * `home.png` 하단 "FOR BUSINESS" CTA 배너. 홈 화면 하단에 쓰고 상세 페이지에도 재사용한다
 * (PRD 10절).
 *
 * `무료로 공고 등록하기` 가 가는 곳은 누르는 사람에 따라 다르다. 기업 회원이면 공고 등록 폼으로
 * 바로 가고, 그 밖에는 **기업 회원 로그인**(`/login?tab=company`) 이다. 헤더의 `공고 등록` 은
 * 같은 자리에서 기업 회원가입으로 보내는데, 이 배너의 글이 이미 가입을 권하는 광고라 여기서는
 * 계정이 있는 사람의 길을 먼저 연다.
 *
 * 역할을 알려면 `getMyAccount` 를 불러야 해서 클라이언트 경계다. 로딩 스켈레톤들도 이 컴포넌트를
 * 그대로 쓰므로 함께 클라이언트가 된다 — 그림만 그리는 조각이라 값은 치르지 않는다.
 *
 * `광고 상품 문의하기` 는 아직 갈 곳이 없어 그대로 둔다(눌러도 아무 일도 일어나지 않는다).
 */
export function ForBusinessBanner() {
  const accountState = useMyAccount();
  const role = accountState.kind === 'ready' ? accountState.account.role : undefined;
  const registerHref = companyJobRegisterHref(role, '/login?tab=company');

  return (
    <section className="rounded-lg bg-blue-50 px-8 py-8">
      <p className="text-xs font-semibold text-blue-600">FOR BUSINESS</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">기업·교육기관 담당자라면?</h2>
          <p className="mt-1 text-sm text-gray-500">
            월 8만 취준생에게 공고를 직접 등록하고, 배너 광고로 더 크게 알려보세요
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={registerHref}>무료로 공고 등록하기</Link>
          </Button>
          <Button variant="secondary">광고 상품 문의하기</Button>
        </div>
      </div>
    </section>
  );
}
