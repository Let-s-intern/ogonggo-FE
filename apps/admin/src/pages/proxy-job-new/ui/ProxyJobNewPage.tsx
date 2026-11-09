import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { contentFieldLabel, type CreateProxyJobRequest } from '@ogonggo/api/src/admin';
import { Button, Callout, Card, Field, Input, Select, Textarea } from '@ogonggo/ui';
import { useCreateProxyJob } from '@/entities/content/api/useContent';
import { useCompanyMemberDetail } from '@/entities/member/api/useMembers';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { VISIBILITY_OPTIONS } from '@/shared/config/labels';
import {
  ApplySection,
  CompanySection,
  ConditionSection,
  JOB_BODY_FIELDS,
  RecruitmentSection,
  type JobEditorValues,
} from '@/widgets/job-editor';
import { PageHeader } from '@/widgets/page-header';
import { emptyProxyJobValues, toProxyJobRequest, validateProxyJob } from '../model/proxyJob';

type ProxyVisibility = NonNullable<CreateProxyJobRequest['visibility']>;

/**
 * 비즈니스 회원 대신 채용공고를 등록하는 화면(FE #568, 백엔드 LC-3574).
 *
 * 칸은 `내용 수정` 모달과 같은 묶음(`JobInfoSections`)이다. 등록 요청에 없는 문의 이메일만 뺀다. 회사명은 회원의 기업 정보로
 * 채워 두고 고칠 수 있다. 저장하면 검수 없이 승인되고, 고른 노출 여부로 바로 나간다. 저장 뒤 만든 공고 상세로 간다.
 */
export function ProxyJobNewPage() {
  const { memberId } = useParams();
  const member = useCompanyMemberDetail(Number(memberId));
  const backTo = {
    to: `/members/companies/${memberId}`,
    label: member.data?.organizationName ?? '비즈니스 회원',
  };

  if (member.isPending) {
    return <p className="text-sm text-gray-500">불러오는 중입니다.</p>;
  }
  if (member.isError || !member.data) {
    return (
      <>
        <PageHeader title="채용공고 대리 등록" backTo={backTo} />
        <Callout tone="error">비즈니스 회원을 찾을 수 없습니다.</Callout>
      </>
    );
  }

  return (
    <>
      <PageHeader title="채용공고 대리 등록" backTo={backTo} />
      {member.data.status !== 'ACTIVE' ? (
        <Callout tone="warning" className="mb-4">
          정지·탈퇴한 회원입니다. 저장하면 서버가 거절합니다.
        </Callout>
      ) : null}
      <ProxyJobForm
        memberId={member.data.userId}
        initial={emptyProxyJobValues(member.data.organizationName ?? '')}
      />
    </>
  );
}

function ProxyJobForm({ memberId, initial }: { memberId: number; initial: JobEditorValues }) {
  const navigate = useNavigate();
  const mutation = useCreateProxyJob(memberId);
  const [values, setValues] = useState(initial);
  const [visibility, setVisibility] = useState<ProxyVisibility>('VISIBLE');
  /** 저장을 한 번 누른 뒤부터 칸 오류를 보인다. 빈 화면이 처음부터 빨간 글로 덮이지 않게 한다. */
  const [submitted, setSubmitted] = useState(false);

  const onChange = <K extends keyof JobEditorValues>(key: K, value: JobEditorValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const errors = validateProxyJob(values);
  const hasErrors = Object.keys(errors).length > 0;
  // `before` 는 고친 칸에 붙는 안내(기존 직무 지움, 시·군·구 정리)를 가린다. 새 공고에는 기존 값이 없어 지금 값을 넘겨 끈다.
  const sectionProps = { values, before: values, errors: submitted ? errors : {}, onChange };

  const save = () => {
    setSubmitted(true);
    if (hasErrors) {
      return;
    }
    mutation.mutate(toProxyJobRequest(values, visibility), {
      onSuccess: (job) =>
        navigate(job ? `/content/jobs/${job.id}` : `/members/companies/${memberId}`),
    });
  };

  return (
    <Card>
      {mutation.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(mutation.error) ?? '등록하지 못했습니다.'}
        </Callout>
      ) : null}

      <Field label="제목" htmlFor="job-title" required error={submitted ? errors.title : undefined}>
        <Input
          id="job-title"
          value={values.title}
          onChange={(event) => onChange('title', event.target.value)}
        />
      </Field>

      <CompanySection {...sectionProps} />
      <ConditionSection {...sectionProps} />
      <RecruitmentSection {...sectionProps} />
      <ApplySection {...sectionProps} showInquiryEmail={false} />

      <section className="pt-2">
        <h3 className="pb-3 text-sm font-semibold text-gray-900">본문</h3>
        {JOB_BODY_FIELDS.map((field) => (
          <Field
            key={field}
            label={contentFieldLabel('JobContentField', field)}
            htmlFor={`job-${field}`}
          >
            <Textarea
              id={`job-${field}`}
              rows={5}
              value={values.fields[field]}
              onChange={(event) =>
                onChange('fields', { ...values.fields, [field]: event.target.value })
              }
            />
          </Field>
        ))}
      </section>

      <section className="pt-2">
        <h3 className="pb-3 text-sm font-semibold text-gray-900">노출</h3>
        <Field
          label="노출 여부"
          htmlFor="job-visibility"
          required
          hint="검수 없이 승인으로 등록됩니다. 노출을 고르면 저장하자마자 사용자 화면에 나갑니다."
        >
          <Select
            id="job-visibility"
            className="w-full sm:w-60"
            options={VISIBILITY_OPTIONS.slice(1)}
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as ProxyVisibility)}
          />
        </Field>
      </section>

      {submitted && hasErrors ? (
        <Callout tone="error" className="mb-4">
          빨간 글이 있는 칸을 고쳐 주세요.
        </Callout>
      ) : null}

      <div className="flex items-center gap-2 pt-2">
        <Button disabled={mutation.isPending} onClick={save}>
          {mutation.isPending ? '등록 중' : '등록'}
        </Button>
        <Button variant="secondary" onClick={() => navigate(`/members/companies/${memberId}`)}>
          취소
        </Button>
      </div>
    </Card>
  );
}
