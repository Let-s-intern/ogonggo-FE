import { useState, type ReactNode } from 'react';
import { enumOptions } from '@ogonggo/api/src/admin';
import { Button, Callout, Card, Checkbox, Field, Input, Select, Textarea } from '@ogonggo/ui';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { BOOTCAMP_RECRUITMENT_STATUS_OPTIONS, VISIBILITY_OPTIONS } from '@/shared/config/labels';
import { validateBootcampForm, type BootcampFormErrors } from '../model/validate';
import { EMPTY_CURRICULUM_ROW, PROGRAM_TYPES, type BootcampFormValues } from '../model/values';
import { ImageUploadField } from './ImageUploadField';
import { OrderedRows } from './OrderedRows';

/** 고르기 전 첫 줄. `<select>` 는 값이 늘 있어야 해서 빈 문자열을 자리로 쓴다. */
const placeholder = (label: string) => ({ value: '', label });

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="pt-2">
      <h3 className="pb-3 text-sm font-semibold text-gray-900">{title}</h3>
      <div className="grid gap-x-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export interface BootcampFormProps {
  initial: BootcampFormValues;
  /**
   * `create` 는 대리 등록이다. 대표 이미지가 필수이고 노출을 고른다.
   * `edit` 는 전체 수정이다. 대표 이미지를 비워 둘 수 있고(수집 부트캠프에는 없는 과정이 있다) 노출은 운영 값 수정이 바꾼다.
   */
  mode: 'create' | 'edit';
  /** 검증을 통과한 값으로 부른다. */
  onSubmit: (values: BootcampFormValues) => void;
  onCancel: () => void;
  pending: boolean;
  /** 저장 실패. 서버 문구가 있으면 그대로 보인다. */
  error: unknown;
}

/**
 * 어드민 부트캠프 폼. 대리 등록(`pages/proxy-bootcamp-new`)과 전체 수정(`pages/bootcamp-edit`)이 함께 쓴다.
 * 칸과 검증은 비즈니스 앱의 부트캠프 폼을 옮겼다(`../model/values.ts`).
 */
export function BootcampForm({
  initial,
  mode,
  onSubmit,
  onCancel,
  pending,
  error,
}: BootcampFormProps) {
  const [values, setValues] = useState(initial);
  /** 저장을 한 번 누른 뒤부터 칸 오류를 보인다. */
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof BootcampFormValues>(key: K, value: BootcampFormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const errors = validateBootcampForm(values, { requireRepresentativeImage: mode === 'create' });
  const hasErrors = Object.keys(errors).length > 0;
  const shown: BootcampFormErrors = submitted ? errors : {};
  const alwaysOpen = values.recruitmentType === 'ALWAYS_OPEN';

  /** 한 줄 글 칸. */
  const text = (
    key: {
      [K in keyof BootcampFormValues]: BootcampFormValues[K] extends string ? K : never;
    }[keyof BootcampFormValues],
    label: string,
    options: { required?: boolean; type?: string; wide?: boolean; hint?: string } = {},
  ) => (
    <Field
      label={label}
      htmlFor={`bootcamp-${key}`}
      required={options.required}
      hint={options.hint}
      error={shown[key]}
      className={options.wide ? 'sm:col-span-2' : undefined}
    >
      <Input
        id={`bootcamp-${key}`}
        type={options.type ?? 'text'}
        value={values[key]}
        onChange={(event) => set(key, event.target.value as BootcampFormValues[typeof key])}
      />
    </Field>
  );

  /** 여러 줄 글 칸. 두 칸 너비다. */
  const longText = (
    key:
      | 'shortDescription'
      | 'content'
      | 'eligibilityAndSelectionProcess'
      | 'instructorInfo'
      | 'programFeatures'
      | 'completionRequirements',
    label: string,
    rows: number,
    required = false,
  ) => (
    <Field
      label={label}
      htmlFor={`bootcamp-${key}`}
      required={required}
      error={shown[key]}
      className="sm:col-span-2"
    >
      <Textarea
        id={`bootcamp-${key}`}
        rows={rows}
        value={values[key]}
        onChange={(event) => set(key, event.target.value)}
      />
    </Field>
  );

  const save = () => {
    setSubmitted(true);
    if (hasErrors) {
      return;
    }
    onSubmit(values);
  };

  return (
    <Card>
      {error ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(error) ??
            (mode === 'create' ? '등록하지 못했습니다.' : '저장하지 못했습니다.')}
        </Callout>
      ) : null}

      <Section title="기본 정보">
        {text('companyName', '기업·기관명', { required: true })}
        {text('title', '프로그램명', { required: true })}
        <Field
          label="프로그램 유형"
          htmlFor="bootcamp-programType"
          required
          error={shown.programType}
        >
          <Select
            id="bootcamp-programType"
            className="w-full"
            options={[
              placeholder('프로그램 유형을 골라 주세요.'),
              // 수집 과정은 목록 밖의 유형(`KDT` 등)을 가진다. 저장된 값이 빈칸처럼 보이지 않게 선택지에 둔다.
              ...[
                ...PROGRAM_TYPES,
                ...(initial.programType && !PROGRAM_TYPES.includes(initial.programType)
                  ? [initial.programType]
                  : []),
              ].map((type) => ({ value: type, label: type })),
            ]}
            value={values.programType}
            onChange={(event) => set('programType', event.target.value)}
          />
        </Field>
        <Field
          label="진행 방식"
          htmlFor="bootcamp-operationType"
          required
          error={shown.operationType}
        >
          <Select
            id="bootcamp-operationType"
            className="w-full"
            options={[
              placeholder('진행 방식을 골라 주세요.'),
              ...enumOptions('BootcampOperationType'),
            ]}
            value={values.operationType}
            onChange={(event) =>
              set('operationType', event.target.value as BootcampFormValues['operationType'])
            }
          />
        </Field>
        {text('programStartDate', '교육 시작일', { required: true, type: 'date' })}
        {text('programEndDate', '교육 종료일', { required: true, type: 'date' })}
        {text('capacity', '정원', { type: 'number' })}
        <Field
          label="수강료 유형"
          htmlFor="bootcamp-tuitionType"
          required
          error={shown.tuitionType}
        >
          <Select
            id="bootcamp-tuitionType"
            className="w-full"
            options={[
              placeholder('수강료 유형을 골라 주세요.'),
              ...enumOptions('BootcampTuitionType'),
            ]}
            value={values.tuitionType}
            onChange={(event) =>
              set('tuitionType', event.target.value as BootcampFormValues['tuitionType'])
            }
          />
        </Field>
        {text('tuitionAmount', '수강료(원)', { type: 'number' })}
      </Section>

      <Section title="이미지">
        <ImageUploadField
          id="bootcamp-representativeImageUrl"
          label="대표 이미지"
          required={mode === 'create'}
          value={values.representativeImageUrl}
          onChange={(url) => set('representativeImageUrl', url)}
          error={shown.representativeImageUrl}
        />
        <ImageUploadField
          id="bootcamp-logoUrl"
          label="로고"
          hint={mode === 'create' ? '회원의 기업 로고가 있으면 채워 둡니다.' : undefined}
          value={values.logoUrl}
          onChange={(url) => set('logoUrl', url)}
          error={shown.logoUrl}
        />
      </Section>

      <Section title="내용">
        {longText('shortDescription', '한 줄 소개', 2, true)}
        {longText('content', '상세 내용', 8, true)}
        {longText('eligibilityAndSelectionProcess', '지원 자격 및 전형 안내', 4)}
        {longText('instructorInfo', '강사 정보', 3)}
        {longText('programFeatures', '교육 특징/혜택', 3)}
        {longText('completionRequirements', '수료 조건', 3)}
      </Section>

      <Section title="수료 후 파트너사">
        <Field label="파트너사" error={shown.partners} className="sm:col-span-2">
          <OrderedRows
            rows={values.partners}
            onChange={(rows) => set('partners', rows)}
            empty=""
            addLabel="파트너사 추가"
            renderRow={(row, index, update) => (
              <Input
                aria-label={`파트너사 ${index + 1}`}
                value={row}
                onChange={(event) => update(event.target.value)}
              />
            )}
          />
        </Field>
      </Section>

      <Section title="커리큘럼">
        <Field
          label="주차별 내용"
          hint="종료 주차를 비우면 시작 주차 한 주로 저장합니다."
          error={shown.curriculums}
          className="sm:col-span-2"
        >
          <OrderedRows
            rows={values.curriculums}
            onChange={(rows) => set('curriculums', rows)}
            empty={EMPTY_CURRICULUM_ROW}
            addLabel="커리큘럼 추가"
            renderRow={(row, index, update) => (
              <>
                <Input
                  aria-label={`${index + 1}번째 줄 시작 주차`}
                  type="number"
                  min={1}
                  placeholder="시작 주차"
                  className="w-28 shrink-0"
                  value={row.startWeek}
                  onChange={(event) => update({ ...row, startWeek: event.target.value })}
                />
                <Input
                  aria-label={`${index + 1}번째 줄 종료 주차`}
                  type="number"
                  min={1}
                  placeholder="종료 주차"
                  className="w-28 shrink-0"
                  value={row.endWeek}
                  onChange={(event) => update({ ...row, endWeek: event.target.value })}
                />
                <Input
                  aria-label={`${index + 1}번째 줄 내용`}
                  placeholder="주차별 내용을 한 줄로 입력해 주세요."
                  value={row.subtitle}
                  onChange={(event) => update({ ...row, subtitle: event.target.value })}
                />
              </>
            )}
          />
        </Field>
      </Section>

      <Section title="모집">
        <Field label="모집 기간 유형" htmlFor="bootcamp-recruitmentType" required>
          <Select
            id="bootcamp-recruitmentType"
            className="w-full"
            options={enumOptions('BootcampRecruitmentType')}
            value={values.recruitmentType}
            onChange={(event) => {
              set('recruitmentType', event.target.value as BootcampFormValues['recruitmentType']);
              set('recruitmentEndAt', '');
            }}
          />
        </Field>
        <Field label="모집 상태" htmlFor="bootcamp-status" required>
          <Select
            id="bootcamp-status"
            className="w-full"
            options={BOOTCAMP_RECRUITMENT_STATUS_OPTIONS.slice(1)}
            value={values.status}
            onChange={(event) => set('status', event.target.value as BootcampFormValues['status'])}
          />
        </Field>
        {text('recruitmentStartAt', '모집 시작일', { type: 'date', required: !alwaysOpen })}
        <Field
          label="모집 마감일"
          htmlFor="bootcamp-recruitmentEndAt"
          required={!alwaysOpen}
          hint={alwaysOpen ? '상시 모집은 마감일이 없습니다.' : undefined}
          error={shown.recruitmentEndAt}
        >
          <Input
            id="bootcamp-recruitmentEndAt"
            type="date"
            disabled={alwaysOpen}
            value={values.recruitmentEndAt}
            onChange={(event) => set('recruitmentEndAt', event.target.value)}
          />
        </Field>
        <div className="pb-4 sm:col-span-2">
          <Checkbox
            label="모집 마감일까지 공개"
            checked={values.publishUntilRecruitmentEnd}
            onChange={(checked) => set('publishUntilRecruitmentEnd', checked)}
          />
        </div>
        {values.publishUntilRecruitmentEnd ? null : (
          <>
            {text('publicationStartAt', '공개 시작일', { type: 'date' })}
            {text('publicationEndAt', '공개 종료일', { type: 'date' })}
          </>
        )}
      </Section>

      <Section title="지원">
        <Field
          label="지원 방법"
          htmlFor="bootcamp-applicationMethod"
          required
          error={shown.applicationMethod}
        >
          <Select
            id="bootcamp-applicationMethod"
            className="w-full"
            options={[
              placeholder('지원 방법을 골라 주세요.'),
              ...enumOptions('BootcampApplicationMethod'),
            ]}
            value={values.applicationMethod}
            onChange={(event) =>
              set(
                'applicationMethod',
                event.target.value as BootcampFormValues['applicationMethod'],
              )
            }
          />
        </Field>
        {values.applicationMethod === 'EMAIL'
          ? null
          : text('applicationUrl', '지원 링크', {
              type: 'url',
              required: values.applicationMethod === 'EXTERNAL_PAGE',
            })}
        {text('managerEmail', '담당자 이메일', { type: 'email' })}
        {text('inquiryUrl', '문의 링크', { type: 'url' })}
        {text('sourceUrl', '원문 주소', { type: 'url', wide: true })}
      </Section>

      {mode === 'create' ? (
        <Section title="노출">
          <Field
            label="노출 여부"
            htmlFor="bootcamp-visibility"
            required
            hint="검수 없이 승인으로 등록됩니다. 노출이면 모집 상태와 공개 기간이 맞을 때 바로 사용자 화면에 나갑니다."
            className="sm:col-span-2"
          >
            <Select
              id="bootcamp-visibility"
              className="w-full sm:w-60"
              options={VISIBILITY_OPTIONS.slice(1)}
              value={values.visibility}
              onChange={(event) =>
                set('visibility', event.target.value as BootcampFormValues['visibility'])
              }
            />
          </Field>
        </Section>
      ) : null}

      {submitted && hasErrors ? (
        <Callout tone="error" className="mb-4">
          빨간 글이 있는 칸을 고쳐 주세요.
        </Callout>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <Button disabled={pending} onClick={save}>
          {mode === 'create' ? (pending ? '등록 중' : '등록') : pending ? '저장 중' : '저장'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          취소
        </Button>
      </div>
    </Card>
  );
}
