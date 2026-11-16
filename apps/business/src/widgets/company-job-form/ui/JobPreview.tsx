'use client';

import { useState } from 'react';
import { contentFieldLabel } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import {
  EDUCATION_LEVEL_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_TYPE_LABELS,
  formatRegion,
} from '@/entities/job/model/labels';
import { alwaysOpenLabel, computeDday, isDdayUrgent } from '@/shared/lib/dday';
import type { CompanyJobFormValues, CompanyJobPassthrough } from '../model/values';

const NO_VALUE = '정보 없음';
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type PreviewTab = 'analysis' | 'original';

/**
 * 공개 상세 `공고 원문` 탭의 본문 일곱 칸과 같은 순서다(web `widgets/job-detail/ui/OriginalTab.tsx` 의
 * `SECTION_FIELDS`). 회사/팀 소개와 급여는 이 폼에 칸이 없어 읽어 온 값(`CompanyJobPassthrough`)일 때만 있다.
 */
const SECTION_FIELDS = [
  'companyAndTeamIntroduction',
  'responsibilities',
  'qualifications',
  'preferredQualifications',
  'compensation',
  'benefits',
  'hiringProcess',
] as const;

export interface JobPreviewProps {
  values: CompanyJobFormValues;
  passthrough: CompanyJobPassthrough;
}

/** 공개 상세 헤더의 마감 문구("7/25(토) 23:59 마감"). 폼은 날짜만 받고 저장할 때 23:59 로 맞춘다. */
function deadlineText(recruitmentEndAt: string): string {
  if (!recruitmentEndAt) {
    return alwaysOpenLabel('job');
  }
  const [year, month, day] = recruitmentEndAt.split('-').map(Number);
  if (!year || !month || !day) {
    return alwaysOpenLabel('job');
  }
  const weekday = WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${month}/${day}(${weekday}) 23:59 마감`;
}

/**
 * `미리보기` 탭(이슈 #653). 지금 폼에 있는 값을 공개 상세(web `/jobs/[jobId]`) 모양으로 그린다.
 * **저장하지 않는다** — 읽는 것도 쓰는 것도 없고 값은 폼이 들고 있는 그대로다.
 *
 * 공개 상세(web `widgets/job-detail/`)는 다른 앱이라 가져다 쓰지 못하고, 조회수·북마크·비슷한 공고처럼 작성
 * 중에는 없는 값을 전제한다. 맞춘 것은 읽는 사람에게 무엇이 어떤 자리에 보이는가다.
 *
 * - 헤더: 로고·회사·지역, 제목, D-day 와 마감 문구(`JobDetailHeaderCard`)
 * - 탭 `공고 분석`·`공고 원문`(`JobDetailTabs`). 공개 상세는 `공고 분석` 이 먼저 열리지만 분석은 등록·승인 뒤
 *   AI 가 만들어 미리 볼 수 없다. 그래서 기업이 쓴 글이 보이는 `공고 원문` 을 먼저 연다.
 *   `공고 분석` 에는 그 탭 맨 위의 정보 네 칸(`JobInfoGrid`)과 분석이 나중에 생긴다는 안내를 둔다.
 * - `공고 원문`: 본문 칸을 글 덩어리로 그리고, 그 아래에 원문 이미지를 올린 순서대로 그린다. 기업 공고의 공개
 *   상세와 같다(`OriginalTab`, BE LC-3612). 맨 아래 원문 링크도 같다.
 */
export function JobPreview({ values, passthrough }: JobPreviewProps) {
  const [tab, setTab] = useState<PreviewTab>('original');
  const region = formatRegion(values.region || undefined);
  const recruitmentType = values.recruitmentEndAt ? 'PERIOD' : 'ALWAYS_OPEN';
  const recruitmentEndAt = values.recruitmentEndAt || undefined;
  const dday = computeDday(recruitmentType, recruitmentEndAt);
  const urgent = isDdayUrgent(recruitmentType, recruitmentEndAt);
  const sourceUrl = /^https?:\/\//.test(values.sourceUrl.trim())
    ? values.sourceUrl.trim()
    : undefined;

  const sectionValue = (field: (typeof SECTION_FIELDS)[number]): string | undefined => {
    if (field === 'companyAndTeamIntroduction' || field === 'compensation') {
      return passthrough[field];
    }
    return values[field];
  };
  const sections = SECTION_FIELDS.map((field) => ({
    label: contentFieldLabel('JobContentField', field),
    value: sectionValue(field)?.trim(),
  })).filter((section) => Boolean(section.value));

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 md:p-8">
      <header>
        <div className="flex items-center gap-3">
          {values.logoUrl ? (
            // 오공고가 아닌 도메인이 올 수 있어 `next/image` 대신 `img` 를 쓴다(`CoverImageField`).
            // oxlint-disable-next-line no-img-element
            <img
              src={values.logoUrl}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md border border-gray-100 object-contain md:h-13 md:w-13"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-sm font-bold text-gray-500 md:h-13 md:w-13"
            >
              {values.companyName.trim().slice(0, 1) || '?'}
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-600 md:text-base">
              {values.companyName || '회사명'}
            </p>
            {region ? <p className="mt-1 text-xs text-gray-400 md:text-sm">{region}</p> : null}
          </div>
        </div>
        <h2 className="mt-7 text-lg font-bold break-keep text-gray-800 md:text-3xl">
          {values.title || '공고 제목을 입력하면 여기에 보여요.'}
        </h2>
        <div className="mt-5 flex items-center gap-3 text-sm md:mt-6 md:gap-5 md:text-base">
          {dday ? (
            <span
              className={cn(
                'inline-flex shrink-0 items-center rounded-full px-3.5 py-1 text-base font-extrabold',
                urgent ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-600',
              )}
            >
              {dday}
            </span>
          ) : null}
          <span className="text-gray-500">{deadlineText(values.recruitmentEndAt)}</span>
        </div>
      </header>

      {values.coverImageUrl ? (
        // 목록 카드와 공유 미리보기에 쓰이는 대표 이미지다. 공개 상세 본문에는 그리지 않지만 확인할 수 있게 둔다.
        <figure className="rounded-lg bg-gray-50 p-3">
          {/* oxlint-disable-next-line no-img-element */}
          <img
            src={values.coverImageUrl}
            alt="공고 대표 이미지"
            className="mx-auto max-h-60 w-auto rounded-md object-contain"
          />
          <figcaption className="mt-2 text-center text-xs text-gray-400">
            대표 이미지 · 공고 목록 카드에 보여요
          </figcaption>
        </figure>
      ) : null}

      <div className="mt-6">
        <div
          role="tablist"
          aria-label="공고 내용"
          className="flex border-b border-gray-100 md:gap-6"
        >
          {(
            [
              { value: 'analysis', label: '공고 분석' },
              { value: 'original', label: '공고 원문' },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => setTab(item.value)}
              className={cn(
                '-mb-px flex-1 border-b-2 pb-3 text-center text-sm transition-colors md:flex-none md:px-0.5 md:text-base',
                tab === item.value
                  ? 'border-blue-500 font-semibold text-blue-500'
                  : 'border-transparent font-medium text-gray-400 hover:text-gray-600',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="pt-5 md:pt-9">
          {tab === 'analysis' ? (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-5 md:grid-cols-4 md:gap-x-4 md:px-10">
                {[
                  {
                    label: '경력',
                    value: values.experienceType
                      ? EXPERIENCE_TYPE_LABELS[values.experienceType]
                      : NO_VALUE,
                  },
                  {
                    label: '채용 유형',
                    value: values.employmentType
                      ? EMPLOYMENT_TYPE_LABELS[values.employmentType]
                      : NO_VALUE,
                  },
                  {
                    label: '학력',
                    value: values.educationLevel
                      ? EDUCATION_LEVEL_LABELS[values.educationLevel]
                      : NO_VALUE,
                  },
                  { label: '지역', value: region ?? NO_VALUE },
                ].map((cell) => (
                  <div
                    key={cell.label}
                    className="flex min-w-0 items-baseline gap-3 md:flex-col md:items-start md:gap-1.5"
                  >
                    <span className="shrink-0 text-sm text-blue-500 md:text-xs">{cell.label}</span>
                    <span className="min-w-0 text-sm font-semibold text-gray-800 md:text-base">
                      {cell.value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-sm break-keep text-gray-500">
                공고 분석은 등록한 공고가 승인되어 게시된 뒤 AI가 만들어요. 그 전에는 공고 원문만
                보여요.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {sections.length === 0 && values.sourceImageUrls.length === 0 ? (
                <p className="text-sm text-gray-400">상세 내용을 입력하면 여기에 보여요.</p>
              ) : null}
              {sections.map((section) => (
                <div key={section.label}>
                  <h3 className="text-lg font-bold text-gray-900">{section.label}</h3>
                  <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{section.value}</p>
                </div>
              ))}
              {values.sourceImageUrls.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {values.sourceImageUrls.map((url, index) => (
                    // oxlint-disable-next-line no-img-element
                    <img
                      key={`${url}-${index}`}
                      src={url}
                      alt={`공고 원문 이미지 ${index + 1}`}
                      className="h-auto max-w-full"
                    />
                  ))}
                </div>
              ) : null}
              {sourceUrl ? (
                <div>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-500 underline-offset-2 hover:underline"
                  >
                    공고 원문 보러 가기
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
