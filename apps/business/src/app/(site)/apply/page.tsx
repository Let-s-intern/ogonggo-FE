import type { Metadata } from 'next';
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

/**
 * 두 카드는 같은 흰 카드다. 그라데이션·배경 그림·알약 태그를 빼 담백하게 둔다(2026-11-10 사용자: "AI 티"). 주
 * 동작인 광고 신청만 파란 버튼이다.
 */
const CARD =
  'flex flex-col rounded-2xl border border-gray-200 bg-white p-8 transition-[border-color,box-shadow] duration-200 hover:border-gray-300 hover:shadow-md md:p-10';

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 mb-8 space-y-2 border-t border-gray-100 pt-6 text-[15px] text-gray-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span aria-hidden className="mt-[9px] size-1 shrink-0 rounded-full bg-gray-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ApplyChoicePage() {
  return (
    <section className="page-container mx-auto w-full max-w-[1200px] px-4 py-14 md:px-6 md:py-20">
      <div className="text-center">
        <h1 className="text-3xl leading-tight font-bold md:text-[40px]">
          어떤 도움이 필요하신가요?
        </h1>
        <p className="mt-4 text-gray-600">회원가입 없이 바로 진행할 수 있어요.</p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {/* 카드 어디를 눌러도 광고 신청으로 간다(2026-11-10 사용자). */}
        <Link href="/apply/ad" className={`${CARD} group/btn`}>
          <p className="text-sm font-semibold text-blue-600">상품과 일정이 정해졌다면</p>
          <h2 className="mt-3 text-[28px] font-bold">광고 신청하기</h2>
          <p className="mt-2 text-gray-600">원하는 구좌와 기간을 골라 담당자 검토를 요청하세요.</p>
          <Points items={APPLY_POINTS} />
          <span className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full bg-blue-500 px-6 py-3.5 font-semibold text-white transition-colors group-hover/btn:bg-blue-600">
            광고 신청하기
            <Arrow />
          </span>
        </Link>
        <div className={CARD}>
          <p className="text-sm font-semibold text-gray-500">상품 선택이 어렵다면</p>
          <h2 className="mt-3 text-[28px] font-bold">광고 문의하기</h2>
          <p className="mt-2 text-gray-600">
            광고 목적과 희망 예산만 남겨주세요. ({CONTACT_EMAIL})
          </p>
          <Points items={INQUIRY_POINTS} />
          <div className="mt-auto flex flex-wrap gap-2">
            <a
              href={INQUIRY_MAILTO}
              className="group/btn inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-6 py-3.5 font-semibold text-white transition-colors hover:bg-gray-700"
            >
              이메일로 문의하기
              <Arrow />
            </a>
            {/* 상품을 고르기 전에 소개서부터 보게 한다. 새 탭의 PDF 다(2026-11-10 사용자). */}
            <a
              href={AD_INTRODUCTION_PDF}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-6 py-3.5 font-semibold text-gray-900 transition-colors hover:border-gray-900"
            >
              소개서 받기
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
