'use client';

import type { CompanyJobFormValues } from '../model/values';
import { JobHiringProcessField } from './JobHiringProcessField';
import { JobRichTextField } from './JobRichTextField';

export interface JobContentSectionProps {
  values: CompanyJobFormValues;
  onChange: (patch: Partial<CompanyJobFormValues>) => void;
  /** 저장된 채용 절차를 읽어 왔는지. 그때는 행이 아니라 한 덩어리 글로 그린다. */
  hiringProcessStored: boolean;
}

/**
 * 2 단 상세 내용(v5 PRD 3 절). 주요 업무 · 자격 요건 · 우대 사항 · 혜택 및 복지 · 채용 절차.
 *
 * 앞의 넷은 평문 한 칸씩이고 `responsibilities`·`qualifications`·`preferredQualifications`·
 * `benefits` 에 그대로 들어간다. 공개 상세가 같은 순서로 그린다
 * (`widgets/job-detail/ui/JobDetailView.tsx` 의 `buildSections`).
 */
export function JobContentSection({
  values,
  onChange,
  hiringProcessStored,
}: JobContentSectionProps) {
  return (
    <div>
      <JobRichTextField
        id="company-job-responsibilities"
        label="주요 업무"
        required
        value={values.responsibilities}
        onChange={(responsibilities) => onChange({ responsibilities })}
        placeholder="담당하게 될 주요 업무 내용을 입력해 주세요."
      />

      <JobRichTextField
        id="company-job-qualifications"
        label="자격 요건"
        required
        value={values.qualifications}
        onChange={(qualifications) => onChange({ qualifications })}
        placeholder="지원자에게 필요한 자격 요건을 입력해 주세요."
      />

      <JobRichTextField
        id="company-job-preferred-qualifications"
        label="우대 사항"
        value={values.preferredQualifications}
        onChange={(preferredQualifications) => onChange({ preferredQualifications })}
        placeholder="우대되는 경험이나 역량을 입력해 주세요."
      />

      <JobRichTextField
        id="company-job-benefits"
        label="혜택 및 복지"
        value={values.benefits}
        onChange={(benefits) => onChange({ benefits })}
        placeholder="회사에서 제공하는 혜택 및 복지를 입력해 주세요."
      />

      <JobHiringProcessField
        value={values.hiringProcess}
        steps={values.hiringProcessSteps}
        stored={hiringProcessStored}
        onChange={onChange}
      />
    </div>
  );
}
