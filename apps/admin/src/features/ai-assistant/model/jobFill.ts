import { useSyncExternalStore } from 'react';

/**
 * AI 비서가 공고 수정 창에 채워 달라고 남긴 문장. 비서(`./tools.ts`)가 남기고, 채용공고 상세의 수정
 * 버튼(`widgets/content-actions`)이 보고 창을 열고, 수정 창(`widgets/job-editor`)이 입력 칸에 넣은 뒤 지운다.
 *
 * 저장은 여기 없다. 수정 창은 채운 값을 입력 중인 값으로만 들고 있고, 서버로 보내는 것은 사람이 누르는
 * 저장 버튼뿐이다.
 *
 * 화면 사이를 건너야 해서(비서는 레이아웃에, 수정 창은 상세 화면에 있다) React 상태 대신 모듈 하나에
 * 둔다. 한 번에 하나만 남는다 — 새로 남기면 앞의 것은 버린다.
 */

/** 비서가 채울 수 있는 칸. 제목과 본문 텍스트뿐이다(`api/assistant.ts` 의 `FILLABLE_JOB_FIELDS`). */
export const FILLABLE_JOB_FIELDS = [
  'title',
  'companyAndTeamIntroduction',
  'responsibilities',
  'qualifications',
  'preferredQualifications',
  'compensation',
  'benefits',
  'hiringProcess',
] as const;

export type FillableJobField = (typeof FILLABLE_JOB_FIELDS)[number];

export interface JobFillRequest {
  jobId: number;
  values: Partial<Record<FillableJobField, string>>;
  /** 같은 공고에 두 번 남겨도 다른 요청으로 보이게 한다. */
  nonce: number;
}

let current: JobFillRequest | null = null;
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

export function requestJobFill(jobId: number, values: JobFillRequest['values']) {
  current = { jobId, values, nonce: Date.now() };
  emit();
}

/** 넣었으면 지운다. 그 사이 새 요청이 들어왔으면 그것은 남긴다. */
export function consumeJobFill(nonce: number) {
  if (current?.nonce === nonce) {
    current = null;
    emit();
  }
}

/** 이 공고에 남은 요청. 다른 공고의 것은 보지 않는다 — 열린 창과 다른 공고에 채우는 일을 막는다. */
export function useJobFillRequest(jobId: number | null): JobFillRequest | null {
  const request = useSyncExternalStore(subscribe, () => current);
  return request && request.jobId === jobId ? request : null;
}
