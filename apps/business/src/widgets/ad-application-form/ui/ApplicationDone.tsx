import Link from 'next/link';
import { Button } from '@ogonggo/ui';

export interface ApplicationDoneProps {
  applicationNo: string;
  couponOnly: boolean;
  /** 신청하며 가입했으면 그 이메일. */
  newAccountEmail?: string;
  /** 신청하며 등록한 새 공고 제목. */
  newJobTitle?: string;
}

/**
 * 접수 완료(시안 B-04 완료). 신청번호와 다음 단계. 비회원은 가입이 끝나 로그인 상태가 되었으므로 `신청 내역 보기` 로
 * 마이페이지 광고 목록에 바로 간다 — 비회원 조회 화면은 두지 않는다(`memos/결정-광고시스템-business-신청서-2026-11-03.md`).
 */
export function ApplicationDone({
  applicationNo,
  couponOnly,
  newAccountEmail,
  newJobTitle,
}: ApplicationDoneProps) {
  return (
    <section className="flex flex-col items-center gap-4 rounded-md border border-gray-200 bg-white px-5 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
        <span aria-hidden="true" className="icon-[lucide--check] block h-6 w-6" />
      </span>
      <h1 className="text-2xl font-bold text-gray-950">광고 신청이 접수됐어요</h1>
      <p className="text-base text-gray-700">
        신청번호 <strong className="font-bold text-gray-950">{applicationNo}</strong>
      </p>
      <p className="max-w-lg text-sm leading-relaxed text-gray-600">
        {couponOnly
          ? '쿠폰 신청이라 소재 검수 후 게재일을 안내드려요. 담당자 메일로도 보내드렸어요.'
          : '영업일 2일 안에 담당자 메일로 견적서를 보내드려요. 견적 확인 후 계약·입금이 진행돼요.'}
      </p>
      {newAccountEmail || newJobTitle ? (
        <p className="max-w-lg rounded-md bg-blue-00 px-4 py-3 text-sm leading-relaxed text-blue-700">
          {newAccountEmail
            ? `기업회원 가입이 완료됐어요 (${newAccountEmail}). 지금 로그인된 상태라 마이페이지에서 진행 상황을 볼 수 있어요. `
            : ''}
          {newJobTitle
            ? `새 공고 "${newJobTitle}"은 공고 검수 후 게시되며, 게시와 동시에 광고 검수가 이어져요.`
            : ''}
        </p>
      ) : null}
      <div className="flex gap-2 pt-2">
        <Button asChild variant="secondary">
          <Link href="/">광고 홈으로</Link>
        </Button>
        <Button asChild>
          <Link href="/mypage/company/ads">신청 내역 보기</Link>
        </Button>
      </div>
    </section>
  );
}
