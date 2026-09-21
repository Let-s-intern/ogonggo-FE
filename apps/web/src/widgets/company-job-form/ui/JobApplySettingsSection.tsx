'use client';

import { Checkbox, Field, Input, Textarea } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import { FormRadioGroup } from '@/shared/ui/FormRadioGroup';
import type { CompanyJobFormValues } from '../model/values';

/** `CreateCompanyJobRequest.sourceUrl` 의 `@maxLength`. */
const MAX_SOURCE_URL_LENGTH = 2048;

/**
 * 지원 방법 둘. 생성 타입의 `applicationMethod` 그대로다.
 *
 * `EMAIL` 을 고를 수 있게 두는 것은 목업의 선택지가 둘이기 때문이고, 주소를 적는 칸은
 * 비활성이다 — 요청에 주소를 담을 필드가 없다(v5 PRD 3 절).
 */
const APPLICATION_METHOD_OPTIONS = [
  { value: 'EXTERNAL_PAGE', label: '외부 지원 페이지' },
  { value: 'EMAIL', label: '이메일 지원' },
] as const;

export interface JobApplySettingsSectionProps {
  values: CompanyJobFormValues;
  onChange: (patch: Partial<CompanyJobFormValues>) => void;
}

/**
 * 3 단 모집 · 지원 설정(v5 PRD 3 절). 접수 시작일 · 모집 마감일 · 지원 방법 · 지원 링크 ·
 * 담당자 이메일 · 채용 안내사항 · 마감일 자동 종료.
 *
 * **목업에 `지원 방법` 줄이 두 번 나오는데 한 번만 그린다.** 같은 라디오 그룹이 연달아 있고
 * 두 번째에만 지원 링크가 붙어 있어 실수로 본다(v5 PRD 3 절, 2026-09-21 확인). 남긴 것은
 * 링크가 붙은 두 번째 줄의 배치다.
 *
 * 날짜는 `input[type=date]` 다. 백엔드는 일시를 받지만 목업이 `YYYY-MM-DD` 이고 마감 시각이
 * 23:59 로 고정이라, 화면은 달력 날짜만 다루고 시각은 저장할 때 붙인다(`lib/datetime.ts`).
 */
export function JobApplySettingsSection({ values, onChange }: JobApplySettingsSectionProps) {
  return (
    <div>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field label="접수 시작일" htmlFor="company-job-start-at">
          <Input
            id="company-job-start-at"
            type="date"
            value={values.recruitmentStartAt}
            onChange={(event) => onChange({ recruitmentStartAt: event.target.value })}
          />
        </Field>

        <Field
          label="모집 마감일"
          htmlFor="company-job-end-at"
          required
          hint="마감 시간은 23:59로 설정됩니다."
        >
          <Input
            id="company-job-end-at"
            type="date"
            value={values.recruitmentEndAt}
            onChange={(event) => onChange({ recruitmentEndAt: event.target.value })}
          />
        </Field>

        <Field label="지원 방법" required>
          <FormRadioGroup
            name="company-job-application-method"
            options={APPLICATION_METHOD_OPTIONS}
            value={values.applicationMethod}
            onChange={(applicationMethod) =>
              onChange({
                applicationMethod: applicationMethod as CompanyJobFormValues['applicationMethod'],
              })
            }
          />
        </Field>

        <Field
          label="지원 링크"
          htmlFor="company-job-source-url"
          required
          hint="지원하기 버튼을 누르면 입력한 페이지로 이동합니다."
        >
          <Input
            id="company-job-source-url"
            type="url"
            maxLength={MAX_SOURCE_URL_LENGTH}
            value={values.sourceUrl}
            onChange={(event) => onChange({ sourceUrl: event.target.value })}
            placeholder="https://"
          />
        </Field>
      </div>

      {/*
        담당자 이메일. **비활성이다** — `applicationMethod` 에 `EMAIL` 값은 있는데 주소를 담을
        필드가 `CreateCompanyJobRequest` 에 없다(v5 PRD 3 절). 부트캠프 요청에는
        `managerEmail` 이 있고 채용공고에만 없다. 선택지는 목업대로 둘 다 그리고 주소 칸만
        잠근다 — 저장되지 않는 칸에 타이핑하게 두면 입력한 것이 사라진 것으로 읽힌다.
      */}
      <Field
        label="담당자 이메일"
        htmlFor="company-job-manager-email"
        hint={`담당자 이메일 저장은 ${PLACEHOLDER_NOTICE}. 지원 링크로 받아 주세요.`}
      >
        <Input
          id="company-job-manager-email"
          type="email"
          disabled
          value=""
          title={PLACEHOLDER_NOTICE}
          onChange={() => undefined}
          placeholder="담당자 이메일을 입력해 주세요."
        />
      </Field>

      <Field label="채용 안내사항" htmlFor="company-job-notice">
        <Textarea
          id="company-job-notice"
          rows={3}
          value={values.recruitmentNotice}
          onChange={(event) => onChange({ recruitmentNotice: event.target.value })}
          placeholder="지원자에게 안내할 내용을 입력해 주세요. (선택사항)"
        />
      </Field>

      <Checkbox
        checked={values.autoCloseEnabled}
        onChange={(autoCloseEnabled) => onChange({ autoCloseEnabled })}
        label="마감일 전에 자동으로 모집을 종료할게요."
      />
    </div>
  );
}
