import { useCallback, useEffect, useRef, useState } from 'react';
import type { AdminJobDetailResponse } from '@ogonggo/api/src/admin';
import { usePatchJob } from '@/entities/content/api/useContent';
import { consumeClassificationFill, useClassificationFill } from '@/features/ai-assistant';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import {
  buildPatch,
  JOB_BODY_FIELDS,
  hasAiAnalysis,
  rebuildsAnalysis,
  REBUILD_ANALYSIS_CONFIRM,
  toFormValues,
  validate,
  type JobEditorErrors,
  type JobEditorValues,
} from '@/widgets/job-editor';

/**
 * 검수 화면에서 그 자리에서 고치는 구역과 각 구역이 맡는 입력값. 구역마다 `저장` 하나다.
 *
 * 칸마다 바로 저장하지 않는 이유: 글 칸은 치는 도중에 저장할 수 없고, 직군·직무, 모집 유형·마감일처럼 서로를
 * 따르는 칸은 한쪽만 저장하면 서버가 400 을 준다. 구역은 화면에 보이는 묶음 그대로다.
 */
export const INLINE_SECTIONS = {
  thumbnails: { label: '썸네일', keys: ['logoUrl', 'coverImageUrl'] },
  classification: {
    label: '분류',
    keys: [
      'jobField',
      'jobRole',
      'employmentType',
      'experienceType',
      'experienceMinYears',
      'educationLevel',
      'region',
      'recruitmentType',
      'recruitmentStartAt',
      'recruitmentEndAt',
      'recruitmentHeadcount',
      'closesWhenFilled',
      'autoCloseEnabled',
      'recruitmentNotice',
    ],
  },
  body: { label: '본문 칸', keys: ['fields'] },
  source: { label: '원문 정보', keys: ['title', 'companyName', 'sourceUrl'] },
} as const satisfies Record<string, { label: string; keys: readonly (keyof JobEditorValues)[] }>;

export type InlineSection = keyof typeof INLINE_SECTIONS;

type Subset = Partial<JobEditorValues>;

const pick = (values: JobEditorValues, section: InlineSection): Subset =>
  Object.fromEntries(INLINE_SECTIONS[section].keys.map((key) => [key, values[key]]));

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * 서버 값이 새로 오면(저장 뒤 다시 받기, `내용 수정` 모달 저장) 고치던 칸은 남기고 나머지만 새 값으로 바꾼다.
 * 본문은 칸마다 따로 본다.
 */
function rebase(
  previous: { before: JobEditorValues; values: JobEditorValues },
  base: JobEditorValues,
) {
  const values = { ...base, fields: { ...base.fields } };
  for (const key of Object.keys(base) as (keyof JobEditorValues)[]) {
    if (key === 'fields') {
      for (const field of JOB_BODY_FIELDS) {
        if (previous.values.fields[field] !== previous.before.fields[field]) {
          values.fields[field] = previous.values.fields[field];
        }
      }
    } else if (!same(previous.values[key], previous.before[key])) {
      (values as Record<string, unknown>)[key] = previous.values[key];
    }
  }
  return { before: base, values };
}

/** 마지막 저장. 한 번만 되돌린다(이 화면의 다른 동작과 같다). 저장한 공고에서만 되돌린다. */
interface LastSave {
  jobId: number;
  section: InlineSection;
  before: Subset;
  after: Subset;
}

/**
 * 오늘 올라온 공고 검수의 바로 고치기(2026-11-04 사용자). 왼쪽 칸의 썸네일·분류·본문, 오른쪽 칸 머리의 제목·
 * 회사명·원문 주소를 `PATCH /api/v1/admin/jobs/{jobId}` 로 저장한다.
 *
 * 입력값·검사·요청 모양은 `내용 수정` 모달(`widgets/job-editor`)의 것을 그대로 쓴다. 구역의 바뀐 칸만 보낸다
 * (`buildPatch`). 다른 구역에서 고치던 값은 싣지 않는다.
 */
export function useInlineJobEdit(job: AdminJobDetailResponse | undefined) {
  const [state, setState] = useState<{
    id: number;
    before: JobEditorValues;
    values: JobEditorValues;
  } | null>(null);
  const jobIdRef = useRef<number | null>(null);
  const [saving, setSaving] = useState<InlineSection | null>(null);
  const [errorOf, setErrorOf] = useState<Partial<Record<InlineSection, string>>>({});
  const [lastSave, setLastSave] = useState<LastSave | null>(null);
  const mutation = usePatchJob(job?.id ?? 0);

  // 다른 공고로 넘어가면 처음부터, 같은 공고의 새 값이면 고치던 칸을 남긴다.
  useEffect(() => {
    if (!job) {
      return;
    }
    const base = toFormValues(job);
    if (jobIdRef.current === job.id) {
      setState((previous) =>
        previous
          ? { id: job.id, ...rebase(previous, base) }
          : { id: job.id, before: base, values: base },
      );
      return;
    }
    jobIdRef.current = job.id;
    setState({ id: job.id, before: base, values: base });
    setErrorOf({});
    setLastSave(null);
  }, [job]);

  // 다른 공고로 넘어간 첫 그림은 효과가 돌기 전이라 앞 공고의 값이 남아 있다. 그때는 새 공고의 값을 그린다.
  const active =
    job && state?.id === job.id
      ? state
      : job
        ? { id: job.id, before: toFormValues(job), values: toFormValues(job) }
        : null;

  const onChange = useCallback(
    <K extends keyof JobEditorValues>(key: K, value: JobEditorValues[K]) =>
      setState((previous) =>
        previous ? { ...previous, values: { ...previous.values, [key]: value } } : previous,
      ),
    [],
  );

  /*
   * AI 비서가 이 공고의 분류 칸을 채워 달라고 했다(`fill_job_classification`). 고치는 중인 값에만 넣는다 — 서버로 보내는
   * 것은 사람이 누르는 `분류 저장` 이다. 직군만 바꾸면 직무를 비우고, 상시 채용이면 마감일을 비운다(`ConditionSection`·
   * `RecruitmentSection` 이 칸을 바꿀 때의 규칙과 같다). 이 공고의 값이 자리 잡은 뒤에 넣는다.
   */
  const classificationFill = useClassificationFill(job?.id ?? null);
  const loadedId = state?.id ?? null;
  useEffect(() => {
    if (!classificationFill || loadedId !== classificationFill.jobId) {
      return;
    }
    consumeClassificationFill(classificationFill.nonce);
    const filled = classificationFill.values;
    setState((previous) => {
      if (!previous || previous.id !== classificationFill.jobId) {
        return previous;
      }
      const values = { ...previous.values, ...filled };
      if (
        filled.jobField !== undefined &&
        filled.jobRole === undefined &&
        filled.jobField !== previous.values.jobField
      ) {
        values.jobRole = '';
      }
      if (filled.recruitmentType === 'ALWAYS_OPEN') {
        values.recruitmentEndAt = '';
      }
      return { ...previous, values };
    });
  }, [classificationFill, loadedId]);

  if (!job || !active) {
    return null;
  }
  const { before, values } = active;
  const errors: JobEditorErrors = validate(values);

  /** 그 구역만 고친 값. 다른 구역은 연 때의 값이라 요청에 실리지 않는다. */
  const sectionPatch = (section: InlineSection, from: JobEditorValues, to: JobEditorValues) =>
    buildPatch(from, { ...from, ...pick(to, section) });

  const isDirty = (section: InlineSection) =>
    Object.keys(sectionPatch(section, before, values)).length > 0;

  const sectionErrors = (section: InlineSection) =>
    (INLINE_SECTIONS[section].keys as readonly string[]).flatMap((key) =>
      errors[key as keyof JobEditorValues] ? [errors[key as keyof JobEditorValues]!] : [],
    );

  /**
   * 저장을 보낸다. 보낸 공고 id 를 붙잡아 둔다 — 응답이 오기 전에 다른 공고로 넘어가면(검수 화면의 A/D) 응답의
   * 값을 다음 공고에 합치거나 그 공고의 되돌리기로 남기면 안 된다. 그때는 응답을 버린다. 요청 자체는 보낸 공고에
   * 간다(`usePatchJob` 의 `jobId` 는 보낼 때 정해진다). 화면은 저장 중에 넘기지 못하게 막는다(`useIsMutating`).
   */
  const send = (section: InlineSection, from: Subset, to: Subset, onDone: () => void) => {
    const patch = buildPatch({ ...before, ...from }, { ...before, ...from, ...to });
    if (Object.keys(patch).length === 0) {
      return;
    }
    const jobId = job.id;
    const stillHere = () => jobIdRef.current === jobId;
    setSaving(section);
    setErrorOf((previous) => ({ ...previous, [section]: undefined }));
    mutation.mutate(patch, {
      onSuccess: () => {
        if (!stillHere()) {
          return;
        }
        // 다시 받기 전에도 저장 버튼이 잠기도록 연 때의 값을 저장한 값으로 맞춘다.
        setState((previous) =>
          previous && previous.id === jobId
            ? {
                ...previous,
                before: { ...previous.before, ...to },
                values: { ...previous.values, ...to },
              }
            : previous,
        );
        onDone();
      },
      onError: (caught) => {
        if (!stillHere()) {
          return;
        }
        setErrorOf((previous) => ({
          ...previous,
          [section]: serverErrorMessage(caught) ?? '저장하지 못했습니다. 다시 시도해 주세요.',
        }));
      },
      onSettled: () => setSaving(null),
    });
  };

  const save = (section: InlineSection) => {
    if (!isDirty(section) || sectionErrors(section).length > 0 || saving) {
      return;
    }
    const from = pick(before, section);
    const to = pick(values, section);
    // AI 가 만든 분석은 제목·본문·모집 안내를 바꾸면 다시 만들어진다. 그 전에 묻는다. 운영자가 고친 분석은 남는다.
    if (
      hasAiAnalysis(job) &&
      rebuildsAnalysis(sectionPatch(section, before, values)) &&
      !window.confirm(REBUILD_ANALYSIS_CONFIRM)
    ) {
      return;
    }
    const jobId = job.id;
    send(section, from, to, () => setLastSave({ jobId, section, before: from, after: to }));
  };

  /** 저장하지 않은 고침을 버린다. */
  const discard = (section: InlineSection) =>
    setState((previous) =>
      previous
        ? { ...previous, values: { ...previous.values, ...pick(previous.before, section) } }
        : previous,
    );

  /** 마지막 저장을 되돌린다. 저장 전 값을 다시 보낸다. */
  const undo = () => {
    if (!lastSave || lastSave.jobId !== job.id || saving) {
      return;
    }
    send(lastSave.section, lastSave.after, lastSave.before, () => setLastSave(null));
  };

  return {
    values,
    before,
    errors,
    onChange,
    isDirty,
    sectionErrors,
    save,
    discard,
    undo,
    lastSave: lastSave?.jobId === job.id ? lastSave : null,
    saving,
    errorOf,
  };
}

export type InlineJobEdit = NonNullable<ReturnType<typeof useInlineJobEdit>>;
