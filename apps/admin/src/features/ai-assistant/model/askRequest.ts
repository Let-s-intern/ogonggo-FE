import { useSyncExternalStore } from 'react';

/**
 * 다른 화면이 AI 비서에게 넣는 질문. 오늘 올라온 공고 검수의 `AI 비서에게 검수 요청` 이 남기고, 레이아웃
 * (`widgets/admin-layout`)이 보고 닫힌 패널을 열고, 패널(`../ui/AssistantPanel.tsx`)이 보낸 뒤 지운다.
 *
 * 대화는 패널 안의 `useAssistantChat` 이 들고 있어 화면이 직접 넣을 길이 없다. 수정 창 채우기(`./jobFill.ts`)와
 * 같이 모듈 하나에 둔다. 한 번에 하나만 남는다 — 새로 남기면 앞의 것은 버린다.
 *
 * 비서가 답하는 중인지도 여기서 알린다. 버튼이 그동안 잠긴다.
 */

export interface AssistantQuestion {
  text: string;
  /** 같은 질문을 두 번 남겨도 다른 요청으로 보이게 한다. */
  nonce: number;
}

let question: AssistantQuestion | null = null;
let busy = false;
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

export function requestAssistantQuestion(text: string) {
  question = { text, nonce: Date.now() };
  emit();
}

/** 보냈으면 지운다. 그 사이 새 질문이 들어왔으면 그것은 남긴다. */
export function consumeAssistantQuestion(nonce: number) {
  if (question?.nonce === nonce) {
    question = null;
    emit();
  }
}

export function useAssistantQuestion(): AssistantQuestion | null {
  return useSyncExternalStore(subscribe, () => question);
}

/** 패널이 답하는 중인지 알린다. */
export function setAssistantBusy(next: boolean) {
  if (busy !== next) {
    busy = next;
    emit();
  }
}

export function useAssistantBusy(): boolean {
  return useSyncExternalStore(subscribe, () => busy);
}
