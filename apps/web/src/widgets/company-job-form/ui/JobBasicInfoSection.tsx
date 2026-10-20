'use client';

import { Field, Input, Select } from '@ogonggo/ui';
import {
  EDUCATION_LEVEL_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_TYPE_OPTIONS,
  JOB_FIELD_OPTIONS,
  REGION_OPTIONS,
  withCurrentValue,
  WORK_ARRANGEMENT_OPTIONS,
} from '../model/options';
import { CoverImageField } from '@/shared/ui/CoverImageField';
import { CountedInput } from '@/shared/ui/CountedInput';
import { LogoUploadField } from '@/shared/ui/LogoUploadField';
import type { CompanyJobFormValues } from '../model/values';

/** `CreateCompanyJobRequest` 의 `@maxLength`. */
const MAX_COMPANY_NAME_LENGTH = 150;
const MAX_TITLE_LENGTH = 255;

export interface JobBasicInfoSectionProps {
  values: CompanyJobFormValues;
  onChange: (patch: Partial<CompanyJobFormValues>) => void;
}

/**
 * 1 단 기본 정보(v5 PRD 3 절). 기업 로고 · 기업·기관명 · 공고 제목 · 직무 분야 · 채용 유형 ·
 * 경력 · 학력 · 지역 · 모집 인원 · 공고 대표 이미지.
 *
 * 드롭다운 폭을 `w-full` 로 준다. `Select` 의 기본 폭은 필터 줄에 맞춘 내용 폭이라, 두 칸씩
 * 나란한 이 폼에서는 왼쪽 칸과 오른쪽 칸의 너비가 달라 보인다.
 */
export function JobBasicInfoSection({ values, onChange }: JobBasicInfoSectionProps) {
  return (
    <div>
      <Field label="기업 · 기관명" htmlFor="company-job-company-name" required>
        <div className="flex items-center gap-4">
          <LogoUploadField
            url={values.logoUrl}
            className="size-20"
            onUploaded={(image) => onChange({ logoUrl: image.url })}
            onClear={() => onChange({ logoUrl: '' })}
          />
          <CountedInput
            id="company-job-company-name"
            value={values.companyName}
            maxLength={MAX_COMPANY_NAME_LENGTH}
            onChange={(event) => onChange({ companyName: event.target.value })}
            placeholder="기업 기관명을 입력해 주세요."
          />
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <Field label="공고 제목" htmlFor="company-job-title" required>
          <CountedInput
            id="company-job-title"
            value={values.title}
            maxLength={MAX_TITLE_LENGTH}
            onChange={(event) => onChange({ title: event.target.value })}
            placeholder="공고 제목을 입력해 주세요."
          />
        </Field>

        <Field label="직무 분야" htmlFor="company-job-job-field" required>
          <Select
            id="company-job-job-field"
            className="h-11 w-full px-4 text-base"
            options={withCurrentValue(JOB_FIELD_OPTIONS, values.jobField)}
            value={values.jobField}
            onChange={(event) =>
              onChange({ jobField: event.target.value as CompanyJobFormValues['jobField'] })
            }
          />
        </Field>

        <Field label="채용 유형" htmlFor="company-job-employment-type" required>
          <Select
            id="company-job-employment-type"
            className="h-11 w-full px-4 text-base"
            options={EMPLOYMENT_TYPE_OPTIONS}
            value={values.employmentType}
            onChange={(event) =>
              onChange({
                employmentType: event.target.value as CompanyJobFormValues['employmentType'],
              })
            }
          />
        </Field>

        <Field label="경력" htmlFor="company-job-experience-type" required>
          <Select
            id="company-job-experience-type"
            className="h-11 w-full px-4 text-base"
            options={EXPERIENCE_TYPE_OPTIONS}
            value={values.experienceType}
            onChange={(event) =>
              onChange({
                experienceType: event.target.value as CompanyJobFormValues['experienceType'],
              })
            }
          />
        </Field>

        <Field label="학력" htmlFor="company-job-education-level" required>
          <Select
            id="company-job-education-level"
            className="h-11 w-full px-4 text-base"
            options={EDUCATION_LEVEL_OPTIONS}
            value={values.educationLevel}
            onChange={(event) =>
              onChange({
                educationLevel: event.target.value as CompanyJobFormValues['educationLevel'],
              })
            }
          />
        </Field>

        <Field label="지역" htmlFor="company-job-region" required>
          <Select
            id="company-job-region"
            className="h-11 w-full px-4 text-base"
            options={withCurrentValue(REGION_OPTIONS, values.region)}
            value={values.region}
            onChange={(event) =>
              onChange({ region: event.target.value as CompanyJobFormValues['region'] })
            }
          />
        </Field>

        <Field label="모집 인원" htmlFor="company-job-headcount">
          <Input
            id="company-job-headcount"
            type="number"
            min={1}
            value={values.recruitmentHeadcount}
            onChange={(event) => onChange({ recruitmentHeadcount: event.target.value })}
            placeholder="모집 인원을 입력해 주세요. (예: 30명)"
          />
        </Field>

        {/*
          근무 방식. **비활성이다** — 재택·출근·하이브리드를 담을 필드가
          `CreateCompanyJobRequest` 에 없다(v5 PRD 3 절). 고를 수 있게 두면 고른 것이
          사라진 것으로 읽힌다.
        */}
        <Field label="근무 방식" htmlFor="company-job-work-arrangement">
          <Select
            id="company-job-work-arrangement"
            className="h-11 w-full px-4 text-base"
            disabled
            options={WORK_ARRANGEMENT_OPTIONS}
            value=""
            onChange={() => undefined}
          />
        </Field>
      </div>

      <CoverImageField
        value={values.coverImageUrl}
        onChange={(coverImageUrl) => onChange({ coverImageUrl })}
      />
    </div>
  );
}
