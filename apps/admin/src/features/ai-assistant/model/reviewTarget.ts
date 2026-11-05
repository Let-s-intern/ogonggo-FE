import { useSyncExternalStore } from 'react';

/**
 * AI 비서가 오늘 올라온 공고 검수 화면에서 열어 달라고 남긴 공고. 비서(`./tools.ts` 의 `open_review_job`)가 남기고,
 * 검수 화면(`pages/new-job-review`)이 그 공고로 넘긴 뒤 지운다.
 *
 * 주소의 `?job=` 은 화면이 보고 있는 공고를 적는 칸이라 읽지 않는다 — 화면이 적은 값과 남이 바꾼 값이 섞인다.
 * 수정 창 채우기(`./jobFill.ts`)와 같이 모듈 하나에 두고, 한 번에 하나만 남긴다.
 */

export interface ReviewJobRequest {
  jobId: number;
  /** 같은 공고를 두 번 남겨도 다른 요청으로 보이게 한다. */
  nonce: number;
}

let current: ReviewJobRequest | null = null;
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

export function requestReviewJob(jobId: number) {
  current = { jobId, nonce: Date.now() };
  emit();
}

/** 넘겼으면 지운다. 그 사이 새 요청이 들어왔으면 그것은 남긴다. */
export function consumeReviewJob(nonce: number) {
  if (current?.nonce === nonce) {
    current = null;
    emit();
  }
}

export function useReviewJobRequest(): ReviewJobRequest | null {
  return useSyncExternalStore(subscribe, () => current);
}
