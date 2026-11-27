'use client';

import { Button } from '@ogonggo/ui';
import { bizUrl } from '@/shared/api/bizHandoff';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { companyJobRegisterLink } from '@/shared/lib/companyJobRegister';

/**
 * `home.png` 하단 "FOR BUSINESS" CTA 배너. 홈 화면 하단에 쓰고 상세 페이지에도 재사용한다
 * (PRD 10절).
 *
 * `무료로 공고 등록하기` 가 가는 곳은 누르는 사람에 따라 다르다. 기업 회원이면 공고 등록 폼으로
 * 바로 가고, 그 밖에는 일반 회원으로 로그인한 경우까지 **기업 회원 로그인** 이다. 헤더의
 * `공고 등록` 과 같은 규칙이다(`shared/lib/companyJobRegister.ts`).
 *
 * 역할을 알려면 `getMyAccount` 를 불러야 해서 클라이언트 경계다. 로딩 스켈레톤들도 이 컴포넌트를
 * 그대로 쓰므로 함께 클라이언트가 된다 — 그림만 그리는 조각이라 값은 치르지 않는다.
 *
 * `광고 상품 문의하기` 는 비즈 오공고 첫 화면으로 간다(`bizUrl('/')`).
 */
export function ForBusinessBanner() {
  const accountState = useMyAccount();
  const role = accountState.kind === 'ready' ? accountState.account.role : undefined;
  const register = companyJobRegisterLink(role);

  return (
    <section className="rounded-lg bg-blue-50 px-5 py-6 md:px-8 md:py-8">
      <p className="text-xs font-semibold text-blue-600">FOR BUSINESS</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">기업·교육기관 담당자라면?</h2>
          <p className="mt-1 text-sm text-gray-500">
            월 8만 취준생에게 공고를 직접 등록하고, 배너 광고로 더 크게 알려보세요
          </p>
        </div>
        {/* 모바일은 둘을 한 줄에 두면 `광고 상품 문의하기`가 카드 밖으로 밀려 위아래로 쌓는다. */}
        <div className="flex flex-col gap-2 whitespace-nowrap md:flex-row">
          <Button asChild>
            {/* 비즈 오공고로 간다(다른 도메인이라 `a`). */}
            <a href={register.href} onClick={register.onClick}>
              무료로 공고 등록하기
            </a>
          </Button>
          <Button variant="secondary" asChild>
            <a href={bizUrl('/')}>광고 상품 문의하기</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
