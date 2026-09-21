'use client';

import { Field, Input } from '@ogonggo/ui';
import { FormRichTextField } from '@/shared/ui/FormRichTextField';
import type { CompanyBootcampFormValues } from '../model/values';
import { BootcampCurriculumField } from './BootcampCurriculumField';

/** `CreateCompanyBootcampRequest.shortDescription` 의 `@maxLength`. */
const MAX_SHORT_DESCRIPTION_LENGTH = 500;

export interface BootcampContentSectionProps {
  values: CompanyBootcampFormValues;
  onChange: (patch: Partial<CompanyBootcampFormValues>) => void;
}

/**
 * 2 단 교육 상세(v5 PRD 4 절). 한 줄 소개 · 공고 상세 내용 · 커리큘럼.
 *
 * 앞의 둘은 평문이고 `shortDescription`·`content` 에 그대로 들어간다. 채용공고 폼의 본문
 * 칸들과 같은 이유로 서식 막대는 비활성이다(`shared/ui/FormRichTextField.tsx`).
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
    </div>
  );
}
