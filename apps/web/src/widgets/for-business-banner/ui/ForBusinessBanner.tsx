'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { Button, cn } from '@ogonggo/ui';
import { useInstallState } from '@/features/install-app';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { companyJobRegisterHref } from '@/shared/lib/companyJobRegister';
import { CONTACT_DIALOG_COPY, ContactEmailDialog } from '@/shared/ui/ContactEmailDialog';

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
 * `광고 상품 문의하기` 는 문의할 이메일을 모달로 알린다(`ContactEmailDialog`).
 */
export function ForBusinessBanner() {
  const accountState = useMyAccount();
  const role = accountState.kind === 'ready' ? accountState.account.role : undefined;
  const registerHref = companyJobRegisterHref(role);
  const [adInquiryOpen, setAdInquiryOpen] = useState(false);
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const installed = useInstallState().kind === 'installed';
  /*
   * 모바일에서 웹 앱을 설치하고 로그인한 일반 회원에게는 숨긴다 — 기업·교육기관 담당자에게 하는 말이라
   * 그 사람에게는 쓸모가 없고, 앱처럼 쓰는 화면에서 자리만 차지한다. 역할을 아직 모르면 숨겨 둔다
   * (기업 회원이면 알고 나서 나타난다). 데스크톱은 그대로다.
   *
   * 배너를 감싼 페이지의 칸까지 없애야 빈 틈이 남지 않는다. 그래서 숨길 때는 `data-for-business-hidden`
   * 을 달고, 모바일에서 그것을 바로 품은 칸을 `app/globals.css` 가 접는다.
   */
  const hiddenOnMobile = installed && signedIn && role !== 'COMPANY';

  return (
    <section
      data-for-business-hidden={hiddenOnMobile ? '' : undefined}
      className={cn(
        'rounded-lg bg-blue-50 px-5 py-6 md:px-8 md:py-8',
        hiddenOnMobile && 'max-md:hidden',
      )}
    >
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
            <Link href={registerHref}>무료로 공고 등록하기</Link>
          </Button>
          <Button variant="secondary" onClick={() => setAdInquiryOpen(true)}>
            광고 상품 문의하기
          </Button>
        </div>
      </div>
      <ContactEmailDialog
        open={adInquiryOpen}
        onClose={() => setAdInquiryOpen(false)}
        {...CONTACT_DIALOG_COPY.advertisement}
      />
    </section>
  );
}
