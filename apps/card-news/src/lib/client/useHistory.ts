'use client';

import { useCallback, useEffect, useRef } from 'react';

/** 되돌릴 수 있는 단계 수. 넘으면 가장 오래된 것부터 버린다. */
const LIMIT = 100;
/** 같은 묶음의 변경이 이 시간 안에 이어지면 한 단계로 친다(끌기, 이어 치기, 색 고르기). */
const GROUP_WINDOW = 1000;

/** 입력 칸에 포커스가 있으면 브라우저의 실행 취소에 맡긴다. */
function editingText(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

/**
 * 실행 취소·다시 실행. 바꾸기 직전의 스냅샷을 `record` 로 쌓고, Ctrl+Z(Mac 은 Cmd+Z)로 되돌리고
 * Ctrl+Shift+Z 로 다시 한다.
 *
 * `group` 이 같은 변경이 이어지면 첫 변경 앞의 스냅샷 하나만 남긴다 — 끄는 동안 수십 번 바뀌어도
 * 한 번에 되돌린다. `current` 는 지금 상태를, `apply` 는 스냅샷을 상태에 되돌려 놓는다(기록하지 않는다).
 */
export function useHistory<T>(current: () => T | null, apply: (snapshot: T) => void) {
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const last = useRef<{ group: string; at: number } | null>(null);
  const currentRef = useRef(current);
  const applyRef = useRef(apply);
  currentRef.current = current;
  applyRef.current = apply;

  const record = useCallback((snapshot: T, group?: string) => {
    const now = Date.now();
    const continuing =
      group && last.current?.group === group && now - last.current.at < GROUP_WINDOW;
    last.current = group ? { group, at: now } : null;
    if (continuing) {
      return;
    }
    past.current.push(snapshot);
    if (past.current.length > LIMIT) {
      past.current.shift();
    }
    future.current = [];
  }, []);

  const step = useCallback((from: { current: T[] }, to: { current: T[] }) => {
    const now = currentRef.current();
    const target = from.current.pop();
    if (!now || target === undefined) {
      return;
    }
    to.current.push(now);
    last.current = null;
    applyRef.current(target);
  }, []);
  const undo = useCallback(() => step(past, future), [step]);
  const redo = useCallback(() => step(future, past), [step]);

  /** 다른 공고로 넘어가면 기록을 비운다. */
  const clear = useCallback(() => {
    past.current = [];
    future.current = [];
    last.current = null;
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.key.toLowerCase() !== 'z' ||
        editingText(event.target)
      ) {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  return { record, undo, redo, clear };
}
