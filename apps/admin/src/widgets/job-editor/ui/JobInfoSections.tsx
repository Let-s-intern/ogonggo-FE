import { useState, type ReactNode } from 'react';
import { enumChildren, enumLabel, enumOptions, enumParent } from '@ogonggo/api/src/admin';
import { Checkbox, Field, Input, Select, Textarea } from '@ogonggo/ui';
import type { JobEditorValues } from '../lib/formValues';
import type { JobEditorErrors } from '../lib/validate';
import { LogoSuggest } from './LogoSuggest';

type StringKey = {
  [K in keyof JobEditorValues]: JobEditorValues[K] extends string ? K : never;
}[keyof JobEditorValues];

export interface JobInfoSectionProps {
  values: JobEditorValues;
  /** 연 때의 값. 바뀐 칸에만 붙는 안내(직무 지움, 시·군·구 정리)를 가린다. */
  before: JobEditorValues;
  errors: JobEditorErrors;
  onChange: <K extends keyof JobEditorValues>(key: K, value: JobEditorValues[K]) => void;
}

const NONE = { value: '', label: '선택 안 함' };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pt-2">
      <h3 className="pb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="grid gap-x-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function TextInput({
  name,
  label,
  type = 'text',
  min,
  required,
  hint,
  wide,
  values,
  errors,
  onChange,
  children,
}: Pick<JobInfoSectionProps, 'values' | 'errors' | 'onChange'> & {
  name: StringKey;
  label: string;
  type?: 'text' | 'number' | 'email' | 'url' | 'date';
  min?: number;
  required?: boolean;
  hint?: string;
  /** 두 칸을 다 쓴다. 주소처럼 긴 값. */
  wide?: boolean;
  children?: ReactNode;
}) {
  return (
    <Field
      label={label}
      htmlFor={`job-${name}`}
      required={required}
      hint={hint}
      error={errors[name]}
      className={wide ? 'sm:col-span-2' : undefined}
    >
      <Input
        id={`job-${name}`}
        type={type}
        min={min}
        value={values[name]}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {children}
    </Field>
  );
}

/**
 * 이미지 주소의 미리보기. 불러오지 못하면 자리를 숨긴다 — 깨진 그림 표시가 남으면 주소가 틀렸는지
 * 서버가 막았는지 구별되지 않는다. 주소가 바뀌면 `key` 로 다시 그려 실패 표시를 지운다.
 */
function ImagePreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return null;
  }
  return (
    <img
      src={url}
      alt=""
      className="mt-2 h-12 w-auto rounded border border-gray-200 object-contain"
      onError={() => setFailed(true)}
    />
  );
}

/** 형식에 맞는 주소만 돌려준다(미리보기·로고 추천). 형식 확인은 `validate` 가 이미 했다. */
function previewUrl(
  values: JobEditorValues,
  errors: JobEditorErrors,
  key: 'logoUrl' | 'coverImageUrl' | 'sourceUrl',
) {
  const url = values[key].trim();
  return url !== '' && !errors[key] ? url : null;
}

export function CompanySection(props: JobInfoSectionProps) {
  const { values, errors } = props;
  const logo = previewUrl(values, errors, 'logoUrl');
  const cover = previewUrl(values, errors, 'coverImageUrl');
  const source = previewUrl(values, errors, 'sourceUrl');
  return (
    <Section title="회사">
      <TextInput {...props} name="companyName" label="회사명" required />
      <TextInput {...props} name="parentCompanyName" label="모회사명" />
      <TextInput {...props} name="industry" label="산업" />
      <TextInput {...props} name="logoUrl" label="로고 주소" type="url" wide>
        {logo ? <ImagePreview key={logo} url={logo} /> : null}
        <LogoSuggest
          key={source ?? ''}
          sourceUrl={source}
          logoUrl={values.logoUrl}
          onPick={(url) => props.onChange('logoUrl', url)}
        />
      </TextInput>
      <TextInput {...props} name="coverImageUrl" label="커버 이미지 주소" type="url" wide>
        {cover ? <ImagePreview key={cover} url={cover} /> : null}
      </TextInput>
    </Section>
  );
}

/**
 * 직무·조건. 직군과 직무는 서로를 따른다.
 *
 * 직군을 바꾸면 직무를 비운다 — 다른 직군의 직무가 남으면 서버가 400 을 준다. 직무를 고르면 직군을
 * 그 직무의 직군으로 채운다. 직군이 비어 있으면 직무 전체에서 고를 수 있다.
 */
export function ConditionSection(props: JobInfoSectionProps) {
  const { values, before, onChange } = props;
  const roles = values.jobField
    ? enumChildren('JobRole', values.jobField)
    : enumOptions('JobRole').map((option) => option.value);
  const roleCleared = values.jobField !== before.jobField && values.jobRole === '';

  return (
    <Section title="직무·조건">
      <Field label="직군" htmlFor="job-jobField">
        <Select
          id="job-jobField"
          className="w-full"
          options={[NONE, ...enumOptions('JobField')]}
          value={values.jobField}
          onChange={(event) => {
            onChange('jobField', event.target.value);
            onChange('jobRole', '');
          }}
        />
      </Field>
      <Field
        label="직무"
        htmlFor="job-jobRole"
        hint={roleCleared ? '직무를 고르지 않으면 기존 직무는 지워집니다.' : undefined}
      >
        <Select
          id="job-jobRole"
          className="w-full"
          options={[
            NONE,
            ...roles.map((role) => ({ value: role, label: enumLabel('JobRole', role) })),
          ]}
          value={values.jobRole}
          onChange={(event) => {
            const role = event.target.value;
            onChange('jobRole', role);
            const field = role ? enumParent('JobRole', role) : undefined;
            if (field) {
              onChange('jobField', field);
            }
          }}
        />
      </Field>
      <Field label="고용 형태" htmlFor="job-employmentType" required>
        <Select
          id="job-employmentType"
          className="w-full"
          options={enumOptions('JobEmploymentType')}
          value={values.employmentType}
          onChange={(event) => onChange('employmentType', event.target.value)}
        />
      </Field>
      <Field label="경력" htmlFor="job-experienceType" required>
        <Select
          id="job-experienceType"
          className="w-full"
          options={enumOptions('JobExperienceType')}
          value={values.experienceType}
          onChange={(event) => onChange('experienceType', event.target.value)}
        />
      </Field>
      <TextInput
        {...props}
        name="experienceMinYears"
        label="최소 경력 연수"
        type="number"
        min={0}
      />
      <Field label="학력" htmlFor="job-educationLevel" required>
        <Select
          id="job-educationLevel"
          className="w-full"
          options={enumOptions('JobEducationLevel')}
          value={values.educationLevel}
          onChange={(event) => onChange('educationLevel', event.target.value)}
        />
      </Field>
      <Field
        label="근무 지역"
        htmlFor="job-region"
        hint={
          values.region !== before.region ? '시·군·구는 저장할 때 서버가 정리합니다.' : undefined
        }
      >
        <Select
          id="job-region"
          className="w-full"
          options={[NONE, ...enumOptions('Region')]}
          value={values.region}
          onChange={(event) => onChange('region', event.target.value)}
        />
      </Field>
    </Section>
  );
}

/**
 * 모집. 상시 채용이면 마감일을 비우고 잠근다 — 서버가 지우고, 상시 채용에 마감일을 보내면 400 이다.
 * 기간으로 되돌리면 마감일 칸이 빈 채로 다시 열린다.
 */
export function RecruitmentSection(props: JobInfoSectionProps) {
  const { values, errors, onChange } = props;
  const alwaysOpen = values.recruitmentType === 'ALWAYS_OPEN';

  return (
    <Section title="모집">
      <Field label="모집 기간 유형" htmlFor="job-recruitmentType" required>
        <Select
          id="job-recruitmentType"
          className="w-full"
          options={enumOptions('JobRecruitmentType')}
          value={values.recruitmentType}
          onChange={(event) => {
            onChange('recruitmentType', event.target.value);
            onChange('recruitmentEndAt', '');
          }}
        />
      </Field>
      <TextInput {...props} name="recruitmentStartAt" label="모집 시작일" type="date" />
      <Field
        label="모집 마감일"
        htmlFor="job-recruitmentEndAt"
        hint={alwaysOpen ? '상시 채용은 마감일이 없습니다.' : undefined}
        error={errors.recruitmentEndAt}
      >
        <Input
          id="job-recruitmentEndAt"
          type="date"
          disabled={alwaysOpen}
          value={values.recruitmentEndAt}
          onChange={(event) => onChange('recruitmentEndAt', event.target.value)}
        />
      </Field>
      <TextInput {...props} name="recruitmentHeadcount" label="모집 인원" type="number" min={1} />
      <div className="flex flex-wrap gap-x-6 gap-y-2 pb-4 sm:col-span-2">
        <Checkbox
          label="충원 시 마감"
          checked={values.closesWhenFilled}
          onChange={(checked) => onChange('closesWhenFilled', checked)}
        />
        <Checkbox
          label="마감일 자동 마감"
          checked={values.autoCloseEnabled}
          onChange={(checked) => onChange('autoCloseEnabled', checked)}
        />
      </div>
      <Field label="모집 안내" htmlFor="job-recruitmentNotice" className="sm:col-span-2">
        <Textarea
          id="job-recruitmentNotice"
          rows={3}
          value={values.recruitmentNotice}
          onChange={(event) => onChange('recruitmentNotice', event.target.value)}
        />
      </Field>
    </Section>
  );
}

export function ApplySection(props: JobInfoSectionProps) {
  const { values, onChange } = props;
  return (
    <Section title="지원">
      <Field label="지원 방법" htmlFor="job-applicationMethod">
        <Select
          id="job-applicationMethod"
          className="w-full"
          options={[NONE, ...enumOptions('JobApplicationMethod')]}
          value={values.applicationMethod}
          onChange={(event) => onChange('applicationMethod', event.target.value)}
        />
      </Field>
      <TextInput {...props} name="applyEmail" label="지원 이메일" type="email" />
      <TextInput {...props} name="inquiryEmail" label="문의 이메일" type="email" />
      <TextInput {...props} name="sourceUrl" label="원문 주소" type="url" wide />
    </Section>
  );
}
