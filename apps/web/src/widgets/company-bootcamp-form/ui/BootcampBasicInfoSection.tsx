'use client';

import { Field, Input, Select } from '@ogonggo/ui';
import { CoverImageField } from '@/shared/ui/CoverImageField';
import {
  OPERATION_TYPE_OPTIONS,
  PROGRAM_TYPE_OPTIONS,
  TUITION_TYPE_OPTIONS,
  withCurrentValue,
} from '../model/options';
import type { CompanyBootcampFormValues } from '../model/values';

/** `CreateCompanyBootcampRequest` 의 `@maxLength`. */
const MAX_COMPANY_NAME_LENGTH = 150;
const MAX_TITLE_LENGTH = 255;
const MAX_PROGRAM_TYPE_LENGTH = 50;

export interface BootcampBasicInfoSectionProps {
  values: CompanyBootcampFormValues;
  onChange: (patch: Partial<CompanyBootcampFormValues>) => void;
}

/**
 * 1 단 기본 정보(v5 PRD 4 절). 기업·기관명 · 프로그램명 · 프로그램 유형 · 진행 방식 ·
 * 교육 기간 · 모집 인원 · 수강료 유형 · 수강료 · 수료 후 파트너사 · 공고 대표 이미지.
 *
 * 드롭다운 폭을 `w-full` 로 준다. `Select` 의 기본 폭은 필터 줄에 맞춘 내용 폭이라, 두 칸씩
 * 나란한 이 폼에서는 왼쪽 칸과 오른쪽 칸의 너비가 달라 보인다(채용공고 폼과 같다).
 */
export function BootcampBasicInfoSection({ values, onChange }: BootcampBasicInfoSectionProps) {
  return (
    <div>
      <Field label="기업 · 기관명" htmlFor="company-bootcamp-company-name" required>
        <Input
          id="company-bootcamp-company-name"
          value={values.companyName}
          maxLength={MAX_COMPANY_NAME_LENGTH}
          onChange={(event) => onChange({ companyName: event.target.value })}
          placeholder="기업 기관명을 입력해 주세요."
        />
      </Field>

      <Field label="프로그램명" htmlFor="company-bootcamp-title" required>
        <Input
          id="company-bootcamp-title"
          value={values.title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="프로그램명을 입력해 주세요."
        />
      </Field>

      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field label="프로그램 유형" htmlFor="company-bootcamp-program-type" required>
          <Select
            id="company-bootcamp-program-type"
            className="h-11 w-full px-4 text-base"
            options={withCurrentValue(PROGRAM_TYPE_OPTIONS, values.programType)}
            value={values.programType}
            onChange={(event) =>
              onChange({ programType: event.target.value.slice(0, MAX_PROGRAM_TYPE_LENGTH) })
            }
          />
        </Field>

        <Field label="진행 방식" htmlFor="company-bootcamp-operation-type" required>
          <Select
            id="company-bootcamp-operation-type"
            className="h-11 w-full px-4 text-base"
            options={OPERATION_TYPE_OPTIONS}
            value={values.operationType}
            onChange={(event) =>
              onChange({
                operationType: event.target.value as CompanyBootcampFormValues['operationType'],
              })
            }
          />
        </Field>

        {/*
          교육 기간. **목업은 드롭다운 한 칸인데 여기는 날짜 두 칸이다** — 요청이
          `programStartDate`·`programEndDate` 두 날짜를 필수로 받고, 드롭다운으로는 그 값을
          만들 수 없다(`model/options.ts` 머리 주석).
        */}
        <Field label="교육 기간" htmlFor="company-bootcamp-program-start" required>
          <div className="flex items-center gap-2">
            <Input
              id="company-bootcamp-program-start"
              type="date"
              aria-label="교육 시작일"
              value={values.programStartDate}
              onChange={(event) => onChange({ programStartDate: event.target.value })}
            />
            <span className="shrink-0 text-sm text-gray-400">~</span>
            <Input
              type="date"
              aria-label="교육 종료일"
              value={values.programEndDate}
              onChange={(event) => onChange({ programEndDate: event.target.value })}
            />
          </div>
        </Field>

        <Field label="모집 인원" htmlFor="company-bootcamp-capacity">
          <Input
            id="company-bootcamp-capacity"
            type="number"
            min={1}
            value={values.capacity}
            onChange={(event) => onChange({ capacity: event.target.value })}
            placeholder="모집 인원을 입력해 주세요. (예: 30명)"
          />
        </Field>

        <Field label="수강료 유형" htmlFor="company-bootcamp-tuition-type" required>
          <Select
            id="company-bootcamp-tuition-type"
            className="h-11 w-full px-4 text-base"
            options={TUITION_TYPE_OPTIONS}
            value={values.tuitionType}
            onChange={(event) =>
              onChange({
                tuitionType: event.target.value as CompanyBootcampFormValues['tuitionType'],
              })
            }
          />
        </Field>

        <Field label="수강료" htmlFor="company-bootcamp-tuition-amount">
          <Input
            id="company-bootcamp-tuition-amount"
            type="number"
            min={0}
            value={values.tuitionAmount}
            onChange={(event) => onChange({ tuitionAmount: event.target.value })}
            placeholder="수강료를 입력해 주세요."
          />
        </Field>
      </div>

      <CoverImageField
        value={values.representativeImageUrl}
        onChange={(representativeImageUrl) => onChange({ representativeImageUrl })}
      />
    </div>
  );
}
