'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Callout } from '@ogonggo/ui';
import { letsCareerGuidebookPurchaseUrl } from '@/shared/api/letsCareerHandoff';
import { useMyAccount } from '@/shared/api/useMyAccount';
import { usePurchaseWindow } from '../model/usePurchaseWindow';
import { PurchaseFollowUp } from './PurchaseFollowUp';

export interface PurchaseButtonProps {
  guidebookId: number;
  /** 결제가 끝나고 창이 닫히지 않을 때 렛츠커리어가 같은 창을 옮길 곳. 이 상품의 오공고 판매 상세 주소다. */
  returnUrl: string;
  /** 결제 금액(`990원`). 주면 모바일(`md` 미만)에서 버튼 글자에 붙인다 — 떠 있는 바에 가격 줄을 따로 두지 않으려는 것이다. */
  priceLabel?: string;
}

/**
 * 구매 버튼. 누른 사람에 따라 갈린다(PRD 6장 2~3).
 *
 * - 비로그인: 오공고 로그인으로 보낸다. 로그인하면 지금 화면으로 돌아온다(`/login?redirect=`).
 * - 기업 회원: 일반 회원 계정이 필요하다는 안내를 버튼 아래에 보인다.
 * - 일반 회원(관리자 포함): 렛츠커리어 구매 창을 팝업으로 연다. 열기가 막히면 새 탭으로 여는 링크를 보인다.
 *   창이 닫히거나 이 화면으로 돌아오면 구매 후 안내를 보인다(`usePurchaseWindow`).
 *
 * 로그인 여부와 역할은 `useMyAccount` 가 읽는다. 토큰이 브라우저 저장소에만 있어 서버 렌더는 늘 비로그인으로
 * 그린다. 역할을 읽는 동안(`loading`)은 누를 수 없다. 계정을 읽지 못했을 때(`error`)는 기업 회원인지 알 수 없지만
 * 막지 않는다 — 구매 창은 렛츠커리어가 로그인을 이어 받거나 요구한다.
 */
export function PurchaseButton({ guidebookId, returnUrl, priceLabel }: PurchaseButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const account = useMyAccount();
  const [companyNotice, setCompanyNotice] = useState(false);
  const purchaseWindow = usePurchaseWindow();

  const handleClick = () => {
    setCompanyNotice(false);
    if (account.kind === 'signedOut') {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    if (account.kind === 'ready' && account.account.role === 'COMPANY') {
      setCompanyNotice(true);
      return;
    }
    // 클릭 처리 안에서 바로 연다. 비동기 뒤에 열면 팝업 차단기가 막는다.
    purchaseWindow.open(letsCareerGuidebookPurchaseUrl(guidebookId, returnUrl));
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        className="w-full"
        onClick={handleClick}
        disabled={account.kind === 'loading'}
      >
        {priceLabel ? <span className="md:hidden">{priceLabel}&nbsp;</span> : null}구매하기
      </Button>
      {companyNotice ? (
        <Callout tone="warning">
          기업 회원 계정으로는 구매할 수 없어요. 일반 회원 계정으로 로그인해 주세요.
        </Callout>
      ) : null}
      {purchaseWindow.blockedUrl ? (
        <p className="text-sm break-keep text-gray-600">
          구매 창이 열리지 않았어요.{' '}
          <a
            href={purchaseWindow.blockedUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={purchaseWindow.markOpened}
            className="font-semibold text-blue-500 underline"
          >
            새 탭에서 구매 화면 열기
          </a>
        </p>
      ) : null}
      {purchaseWindow.settled ? <PurchaseFollowUp /> : null}
    </div>
  );
}
