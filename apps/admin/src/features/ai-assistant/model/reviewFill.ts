import { useSyncExternalStore } from 'react';
import type { Analysis } from '@ogonggo/api/src/admin';

/**
 * AI 비서가 공고 검수 편집기(`widgets/job-review`)에 채워 달라고 남긴 값. 분류 칸(`fill_job_classification`)과 분석
 * 결과(`fill_job_analysis`)다. 비서(`./tools.ts`)가 남기고, 분류는 바로 고치기(`useInlineJobEdit`)가, 분석은 분석 결과
 * 편집기(`AnalysisEditor`)가 넣은 뒤 지운다.
 *
 * 저장은 여기 없다. 편집기는 채운 값을 고치는 중인 값으로만 들고, 서버로 보내는 것은 사람이 누르는 `분류 저장`·
 * `분석 결과 저장` 뿐이다.
 *
 * 수정 창 채우기(`./jobFill.ts`)와 같이 모듈 하나에 둔다. 분류와 분석은 한 차례에 함께 올 수 있어 자리를 따로 두고,
 * 자리마다 하나만 남는다 — 새로 남기면 앞의 것은 버린다.
 */

/** 비서가 채울 수 있는 분류 칸. `widgets/job-editor` 의 `JobEditorValues` 와 같은 이름·모양(글)이다. */
export const FILLABLE_CLASSIFICATION_FIELDS = [
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
] as const;

export type FillableClassificationField = (typeof FILLABLE_CLASSIFICATION_FIELDS)[number];

export interface ClassificationFillRequest {
  jobId: number;
  values: Partial<Record<FillableClassificationField, string>>;
  /** 같은 공고에 두 번 남겨도 다른 요청으로 보이게 한다. */
  nonce: number;
}

export interface AnalysisFillRequest {
  jobId: number;
  analysis: Analysis;
  nonce: number;
}

let classification: ClassificationFillRequest | null = null;
let analysis: AnalysisFillRequest | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestClassificationFill(
  jobId: number,
  values: ClassificationFillRequest['values'],
) {
  classification = { jobId, values, nonce: Date.now() };
  emit();
}

export function requestAnalysisFill(jobId: number, next: Analysis) {
  analysis = { jobId, analysis: next, nonce: Date.now() };
  emit();
}

/** 넣었으면 지운다. 그 사이 새 요청이 들어왔으면 그것은 남긴다. */
export function consumeClassificationFill(nonce: number) {
  if (classification?.nonce === nonce) {
    classification = null;
    emit();
  }
}

export function consumeAnalysisFill(nonce: number) {
  if (analysis?.nonce === nonce) {
    analysis = null;
    emit();
  }
}

/** 이 공고에 남은 요청. 다른 공고의 것은 보지 않는다 — 열린 편집기와 다른 공고에 채우는 일을 막는다. */
export function useClassificationFill(jobId: number | null): ClassificationFillRequest | null {
  const request = useSyncExternalStore(subscribe, () => classification);
  return request && request.jobId === jobId ? request : null;
}

export function useAnalysisFill(jobId: number | null): AnalysisFillRequest | null {
  const request = useSyncExternalStore(subscribe, () => analysis);
  return request && request.jobId === jobId ? request : null;
}
