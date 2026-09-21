'use client';

import { Checkbox, Field, Input } from '@ogonggo/ui';
import { FormRadioGroup } from '@/shared/ui/FormRadioGroup';
import type { CompanyBootcampFormValues } from '../model/values';

/** `CreateCompanyBootcampRequest` 의 `@maxLength`. */
const MAX_URL_LENGTH = 2048;
const MAX_MANAGER_EMAIL_LENGTH = 320;

/** 지원 방법 둘. 생성 타입의 `applicationMethod` 그대로다. */
const APPLICATION_METHOD_OPTIONS = [
  { value: 'EXTERNAL_PAGE', label: '외부 지원 페이지' },
  { value: 'EMAIL', label: '이메일 지원' },
] as const;

export interface BootcampApplySettingsSectionProps {
  values: CompanyBootcampFormValues;
  onChange: (patch: Partial<CompanyBootcampFormValues>) => void;
}

/**
 * 3 단 모집 · 지원 설정(v5 PRD 4 절). 모집 시작일 · 모집 마감일 · 지원 방법 · 지원 링크 ·
 * 담당자 이메일 · 문의 링크 · 공고 공개 기간 · 정책 동의.
 *
 * **문의처 두 칸은 채용공고 폼과 달리 살아 있다.** `CreateCompanyBootcampRequest` 에
 * `managerEmail` 과 `inquiryUrl` 이 있다 — 채용공고 요청에만 없어서 그쪽 담당자 이메일 칸이
 * 비활성이었다(v5 PRD 3·4 절). 같은 목업의 같은 자리라도 받을 필드가 있으면 받는다.
 *
 * 날짜는 `input[type=date]` 다. 백엔드는 일시를 받지만 목업이 `YYYY-MM-DD` 이고 마감 시각이
 * 23:59 로 고정이라, 화면은 달력 날짜만 다루고 시각은 저장할 때 붙인다
 * (`shared/lib/formDateTime.ts`).
 *
 * 정책 동의는 **요청에 실리지 않는다.** `CreateCompanyBootcampRequest` 에 대응 필드가 없다.
 * 화면이 `공고 등록` 을 막는 데만 쓴다 — 목업의 별표가 그 칸에 붙어 있고, 동의를 받지 않고
 * 공개로 만드는 길을 열어 두는 것이 이 칸을 그리는 것보다 나쁘다.
 */
export function BootcampApplySettingsSection({
  values,
  onChange,
}: BootcampApplySettingsSectionProps) {
  return (
    <div>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field label="모집 시작일" htmlFor="company-bootcamp-recruitment-start" required>
          <Input
            id="company-bootcamp-recruitment-start"
            type="date"
            value={values.recruitmentStartAt}
            onChange={(event) => onChange({ recruitmentStartAt: event.target.value })}
          />
        </Field>

        <Field
          label="모집 마감일"
          htmlFor="company-bootcamp-recruitment-end"
          required
          hint="마감 시간은 23:59로 설정됩니다."
        >
          <Input
            id="company-bootcamp-recruitment-end"
            type="date"
            value={values.recruitmentEndAt}
            onChange={(event) => onChange({ recruitmentEndAt: event.target.value })}
          />
        </Field>
      </div>

      <Field label="지원 방법" required>
        <FormRadioGroup
          name="company-bootcamp-application-method"
          options={APPLICATION_METHOD_OPTIONS}
          value={values.applicationMethod}
          onChange={(applicationMethod) =>
            onChange({
              applicationMethod:
                applicationMethod as CompanyBootcampFormValues['applicationMethod'],
            })
          }
        />
      </Field>

      <Field
        label="지원 링크"
        htmlFor="company-bootcamp-application-url"
        required
        hint="지원하기 버튼을 누르면 입력한 페이지로 이동합니다."
      >
        <Input
          id="company-bootcamp-application-url"
          type="url"
          maxLength={MAX_URL_LENGTH}
          value={values.applicationUrl}
          onChange={(event) => onChange({ applicationUrl: event.target.value })}
          placeholder="https://"
        />
      </Field>

      <p className="pb-1.5 text-sm font-medium text-gray-700">문의처</p>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field label="담당자 이메일" htmlFor="company-bootcamp-manager-email">
          <Input
            id="company-bootcamp-manager-email"
            type="email"
            maxLength={MAX_MANAGER_EMAIL_LENGTH}
            value={values.managerEmail}
            onChange={(event) => onChange({ managerEmail: event.target.value })}
            placeholder="이메일을 입력해 주세요."
          />
        </Field>

        <Field label="문의 링크 (선택)" htmlFor="company-bootcamp-inquiry-url">
          <Input
            id="company-bootcamp-inquiry-url"
            type="url"
            maxLength={MAX_URL_LENGTH}
            value={values.inquiryUrl}
            onChange={(event) => onChange({ inquiryUrl: event.target.value })}
            placeholder="https://"
          />
        </Field>
      </div>

      <Checkbox
        checked={values.agreedToPolicy}
        onChange={(agreedToPolicy) => onChange({ agreedToPolicy })}
        label={
          <>
            공고 등록에 필요한 정보 제공 및 운영 정책에 동의합니다.
            <span className="pl-0.5 text-error">*</span>
          </>
        }
      />
    </div>
  );
}
