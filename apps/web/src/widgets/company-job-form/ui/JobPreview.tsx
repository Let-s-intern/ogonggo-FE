'use client';

import { EDUCATION_LEVEL_LABELS, EMPLOYMENT_TYPE_LABELS } from '@/entities/job/model/labels';
import { EXPERIENCE_TYPE_LABELS } from '../model/options';
import type { CompanyJobFormValues } from '../model/values';

const NO_VALUE = '정보 없음';

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export interface JobPreviewProps {
  values: CompanyJobFormValues;
}

/**
 * `미리보기` 탭(v5 PRD 3 절). 지금 폼에 있는 값을 공개 상세 화면 모양으로 그린다.
 * **저장하지 않는다** — 읽는 것도 쓰는 것도 없고 값은 폼이 들고 있는 그대로다.
 *
 * 공개 상세(`widgets/job-detail/`) 를 가져다 쓰지 않는다. 그쪽은 저장된 공고
 * (`UserJobDetailResponse`) 와 조회수·북마크·비슷한 공고처럼 작성 중에는 없는 값을 전제하고,
 * 서버에서 공고를 읽어 오는 것부터 시작한다. 맞춘 것은 **읽는 사람에게 무엇이 어떤 자리에
 * 보이는가** 이고, 정보 그리드 네 칸과 본문 구역의 순서가 그쪽과 같다
 * (`widgets/job-detail/ui/JobInfoGrid.tsx`, `JobDetailView.tsx` 의 `buildSections`).
 *
 * 급여 및 처우는 그리지 않는다. 공개 상세에는 있지만 이 폼에 칸이 없어(목업에 없다) 언제나
 * 빈 자리가 된다. 채용 안내사항도 같은 이유로 없다 — 공개 상세가 그 값을 그리지 않는다.
 */
export function JobPreview({ values }: JobPreviewProps) {
  const sections = [
    { label: '주요 업무', body: values.responsibilities },
    { label: '자격 요건', body: values.qualifications },
    { label: '우대 사항', body: values.preferredQualifications },
    { label: '혜택 및 복지', body: values.benefits },
    { label: '채용 절차', body: values.hiringProcess },
  ];

  return (
    <div className="flex flex-col gap-8 rounded-lg border border-gray-200 bg-white p-8">
      <header>
        <p className="text-sm text-gray-500">
          {[values.companyName, values.region].filter(Boolean).join(' · ') || NO_VALUE}
        </p>
        <h2 className="pt-2 text-2xl font-bold text-gray-950">
          {values.title || '공고 제목을 입력하면 여기에 보여요.'}
        </h2>
        <p className="pt-2 text-sm text-gray-500">
          {values.recruitmentEndAt ? `${values.recruitmentEndAt} 마감` : '상시 채용'}
        </p>
      </header>

      {values.coverImageUrl ? (
        // 공개 상세와 같은 이유로 `next/image` 를 쓰지 않는다(`JobCoverImageField`).
        // oxlint-disable-next-line no-img-element
        <img
          src={values.coverImageUrl}
          alt="공고 대표 이미지"
          className="max-h-80 w-full rounded-lg object-contain"
        />
      ) : null}

      <div className="grid grid-cols-2 gap-x-8 gap-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <InfoCell
          label="경력"
          value={values.experienceType ? EXPERIENCE_TYPE_LABELS[values.experienceType] : NO_VALUE}
        />
        <InfoCell
          label="채용 유형"
          value={values.employmentType ? EMPLOYMENT_TYPE_LABELS[values.employmentType] : NO_VALUE}
        />
        <InfoCell
          label="학력"
          value={values.educationLevel ? EDUCATION_LEVEL_LABELS[values.educationLevel] : NO_VALUE}
        />
        <InfoCell label="지역" value={values.region || NO_VALUE} />
        <InfoCell label="직무 분야" value={values.jobField || NO_VALUE} />
        <InfoCell
          label="모집 인원"
          value={values.recruitmentHeadcount ? `${values.recruitmentHeadcount}명` : NO_VALUE}
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
