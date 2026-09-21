'use client';

import type { ReactNode } from 'react';
import { KIND_LABELS, OPERATION_TYPE_LABELS } from '@/entities/side-study/model/labels';
import { parseLocalDate } from '@/shared/lib/localDate';
import { POSITION_OPTION_LABELS } from '../model/options';
import type { RecruitmentPostFormValues } from '../model/values';

const NO_VALUE = '정보 없음';
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/** 상세 화면(`widgets/side-study-detail/ui/SideStudyInfoGrid.tsx`) 과 같은 `2026/6/1 (월)`. */
function formatDate(value: string): string {
  if (!value) {
    return NO_VALUE;
  }
  const date = parseLocalDate(value);
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} (${WEEKDAY_LABELS[date.getDay()]})`;
}

function InfoCell({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-500">{label}</p>
      <div className="text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}

export interface PostPreviewProps {
  values: RecruitmentPostFormValues;
}

/**
 * `미리보기` 탭(PRD 5 절). 지금 폼에 있는 값을 공개 상세 화면 모양으로 그린다.
 * **저장하지 않는다** — 읽는 것도 쓰는 것도 없고 값은 폼이 들고 있는 그대로다.
 *
 * 상세 화면(`widgets/side-study-detail/`) 을 가져다 쓰지 않는다. 기능은 위젯을 임포트하지
 * 않고(`features/README.md`), 그쪽은 저장된 글(`RecruitmentPostDetailResponse`) 과 작성자·
 * 스크랩 수·비슷한 글처럼 아직 없는 값을 전제한다. 여기서 맞추는 것은 **읽는 사람에게 무엇이
 * 어떤 자리에 보이는가** 이고, 그 자리 일곱 칸과 본문 세 구역은 그쪽과 같은 순서다.
 *
 * 본문은 평문 그대로 그린다. 작성 칸이 평문이라 `content` JSON 을 만들어도 문단뿐이고,
 * `LexicalContent` 는 서버 전용 모듈이라 이 클라이언트 화면이 부를 수 없다(`lib/content.ts`).
 */
export function PostPreview({ values }: PostPreviewProps) {
  const meta = [
    values.recruitmentType ? KIND_LABELS[values.recruitmentType] : undefined,
    values.progressMethod ? OPERATION_TYPE_LABELS[values.progressMethod] : undefined,
    values.activityDurationMonths ? `${values.activityDurationMonths}개월` : undefined,
  ].filter((value): value is string => value !== undefined);

  const sections: { label: string; body: string }[] = [
    { label: '한 줄 소개', body: values.summary },
    { label: '모집 상세 내용', body: values.contentText },
    { label: '지원 자격 및 전형', body: values.eligibilityAndSelectionProcess },
  ];

  return (
    <div className="flex flex-col gap-8 rounded-lg border border-gray-200 bg-white p-8">
      <header>
        <h2 className="text-2xl font-bold text-gray-950">
          {values.title || '제목을 입력하면 여기에 보여요.'}
        </h2>
        {meta.length > 0 ? <p className="pt-2 text-sm text-gray-500">{meta.join(' · ')}</p> : null}
      </header>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <InfoCell
          label="진행 방식"
          value={values.progressMethod ? OPERATION_TYPE_LABELS[values.progressMethod] : NO_VALUE}
        />
        <InfoCell label="모집 인원" value={values.capacity ? `${values.capacity}명` : NO_VALUE} />
        <InfoCell
          label="기술 스택"
          value={values.technologyStacks.length > 0 ? values.technologyStacks.join(', ') : NO_VALUE}
          className="col-span-2"
        />
        <InfoCell label="모집 시작일" value={formatDate(values.recruitmentStartDate)} />
        <InfoCell label="모집 마감일" value={formatDate(values.recruitmentEndDate)} />
        <InfoCell
          label="모집 포지션"
          value={
            values.positions.length > 0
              ? values.positions.map((position) => POSITION_OPTION_LABELS[position]).join(', ')
              : NO_VALUE
          }
        />
        <InfoCell
          label="소통 방법"
          value={
            values.contactMethod ? (
              <>
                <p>{values.contactMethod === 'EMAIL' ? '이메일' : '카카오톡 오픈채팅'}</p>
                <p className="font-normal break-all">{values.contactValue || NO_VALUE}</p>
              </>
            ) : (
              NO_VALUE
            )
          }
        />
      </div>

      {sections
        .filter((section) => section.body.trim().length > 0)
        .map((section) => (
          <section key={section.label}>
            <h3 className="text-lg font-bold text-gray-900">{section.label}</h3>
            <p className="mt-2 text-sm whitespace-pre-line text-gray-700">{section.body}</p>
          </section>
        ))}
    </div>
  );
}
