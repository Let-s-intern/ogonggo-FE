'use client';

import { Callout, Checkbox, Field, Input, Select } from '@ogonggo/ui';
import { CONTACT_METHOD_OPTIONS } from '../model/options';
import type { RecruitmentPostFormValues } from '../model/values';
import { PositionSelect } from './PositionSelect';

/** `CreateRecruitmentPostRequest.contactValue` 의 `@maxLength`. */
const MAX_CONTACT_VALUE_LENGTH = 2048;

export interface ApplySettingsSectionProps {
  values: RecruitmentPostFormValues;
  onChange: (patch: Partial<RecruitmentPostFormValues>) => void;
}

/**
 * 3 단 지원 설정(PRD 5 절). 모집 시작일 · 모집 마감일 · 모집 포지션 · 소통 방법 ·
 * 오픈 카톡방 링크 · 정책 동의.
 *
 * **포지션별 인원 칸이 없다**(PRD 5 절). 인원은 1 단의 `capacity` 하나뿐이다.
 *
 * 날짜는 `input[type=date]` 다. 브라우저가 달력과 키보드 입력을 함께 주고, 값이 백엔드가 받는
 * `YYYY-MM-DD` 그대로라 변환할 것이 없다. 목업의 `YYYY.MM.DD` 는 표시 형식이라 브라우저 로캘을
 * 따른다.
 *
 * 마지막 칸의 이름은 소통 방법을 따라간다 — 이메일을 골라 놓고 `오픈 카톡방 링크` 에 주소를
 * 적게 두면 무엇을 적는 칸인지 어긋난다.
 */
export function ApplySettingsSection({ values, onChange }: ApplySettingsSectionProps) {
  const email = values.contactMethod === 'EMAIL';

  return (
    <div>
      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field label="모집 시작일" htmlFor="post-start-date" required>
          <Input
            id="post-start-date"
            type="date"
            value={values.recruitmentStartDate}
            onChange={(event) => onChange({ recruitmentStartDate: event.target.value })}
          />
        </Field>

        <Field
          label="모집 마감일"
          htmlFor="post-end-date"
          required
          hint="마감 시간은 23:59로 설정됩니다."
        >
          <Input
            id="post-end-date"
            type="date"
            value={values.recruitmentEndDate}
            onChange={(event) => onChange({ recruitmentEndDate: event.target.value })}
          />
        </Field>
      </div>

      <Field label="모집 포지션" required>
        <PositionSelect
          value={values.positions}
          onChange={(positions) => onChange({ positions })}
        />
      </Field>

      <div className="grid gap-x-6 sm:grid-cols-2">
        <Field label="소통 방법" htmlFor="post-contact-method" required>
          <Select
            id="post-contact-method"
            className="h-11 w-full px-4 text-base"
            options={CONTACT_METHOD_OPTIONS}
            value={values.contactMethod}
            onChange={(event) =>
              onChange({
                contactMethod: event.target.value as RecruitmentPostFormValues['contactMethod'],
              })
            }
          />
        </Field>

        <Field label={email ? '이메일 주소' : '오픈 카톡방 링크'} htmlFor="post-contact-value">
          <Input
            id="post-contact-value"
            type={email ? 'email' : 'url'}
            maxLength={MAX_CONTACT_VALUE_LENGTH}
            value={values.contactValue}
            onChange={(event) => onChange({ contactValue: event.target.value })}
            placeholder={
              email ? '이메일 주소를 입력해 주세요' : '오픈 카톡방 링크를 입력해 주세요'
            }
          />
        </Field>
      </div>

      <Callout className="mt-1 mb-4 border-blue-100 bg-blue-50 text-gray-500">
        등록 전 미리보기에서 모집글에 노출되는 내용을 확인해 주세요.
      </Callout>

      <Checkbox
        checked={values.agreedToPolicy}
        onChange={(agreedToPolicy) => onChange({ agreedToPolicy })}
        label={
          <>
            모집글 등록에 필요한 정보 제공 및 운영 정책에 동의합니다.
            <span className="pl-0.5 text-error">*</span>
          </>
        }
      />
    </div>
  );
}
