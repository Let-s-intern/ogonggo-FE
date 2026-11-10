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

export default function ApplyChoicePage() {
  return (
    <section className="page-container mx-auto max-w-[1200px] px-4 py-12 md:px-6">
      <p className="text-sm font-semibold text-blue-500">START HERE</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold">어떤 도움이 필요하신가요?</h1>
        <p className="text-sm text-gray-500">회원가입 없이 진행할 수 있습니다</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-start rounded-xl border border-blue-300 bg-blue-00 p-8">
          <span className="rounded-sm bg-blue-50 px-2.5 py-1 text-xs text-blue-600">
            상품과 일정이 정해졌다면
          </span>
          <h3 className="mt-5 text-2xl font-bold">광고 신청하기</h3>
          <p className="mt-3 mb-6 text-gray-600">
            원하는 광고 구좌와 집행 기간을 직접 선택하고
            <br />
            담당자 검토를 요청하세요.
          </p>
          <Link
            href="/apply/ad"
            className="mt-auto inline-flex rounded-md bg-blue-500 px-6 py-3.5 font-semibold text-white hover:bg-blue-600"
          >
            광고 신청하기
          </Link>
        </div>
        <div className="flex flex-col items-start rounded-xl border border-gray-200 p-8">
          <span className="rounded-sm bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
            상품 선택이 어렵다면
          </span>
          <h3 className="mt-5 text-2xl font-bold">광고 문의하기</h3>
          <p className="mt-3 mb-6 text-gray-600">
            광고 목적과 희망 예산만 남겨주세요.
            <br />
            상황에 맞는 상품과 집행 방식을 안내합니다. ({CONTACT_EMAIL})
          </p>
          <div className="mt-auto flex flex-wrap gap-2">
            <a
              href={INQUIRY_MAILTO}
              className="inline-flex rounded-md border border-gray-300 px-6 py-3.5 font-semibold hover:border-gray-900"
            >
              이메일로 문의하기
            </a>
            {/* 상품을 고르기 전에 소개서부터 보게 한다. 새 탭의 PDF 다(2026-11-10 사용자). */}
            <a
              href={AD_INTRODUCTION_PDF}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-md border border-blue-500 px-6 py-3.5 font-semibold text-blue-500 hover:bg-blue-00"
            >
              소개서 받기
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
