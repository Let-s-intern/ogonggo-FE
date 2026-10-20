import { useEffect, useState } from 'react';
import { contentFieldLabel, type AdminJobDetailResponse } from '@ogonggo/api/src/admin';
import { Button, Callout, Field, Input, Modal, Textarea } from '@ogonggo/ui';
import { usePatchJob } from '@/entities/content/api/useContent';
import { type FillableJobField, consumeJobFill, useJobFillRequest } from '@/features/ai-assistant';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import { buildPatch } from '../lib/buildPatch';
import { JOB_BODY_FIELDS, toFormValues, type JobEditorValues } from '../lib/formValues';
import { validate } from '../lib/validate';
import {
  ApplySection,
  CompanySection,
  ConditionSection,
  RecruitmentSection,
} from './JobInfoSections';

export interface JobEditorProps {
  open: boolean;
  job: AdminJobDetailResponse;
  onClose: () => void;
  onSaved: () => void;
}

/**
 * 채용공고의 제목·공고 정보·본문을 고치는 모달. 부트캠프와 검수 대기는 `ContentEditor` 를 쓴다.
 *
 * 바뀐 칸만 보낸다(`buildPatch`). 전부 보내면 열어보기만 한 칸도 같은 값으로 덮어써, 그 사이
 * 크롤러가 갱신한 값이 조용히 되돌아간다.
 *
 * 크롤링·고용24 공고는 다시 수집되면 고친 값이 덮어써진다. 그래도 고칠 수 있게 두고 경고만 한다 —
 * 다음 수집 전까지 틀린 값이 나가는 것을 막는 것이 이 화면의 쓰임이다.
 *
 * 서버 400 은 `[필드] 사유` 문구를 그대로 보인다. 화면 검증이 서버보다 느슨해 놓친 것을 운영자가
 * 어느 칸인지 알아야 고칠 수 있다. 입력값은 남긴다.
 */
export function JobEditor({ open, job, onClose, onSaved }: JobEditorProps) {
  const [before, setBefore] = useState(() => toFormValues(job));
  const [values, setValues] = useState(before);
  const mutation = usePatchJob(job.id);
  const { reset } = mutation;
  /** AI 비서가 채운 칸. 확인하라는 표시와 원래 문장을 보인다. */
  const [aiFilled, setAiFilled] = useState<ReadonlySet<FillableJobField>>(new Set());
  const fillRequest = useJobFillRequest(job.id);

  // 열 때마다 서버 값으로 되돌린다. 고치다 닫은 값이나 지난 저장 오류가 다음에 열었을 때 남아 있으면 헷갈린다.
  useEffect(() => {
    if (!open) {
      return;
    }
    const initial = toFormValues(job);
    setBefore(initial);
    setValues(initial);
    setAiFilled(new Set());
    reset();
  }, [open, job, reset]);

  /*
   * AI 비서가 남긴 문장을 입력 칸에 넣는다. 위의 되돌리기 뒤에 돌아야 해서 그 아래에 둔다(같은 렌더의
   * 효과는 적은 순서대로 돈다). 저장은 하지 않는다 — 사람이 보고 저장을 눌러야 서버로 간다.
   */
  useEffect(() => {
    if (!open || !fillRequest) {
      return;
    }
    const { title, ...body } = fillRequest.values;
    setValues((previous) => ({
      ...previous,
      ...(title !== undefined ? { title } : {}),
      fields: { ...previous.fields, ...body },
    }));
    setAiFilled(new Set(Object.keys(fillRequest.values) as FillableJobField[]));
    consumeJobFill(fillRequest.nonce);
  }, [open, fillRequest]);

  const onChange = <K extends keyof JobEditorValues>(key: K, value: JobEditorValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const errors = validate(values);
  const patch = buildPatch(before, values);
  const isDirty = Object.keys(patch).length > 0;
  const canSave = isDirty && Object.keys(errors).length === 0 && !mutation.isPending;
  const sectionProps = { values, before, errors, onChange };

  return (
    <Modal
      open={open}
      title="내용 수정"
      description="운영자가 고친 내용은 사용자 화면에 그대로 나갑니다."
      onClose={onClose}
      className="w-[min(48rem,calc(100vw-2rem))]"
    >
      {mutation.isError ? (
        <Callout tone="error" className="mb-4">
          {serverErrorMessage(mutation.error) ?? '저장하지 못했습니다.'}
        </Callout>
      ) : null}

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {job.source === 'CRAWLER' || job.source === 'WORK24' ? (
          <Callout tone="warning" className="mb-4">
            다시 수집되면 고친 값이 수집값으로 덮어써집니다.
          </Callout>
        ) : null}

        {aiFilled.size > 0 ? (
          <Callout tone="info" className="mb-4">
            AI 비서가 칸을 채웠습니다. 파란 테두리 칸을 확인하고 저장을 눌러야 반영됩니다.
          </Callout>
        ) : null}

        <Field
          label="제목"
          htmlFor="job-title"
          required
          error={errors.title}
          hint={aiFilled.has('title') ? `AI 가 채웠습니다. 원래 제목: ${before.title}` : undefined}
        >
          <Input
            id="job-title"
            className={aiFilled.has('title') ? 'border-blue-400 ring-2 ring-blue-100' : undefined}
            value={values.title}
            onChange={(event) => onChange('title', event.target.value)}
          />
        </Field>

        <CompanySection {...sectionProps} />
        <ConditionSection {...sectionProps} />
        <RecruitmentSection {...sectionProps} />
        <ApplySection {...sectionProps} />

        <section className="pt-2">
          <h3 className="pb-3 text-sm font-semibold text-gray-900">본문</h3>
          {JOB_BODY_FIELDS.map((field) => (
            <Field
              key={field}
              label={contentFieldLabel('JobContentField', field)}
              htmlFor={`job-${field}`}
              hint={
                aiFilled.has(field)
                  ? 'AI 가 채웠습니다. 위의 원래 문장을 펼쳐 비교할 수 있습니다.'
                  : before.fields[field] === ''
                    ? '수집되지 않은 칸입니다.'
                    : undefined
              }
            >
              <Textarea
                id={`job-${field}`}
                rows={5}
                className={aiFilled.has(field) ? 'border-blue-400 ring-2 ring-blue-100' : undefined}
                value={values.fields[field]}
                onChange={(event) =>
                  onChange('fields', { ...values.fields, [field]: event.target.value })
                }
              />
              {aiFilled.has(field) ? (
                <details className="pt-2 text-sm text-gray-500">
                  <summary className="cursor-pointer">원래 문장</summary>
                  <p className="whitespace-pre-wrap pt-1">
                    {before.fields[field] || '(비어 있음)'}
                  </p>
                </details>
              ) : null}
            </Field>
          ))}
        </section>
      </div>

      <div className="flex items-center gap-2 pt-4">
        <Button
          disabled={!canSave}
          onClick={() =>
            mutation.mutate(patch, {
              onSuccess: () => {
                onClose();
                onSaved();
              },
            })
          }
        >
          {mutation.isPending ? '저장 중' : '저장'}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          취소
        </Button>
      </div>
    </Modal>
  );
}
