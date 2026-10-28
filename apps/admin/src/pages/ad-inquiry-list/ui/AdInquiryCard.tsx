import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@ogonggo/ui';
import { type AdminAdvertisementInquiryResponse, enumLabel } from '@ogonggo/api/src/admin';
import { AdInquiryMemberTypeBadge, AdInquiryStatusBadge } from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';
import { inflowName, inflowRawParts } from '../model/inflow';

/**
 * 광고 문의 카드 한 장(PRD `어드민 화면` 표). 위에서 아래로 머리, 출처, 신청 내용, 설문, 처리. 상세 화면은
 * 따로 없다 — 카드에 모든 값이 있다.
 */
export function AdInquiryCard({
  inquiry,
  actions,
}: {
  inquiry: AdminAdvertisementInquiryResponse;
  /** 처리 구역(상태 변경·메모). */
  actions: ReactNode;
}) {
  const rawParts = inflowRawParts(inquiry);

  return (
    <article className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      <header className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <AdInquiryStatusBadge value={inquiry.status} />
            <h2 className="text-lg font-bold text-gray-900">{inquiry.companyName}</h2>
            <CompanyNameSourceTag value={inquiry.companyNameSource} />
          </div>
          <time
            dateTime={inquiry.registeredAt}
            className="shrink-0 text-sm whitespace-nowrap text-gray-500"
          >
            {formatDateTime(inquiry.registeredAt)}
          </time>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
          <span>
            {inquiry.managerName}
            {inquiry.managerTitle ? ` · ${inquiry.managerTitle}` : ''}
          </span>
          <span className="flex items-center gap-1">
            {inquiry.phoneNumber}
            <CopyButton value={inquiry.phoneNumber} label="연락처" />
          </span>
          <span className="flex items-center gap-1">
            {inquiry.email}
            <CopyButton value={inquiry.email} label="이메일" />
          </span>
        </div>
      </header>

      <Section title="출처">
        <div className="flex flex-wrap items-center gap-2">
          <span>
            {enumLabel('AdvertisementInquiryType', inquiry.inquiryType)}
            {inquiry.campaignCode ? (
              <span className="text-gray-500"> · {inquiry.campaignCode}</span>
            ) : null}
          </span>
          <MemberLink inquiry={inquiry} />
        </div>
        <p className="mt-1.5">
          {inflowName(inquiry)}
          {rawParts.length > 0 ? (
            <span className="text-gray-400"> · {rawParts.join(' · ')}</span>
          ) : null}
        </p>
      </Section>

      <Section title="신청 내용">
        <p>{enumLabel('AdvertisementInquiryPromotionChannel', inquiry.promotionChannel)}</p>
        <p className="mt-1">채용 직무 {inquiry.hiringJobName ?? '-'}</p>
        <p className="mt-1">
          공고 링크{' '}
          {inquiry.jobPostingUrl ? (
            <a
              href={externalHref(inquiry.jobPostingUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-blue-600 hover:underline"
            >
              {inquiry.jobPostingUrl}
            </a>
          ) : (
            '-'
          )}
        </p>
      </Section>

      <Section title="설문">
        <FoldedText text={inquiry.promotionAnswer} />
        <p className="mt-2 text-gray-500">
          마케팅 정보 수신 {inquiry.marketingConsent ? '동의' : '미동의'}
        </p>
      </Section>

      <Section title="처리">{actions}</Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex gap-4 px-5 py-3 text-sm text-gray-900">
      <h3 className="w-16 shrink-0 pt-px text-xs font-medium text-gray-400">{title}</h3>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  );
}

/**
 * 회사명 입력 방식. 영업이 이름을 정리할 행을 찾기 쉽게 `직접 입력` 만 주황 테두리로 띄우고, 나머지는 회색 글자다.
 */
function CompanyNameSourceTag({
  value,
}: {
  value: AdminAdvertisementInquiryResponse['companyNameSource'];
}) {
  const label = enumLabel('AdvertisementInquiryCompanyNameSource', value);
  return value === 'MANUAL' ? (
    <span className="rounded-sm border border-orange-400 px-1.5 py-px text-xs font-medium text-orange-600">
      {label}
    </span>
  ) : (
    <span className="text-xs text-gray-400">{label}</span>
  );
}

/** 회원 구분 배지. 회원이면 회원 상세로 잇는다 — 기업 회원은 비즈니스 회원, 일반 회원은 일반 회원 화면이다. */
function MemberLink({ inquiry }: { inquiry: AdminAdvertisementInquiryResponse }) {
  const badge = <AdInquiryMemberTypeBadge value={inquiry.memberType} />;
  if (inquiry.userId === undefined || inquiry.userId === null || inquiry.memberType === 'GUEST') {
    return badge;
  }
  const to =
    inquiry.memberType === 'COMPANY'
      ? `/members/companies/${inquiry.userId}`
      : `/members/users/${inquiry.userId}`;
  return (
    <Link to={to} title="회원 상세 보기" className="hover:opacity-80">
      {badge}
    </Link>
  );
}

/** 스킴 없이 적은 링크(`example.com/jobs/1`)도 열리게 `https://` 를 붙인다. 신청서가 그런 주소를 받는다. */
function externalHref(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${label} 복사`}
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-0.5 rounded-sm px-1 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700"
    >
      <span
        aria-hidden="true"
        className={cn('block size-3.5', copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]')}
      />
      {copied ? '복사됨' : '복사'}
    </button>
  );
}

/** 세 줄이 넘으면 접고 `더 보기` 를 둔다(PRD `설문`). 넘는지는 그려 본 뒤 높이로 잰다. */
function FoldedText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element && !open) {
      setOverflowing(element.scrollHeight > element.clientHeight + 1);
    }
  }, [text, open]);

  return (
    <div>
      <p ref={ref} className={cn('whitespace-pre-wrap', !open && 'line-clamp-3')}>
        {text}
      </p>
      {overflowing || open ? (
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="mt-1 text-xs text-gray-500 underline"
        >
          {open ? '접기' : '더 보기'}
        </button>
      ) : null}
    </div>
  );
}
