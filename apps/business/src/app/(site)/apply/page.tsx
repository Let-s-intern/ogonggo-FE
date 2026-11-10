import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { AD_INTRODUCTION_PDF, CONTACT_EMAIL } from '@/shared/config/site';

export const metadata: Metadata = {
  title: '광고 신청 · 문의',
  description:
    '오늘의 공고와 렛츠커리어에 채용·교육 모집 광고를 신청하거나 문의하세요. 회원가입 없이 접수할 수 있어요.',
  alternates: { canonical: '/apply' },
};

/** 광고 문의 폼은 받을 API 가 없어 이메일로 연결한다. 본문에 시안의 문의 항목을 미리 적어 둔다. */
const INQUIRY_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  '[오늘의 공고 광고 문의]',
)}&body=${encodeURIComponent(
  '- 기업·기관명:\n- 담당자 성함 / 연락처:\n- 홍보 대상(채용 공고 / 교육·부트캠프):\n- 광고 목표:\n- 예상 광고 예산:\n- 문의 내용:\n',
)}`;

/** 카드 안 항목 앞의 체크 표시. */
function Check({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={className}>
      <path
        d="M5 10.5l3.2 3L15 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className="size-4 transition-transform duration-200 group-hover/btn:translate-x-0.5"
    >
      <path
        d="M4 10h11m-4-4.5L15.5 10 11 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const APPLY_POINTS = [
  '광고 구좌와 집행 기간을 직접 선택',
  '채용·교육 모집 일정에 맞춰 신청',
  '담당자 확인 후 확정',
];
const INQUIRY_POINTS = [
  '목적과 예산에 맞는 조합 제안',
  '소개서로 상품을 한눈에 확인',
  '24시간 이내 답변',
];

const CARD =
  'group relative isolate flex flex-col overflow-hidden rounded-2xl p-8 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 md:p-10';

export default function ApplyChoicePage() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* 위쪽에 옅은 파란 빛을 깔아 빈 화면이 밋밋하지 않게 한다. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_80%_at_50%_0%,var(--color-blue-50),transparent)]"
      />
      <div className="page-container mx-auto w-full max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-500">광고 신청 · 문의</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-[40px]">
            어떤 도움이 필요하신가요?
          </h1>
          <p className="mt-4 text-gray-600">회원가입 없이 바로 진행할 수 있어요.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {/* 카드 어디를 눌러도 광고 신청으로 간다(2026-11-10 사용자). */}
          <Link
            href="/apply/ad"
            className={`${CARD} group/btn border border-blue-150 bg-gradient-to-br from-blue-00 via-blue-50 to-blue-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/15`}
          >
            <Image
              src="/landing/reasons/clock.png"
              alt=""
              width={155}
              height={155}
              className="pointer-events-none absolute -right-2 -bottom-2 -z-10 h-[150px] w-auto opacity-70 select-none md:h-[180px]"
            />
            <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600 shadow-sm">
              상품과 일정이 정해졌다면
            </span>
            <h2 className="mt-6 text-[28px] font-bold">광고 신청하기</h2>
            <p className="mt-2 text-gray-600">
              원하는 구좌와 기간을 골라 담당자 검토를 요청하세요.
            </p>
            <ul className="mt-6 mb-8 space-y-2.5">
              {APPLY_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="flex size-5 items-center justify-center rounded-full bg-blue-500 text-white">
                    <Check className="size-3.5" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-blue-500 px-6 py-3.5 font-semibold text-white shadow-md shadow-blue-500/25 transition-colors group-hover/btn:bg-blue-600">
              광고 신청하기
              <Arrow />
            </span>
            {/* 오른쪽 카드의 이메일 줄과 높이를 맞춰 두 카드의 버튼이 같은 선에 놓인다. */}
            <p className="mt-4 text-xs text-gray-500">회원가입 없이 3분이면 신청할 수 있어요</p>
          </Link>
          <div
            className={`${CARD} border border-teal-100 bg-gradient-to-br from-white via-teal-50 to-emerald-50 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-500/15`}
          >
            <Image
              src="/landing/reasons/thumbs-up.png"
              alt=""
              width={155}
              height={155}
              className="pointer-events-none absolute -right-2 -bottom-2 -z-10 h-[150px] w-auto opacity-60 select-none md:h-[180px]"
            />
            <span className="self-start rounded-full bg-white px-3 py-1 text-xs font-semibold text-teal-700 shadow-sm">
              상품 선택이 어렵다면
            </span>
            <h2 className="mt-6 text-[28px] font-bold">광고 문의하기</h2>
            <p className="mt-2 text-gray-600">광고 목적과 희망 예산만 남겨주세요.</p>
            <ul className="mt-6 mb-8 space-y-2.5">
              {INQUIRY_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="flex size-5 items-center justify-center rounded-full bg-teal-500 text-white">
                    <Check className="size-3.5" />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-auto flex flex-wrap gap-2">
              <a
                href={INQUIRY_MAILTO}
                className="group/btn inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-6 py-3.5 font-semibold text-white shadow-md shadow-teal-600/25 transition-colors hover:bg-teal-700"
              >
                이메일로 문의하기
                <Arrow />
              </a>
              {/* 상품을 고르기 전에 소개서부터 보게 한다. 새 탭의 PDF 다(2026-11-10 사용자). */}
              <a
                href={AD_INTRODUCTION_PDF}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-teal-600 bg-white px-6 py-3.5 font-semibold text-teal-700 transition-colors hover:bg-teal-50"
              >
                소개서 받기
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-500">{CONTACT_EMAIL}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
