'use client';

import { Field, Input, Textarea } from '@ogonggo/ui';
import { FormRichTextField } from '@/shared/ui/FormRichTextField';
import { CONTENT_EXTRA_NOTICE, type BootcampContentExtras } from '../lib/contentExtras';
import type { CompanyBootcampFormValues } from '../model/values';
import { BootcampCurriculumField } from './BootcampCurriculumField';

/** `CreateCompanyBootcampRequest.shortDescription` 의 `@maxLength`. */
const MAX_SHORT_DESCRIPTION_LENGTH = 500;

/**
 * 받을 필드가 없어 본문 뒤에 붙는 칸 셋(v5 PRD 4 절). 목업의 순서 그대로이고, 붙는 순서도
 * 같다(`lib/contentExtras.ts`).
 */
const EXTRA_FIELDS: readonly {
  key: keyof BootcampContentExtras;
  label: string;
  placeholder: string;
}[] = [
  {
    key: 'instructorInfo',
    label: '강사 정보',
    placeholder: '강사 이름, 경력, 담당 내용을 입력해 주세요.',
  },
  {
    key: 'programHighlights',
    label: '교육 특징/혜택',
    placeholder: '프로그램의 강점과 지원자에게 제공되는 혜택을 입력해 주세요.',
  },
  {
    key: 'completionRequirements',
    label: '수료 조건',
    placeholder: '출석 기준, 과제, 프로젝트 등 수료 조건을 입력해 주세요.',
  },
];

export interface BootcampContentSectionProps {
  values: CompanyBootcampFormValues;
  onChange: (patch: Partial<CompanyBootcampFormValues>) => void;
}

/**
 * 2 단 교육 상세(v5 PRD 4 절). 한 줄 소개 · 공고 상세 내용 · 커리큘럼.
 *
 * 앞의 둘은 평문이고 `shortDescription`·`content` 에 그대로 들어간다. 채용공고 폼의 본문
 * 칸들과 같은 이유로 서식 막대는 비활성이다(`shared/ui/FormRichTextField.tsx`).
 *
 * 뒤의 셋(강사 정보·교육 특징/혜택·수료 조건) 은 **입력은 받되 저장되는 자리가 다르다** —
 * 받을 필드가 없어 `content` 뒤에 이어 붙는다. 칸마다 그 말을 한 줄로 단다.
 */
export function BootcampContentSection({ values, onChange }: BootcampContentSectionProps) {
  return (
    <div>
      <Field label="한 줄 소개" htmlFor="company-bootcamp-short-description" required>
        <Input
          id="company-bootcamp-short-description"
          value={values.shortDescription}
          maxLength={MAX_SHORT_DESCRIPTION_LENGTH}
          onChange={(event) => onChange({ shortDescription: event.target.value })}
          placeholder="공고의 핵심 내용을 한 문장으로 소개해 주세요."
        />
      </Field>

      <FormRichTextField
        id="company-bootcamp-content"
        label="공고 상세 내용"
        required
        rows={8}
        value={values.content}
        onChange={(content) => onChange({ content })}
        placeholder="프로그램 소개, 교육 내용, 제공 혜택 등을 자유롭게 작성해 주세요."
      />

      <BootcampCurriculumField
        rows={values.curriculums}
        onChange={(curriculums) => onChange({ curriculums })}
      />

      {EXTRA_FIELDS.map((field) => (
        <Field
          key={field.key}
          label={field.label}
          htmlFor={`company-bootcamp-${field.key}`}
          hint={CONTENT_EXTRA_NOTICE}
        >
          <Textarea
            id={`company-bootcamp-${field.key}`}
            rows={4}
            value={values.extras[field.key]}
            onChange={(event) =>
              onChange({ extras: { ...values.extras, [field.key]: event.target.value } })
            }
            placeholder={field.placeholder}
          />
        </Field>
      ))}

      <p className="text-sm text-gray-400">내용은 공고 상세 페이지에 입력한 순서대로 노출됩니다.</p>
    </div>
  );
}
