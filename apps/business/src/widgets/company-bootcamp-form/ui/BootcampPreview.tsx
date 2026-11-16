'use client';

import { contentFieldLabel } from '@ogonggo/api';
import { cn } from '@ogonggo/ui';
import { OPERATION_TYPE_LABELS, TUITION_TYPE_LABELS } from '@/entities/bootcamp/model/labels';
import { alwaysOpenLabel, computeDday, isDdayUrgent } from '@/shared/lib/dday';
import type { CompanyBootcampFormValues } from '../model/values';

const NO_VALUE = '정보 없음';
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MILLISECONDS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export interface BootcampPreviewProps {
  values: CompanyBootcampFormValues;
}

/** 공개 상세 헤더의 마감 문구("7/25(토) 23:59 마감"). 폼은 날짜만 받고 저장할 때 23:59 로 맞춘다. */
function deadlineText(recruitmentEndAt: string): string {
  const [year, month, day] = recruitmentEndAt.split('-').map(Number);
  if (!year || !month || !day) {
    return alwaysOpenLabel('bootcamp');
  }
  const weekday = WEEKDAY_LABELS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${month}/${day}(${weekday}) 23:59 마감`;
}

/** 공개 상세 `기간` 칸과 같은 규칙이다(web `BootcampInfoGrid.tsx` 의 `formatDuration`). */
function durationText(values: CompanyBootcampFormValues): string {
  const lastWeek = values.curriculums.reduce(
    (max, row) => Math.max(max, Number(row.endWeek) || 0),
    0,
  );
  if (lastWeek > 0) {
    return `${lastWeek}주 과정`;
  }
  const start = new Date(values.programStartDate).getTime();
  const end = new Date(values.programEndDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return NO_VALUE;
  }
  return `${Math.max(1, Math.ceil((end - start) / MILLISECONDS_PER_WEEK))}주 과정`;
}

function tuitionText(values: CompanyBootcampFormValues): string {
  if (!values.tuitionType) {
    return NO_VALUE;
  }
  const label = TUITION_TYPE_LABELS[values.tuitionType];
  const amount = values.tuitionAmount.trim();
  return amount === '' ? label : `${label} ${Number(amount).toLocaleString('ko-KR')}원`;
}

function weekRangeText(startWeek: string, endWeek: string): string {
  if (!startWeek || !endWeek || startWeek === endWeek) {
    return `${startWeek || endWeek}주`;
  }
  return `${startWeek}-${endWeek}주`;
}

function TextSection({ title, body }: { title: string; body: string }) {
  if (!body.trim()) {
    return null;
  }
  return (
    <section>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{body}</p>
    </section>
  );
}

/**
 * `미리보기` 탭(이슈 #653). 지금 폼에 있는 값을 공개 부트캠프 상세(web `/bootcamps/[bootcampId]`) 모양으로
 * 그린다. **저장하지 않는다.**
 *
 * 공개 상세(web `widgets/bootcamp-detail/`)는 다른 앱이고 조회수·북마크·비슷한 교육처럼 작성 중에는 없는 값을
 * 전제해 가져다 쓰지 못한다. 순서와 모양을 맞췄다.
 *
 * - 헤더 카드: 로고(없으면 대표 이미지)·기관명·`교육 · 프로그램 유형`, 제목, D-day 와 마감 문구
 * - 정보 여섯 칸: 프로그램 유형, 진행 방식, 기간, 모집 인원, 수강료, 수료 후 파트너사
 * - 본문: 상세 내용 → 커리큘럼 → 강사 정보 → 교육 특징/혜택 → 수료 조건. 값이 없는 칸은 제목째 빠진다
 */
export function BootcampPreview({ values }: BootcampPreviewProps) {
  const recruitmentType = values.recruitmentEndAt ? 'PERIOD' : 'ALWAYS_OPEN';
  const recruitmentEndAt = values.recruitmentEndAt || undefined;
  const dday = computeDday(recruitmentType, recruitmentEndAt);
  const urgent = isDdayUrgent(recruitmentType, recruitmentEndAt);
  const logo = values.logoUrl || values.representativeImageUrl;
  const partners = values.partners.map((row) => row.partnerName.trim()).filter(Boolean);
  const curriculums = values.curriculums.filter(
    (row) => row.subtitle.trim() && (row.startWeek || row.endWeek),
  );

  const cells = [
    { label: '프로그램 유형', value: values.programType || NO_VALUE },
    {
      label: '진행 방식',
      value: values.operationType ? OPERATION_TYPE_LABELS[values.operationType] : NO_VALUE,
    },
    { label: '기간', value: durationText(values) },
    { label: '모집 인원', value: values.capacity ? `${values.capacity}명` : NO_VALUE },
    { label: '수강료', value: tuitionText(values) },
    { label: '수료 후 파트너사', value: partners.length > 0 ? partners.join(', ') : NO_VALUE },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 md:p-8">
      <header className="rounded-lg bg-gray-50 p-4 md:p-8">
        <div className="flex items-center gap-3">
          {logo ? (
            // 오공고가 아닌 도메인이 올 수 있어 `next/image` 대신 `img` 를 쓴다(`CoverImageField`).
            // oxlint-disable-next-line no-img-element
            <img
              src={logo}
              alt=""
              className="h-10 w-10 shrink-0 rounded-md border border-gray-100 bg-white object-contain md:h-16 md:w-16"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-sm font-bold text-gray-500 md:h-16 md:w-16"
            >
              {values.companyName.trim().slice(0, 1) || '?'}
            </span>
          )}
          <div>
            <p className="font-bold text-gray-900">{values.companyName || '기관명'}</p>
            <p className="text-sm text-gray-500">교육 · {values.programType || NO_VALUE}</p>
          </div>
        </div>
        <h2 className="mt-4 text-xl font-bold break-keep text-gray-900 md:mt-6 md:text-3xl">
          {values.title || '프로그램명을 입력하면 여기에 보여요.'}
        </h2>
        <hr className="my-4 border-gray-200 md:my-6" />
        <div className="flex items-center gap-3 text-sm">
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
          <span className="text-gray-500">
            {values.recruitmentEndAt
              ? deadlineText(values.recruitmentEndAt)
              : alwaysOpenLabel('bootcamp')}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-10">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          {cells.map((cell) => (
            <div key={cell.label}>
              <p className="text-xs text-gray-500">{cell.label}</p>
              <p className="text-sm font-semibold text-gray-900">{cell.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-10 px-[17px]">
          <TextSection
            title={contentFieldLabel('BootcampContentField', 'content')}
            body={values.content}
          />
          {curriculums.length > 0 ? (
            <section>
              <h3 className="text-lg font-bold text-gray-900">커리큘럼</h3>
              <ol className="mt-4 flex flex-col gap-4 border-l border-gray-200 pl-6">
                {curriculums.map((row, index) => (
                  <li key={index} className="relative flex gap-4 text-sm">
                    <span
                      className="absolute top-1.5 -left-[27px] h-2 w-2 rounded-full bg-blue-600"
                      aria-hidden="true"
                    />
                    <span className="w-16 shrink-0 font-bold text-blue-600">
                      {weekRangeText(row.startWeek, row.endWeek)}
                    </span>
                    <span className="text-gray-700">{row.subtitle}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          <TextSection title="강사 정보" body={values.instructorInfo} />
          <TextSection title="교육 특징/혜택" body={values.programFeatures} />
          <TextSection title="수료 조건" body={values.completionRequirements} />
        </div>
      </div>
    </div>
  );
}
