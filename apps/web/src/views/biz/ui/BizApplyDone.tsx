'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { MyAccountResponseRole } from '@ogonggo/api';
import { COMPANY_JOB_REGISTER_HREF } from '@/shared/lib/companyJobRegister';

const COMPANY_SIGNUP_HREF = '/signup/company';

interface BizApplyDoneProps {
  email: string;
  /** 로그인한 계정의 역할. 비로그인이면 `undefined`. */
  role: MyAccountResponseRole | undefined;
}

/**
 * 접수 완료 화면(시안 `biz-mock/done.html`, PRD 5절). 폼 자리를 대신한다.
 *
 * 가입은 신청 조건이 아니라 완료 뒤에 권한다(PRD 확정 결정 `가입 퍼널`).
 * - 비로그인·일반 회원: 기업회원 가입 카드. 일반 회원도 보인다 — 기업 계정은 따로다.
 * - 기업 회원: 가입 카드 대신 `공고 등록하러 가기`.
 *
 * `나중에 할게요` 는 가입 카드만 접는다. 접수 안내는 남는다.
 */
export function BizApplyDone({ email, role }: BizApplyDoneProps) {
  const [cardHidden, setCardHidden] = useState(false);
  const isCompany = role === 'COMPANY';

  return (
    <div
      role="status"
      className="rounded-3xl bg-white px-6 py-10 text-center shadow-[0_1px_0_rgba(17,24,39,0.04),0_0_0_1px_var(--color-gray-150)] md:px-12 md:py-12"
    >
      <span className="mx-auto flex size-14 items-center justify-center rounded-[18px] bg-blue-50 text-blue-600">
        <span aria-hidden="true" className="icon-[lucide--check] block size-7" />
      </span>
      <h3 className="mt-5 text-2xl leading-[1.35] font-extrabold tracking-[-0.03em] text-gray-900 md:text-[28px]">
        무료 홍보 신청이 접수되었습니다
      </h3>
      <p className="mt-3 text-base leading-relaxed text-gray-500">
        2일 안에 담당자가 일정을 안내드립니다.
        <br />
        접수 확인 메일을 {email} 으로 보냈어요.
      </p>

      {isCompany ? (
        <Link
          href={COMPANY_JOB_REGISTER_HREF}
          className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-500 text-base font-bold text-white hover:bg-blue-600"
        >
          공고 등록하러 가기
        </Link>
      ) : cardHidden ? null : (
        <>
          <div className="mt-8 rounded-2xl bg-gray-50 p-6 text-left">
            <p className="text-sm font-bold text-blue-600">다음 단계</p>
            <p className="mt-2 text-lg leading-[1.45] font-bold text-gray-900">
              기업회원으로 가입하고
              <br />
              공고를 직접 등록해보세요
            </p>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              가입하면 홍보한 공고의 게시 상태를 확인하고, 다음 공고부터는 직접 등록할 수 있습니다.
            </p>
            <Link
              href={COMPANY_SIGNUP_HREF}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-blue-500 text-base font-bold text-white hover:bg-blue-600"
            >
              기업회원 가입하기
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setCardHidden(true)}
            className="mt-5 text-sm text-gray-500 underline"
          >
            나중에 할게요
          </button>
        </>
      )}
    </div>
  );
}
