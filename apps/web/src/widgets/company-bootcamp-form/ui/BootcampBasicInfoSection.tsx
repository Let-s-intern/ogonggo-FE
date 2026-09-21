'use client';

import { Checkbox, Field, Input, Select } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import { CoverImageField } from '@/shared/ui/CoverImageField';
import {
  OPERATION_TYPE_OPTIONS,
  PROGRAM_TYPE_OPTIONS,
  TUITION_TYPE_OPTIONS,
  withCurrentValue,
} from '../model/options';
import type { CompanyBootcampFormValues } from '../model/values';
import { BootcampPartnersField } from './BootcampPartnersField';

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
      <Field
        label="기업 · 기관명"
        htmlFor="company-bootcamp-company-name"
        required
        hint={`기업 로고 업로드는 ${PLACEHOLDER_NOTICE}. 이름만 저장돼요.`}
      >
        <div className="flex items-start gap-3">
          {/*
            기업 로고 칸. **비활성이다** — `createImage` 로 올리는 것까지는 되지만
            `CreateCompanyBootcampRequest` 에 로고를 담을 필드가 없어 버려진다(v5 PRD 4 절).
            올릴 수 있게 두면 올린 것이 사라진 것으로 읽힌다. 채용공고 폼의 같은 칸과 같다.
          */}
          <button
            type="button"
            disabled
            title={PLACEHOLDER_NOTICE}
            className="flex h-11 w-24 shrink-0 cursor-not-allowed flex-col items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-gray-300"
          >
            <span aria-hidden="true" className="icon-[lucide--upload] block size-3.5" />
            <span className="pt-0.5 text-[10px] leading-none">로고 업로드</span>
            <span className="text-[10px] leading-none">1:1 비율 권장</span>
          </button>
          <Input
            id="company-bootcamp-company-name"
            value={values.companyName}
            maxLength={MAX_COMPANY_NAME_LENGTH}
            onChange={(event) => onChange({ companyName: event.target.value })}
            placeholder="기업 기관명을 입력해 주세요."
          />
        </div>
      </Field>

      {/*
        `가입한 내용 동일 및 기본 정보로 저장`. **비활성이다** — 기업 프로필에는 기관명과
        담당자 이름 둘뿐이고 **수정 API 가 없다**(v5 PRD 표). 적은 값을 기본 정보로 저장할
        곳이 없다. 채용공고 목업에는 없고 이 목업에만 있는 칸이다.
      */}
      <div className="pb-4">
        <Checkbox
          checked={false}
          disabled
          onChange={() => undefined}
          label="가입한 내용 동일 및 기본 정보로 저장"
        />
        <p className="pt-1.5 text-sm text-gray-500">기본 정보로 저장은 {PLACEHOLDER_NOTICE}.</p>
      </div>

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

      <BootcampPartnersField
        rows={values.partners}
        onChange={(partners) => onChange({ partners })}
      />

      <CoverImageField
        value={values.representativeImageUrl}
        onChange={(representativeImageUrl) => onChange({ representativeImageUrl })}
      />
    </div>
  );
}
