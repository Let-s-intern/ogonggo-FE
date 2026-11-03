'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMyAccount } from '@/shared/api/useMyAccount';
import {
  clearCompanyPostDraft,
  readCompanyPostDraft,
  writeCompanyPostDraft,
  type CompanyPostDraft,
  type CompanyPostDraftKind,
} from './companyPostDraft';

/** 자동 저장 간격. 바뀐 것이 없으면 쓰지 않는다. */
const AUTOSAVE_INTERVAL_MS = 5000;

/** 작성한 공고 목록의 이어쓰기 카드가 붙이는 쿼리(`?draft=continue`). 있으면 묻지 않고 초안을 불러온다. */
const CONTINUE_DRAFT_PARAM = 'draft';
const CONTINUE_DRAFT_VALUE = 'continue';
export const CONTINUE_DRAFT_QUERY = `${CONTINUE_DRAFT_PARAM}=${CONTINUE_DRAFT_VALUE}`;

type Phase<T> =
  /** 계정을 아직 모르거나 저장소를 아직 읽지 않았다. 자동 저장을 하지 않는다. */
  | { kind: 'pending' }
  /** 저장된 초안이 있어 이어 쓸지 묻는 중이다. 답하기 전에는 그 초안을 덮어쓰지 않는다. */
  | { kind: 'offer'; draft: CompanyPostDraft<T> }
  | { kind: 'active' };

export interface UseCompanyPostDraftOptions<T> {
  kind: CompanyPostDraftKind;
  /** 새 공고에서만 켠다. 이미 저장된 공고를 고칠 때는 서버 값이 기준이다. */
  enabled: boolean;
  values: T;
  /** 손대지 않은 폼의 값. 이것과 같으면 자동 저장하지 않는다 — 빈 초안이 이어쓰기로 뜬다. */
  emptyValues: T;
  /** 초안을 불러올 때 부른다. 저장 뒤에 폼에 생긴 칸이 있을 수 있어 부르는 쪽이 빈 값과 합친다. */
  onRestore: (values: T) => void;
}

export interface CompanyPostDraftControls {
  /** 이어 쓸지 묻는 초안의 저장 시각. 묻는 중이 아니면 `undefined` 다. */
  offeredSavedAt?: string;
  /** 마지막으로 저장한 시각. 자동 저장 표시에 쓴다. */
  savedAt?: string;
  restore: () => void;
  discard: () => void;
  /** 지금 값을 바로 저장한다. 저장한 시각, 저장하지 못했으면 `null` 이다. */
  saveNow: () => string | null;
  /** `공고 등록` 이 성공하면 부른다. 초안을 지우고 자동 저장을 멈춘다. */
  clear: () => void;
}

/**
 * 기업 공고 작성 폼의 로컬 임시저장(`companyPostDraft.ts`). 폼을 열면 저장된 초안이 있는지 보고,
 * 그 뒤로는 5 초마다 바뀐 값을 저장한다. 탭을 닫거나 다른 곳으로 갈 때(`pagehide`) 한 번 더 저장해
 * 마지막 몇 초가 사라지지 않게 한다.
 */
export function useCompanyPostDraft<T>({
  kind,
  enabled,
  values,
  emptyValues,
  onRestore,
}: UseCompanyPostDraftOptions<T>): CompanyPostDraftControls {
  const account = useMyAccount();
  const userId = account.kind === 'ready' ? account.account.userId : undefined;
  const [phase, setPhase] = useState<Phase<T>>({ kind: 'pending' });
  const [savedAt, setSavedAt] = useState<string>();

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const emptyJson = useRef(JSON.stringify(emptyValues)).current;
  /** 마지막으로 저장한(또는 불러온) 값. 같으면 다시 쓰지 않는다. */
  const lastSavedJson = useRef(emptyJson);
  const stopped = useRef(false);

  useEffect(() => {
    if (!enabled || userId === undefined) {
      return;
    }
    const draft = readCompanyPostDraft<T>(kind, userId);
    if (!draft) {
      setPhase({ kind: 'active' });
      return;
    }
    if (
      new URLSearchParams(window.location.search).get(CONTINUE_DRAFT_PARAM) === CONTINUE_DRAFT_VALUE
    ) {
      lastSavedJson.current = JSON.stringify(draft.values);
      onRestoreRef.current(draft.values);
      setSavedAt(draft.savedAt);
      setPhase({ kind: 'active' });
      return;
    }
    setPhase({ kind: 'offer', draft });
  }, [enabled, kind, userId]);

  const write = useCallback(
    (force: boolean): string | null => {
      if (userId === undefined || stopped.current) {
        return null;
      }
      const json = JSON.stringify(valuesRef.current);
      if (!force && (json === lastSavedJson.current || json === emptyJson)) {
        return null;
      }
      const at = writeCompanyPostDraft(kind, userId, valuesRef.current);
      if (at) {
        lastSavedJson.current = json;
        setSavedAt(at);
      }
      return at;
    },
    [emptyJson, kind, userId],
  );

  useEffect(() => {
    if (!enabled || phase.kind !== 'active') {
      return;
    }
    const timer = window.setInterval(() => write(false), AUTOSAVE_INTERVAL_MS);
    const flush = () => write(false);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', flush);
      // 폼 안의 링크로 떠나면 `pagehide` 가 오지 않는다. 마지막 몇 초는 여기서 남긴다.
      flush();
    };
  }, [enabled, phase.kind, write]);

  return {
    offeredSavedAt: phase.kind === 'offer' ? phase.draft.savedAt : undefined,
    savedAt,
    restore: () => {
      if (phase.kind !== 'offer') {
        return;
      }
      lastSavedJson.current = JSON.stringify(phase.draft.values);
      onRestoreRef.current(phase.draft.values);
      setSavedAt(phase.draft.savedAt);
      setPhase({ kind: 'active' });
    },
    discard: () => {
      if (userId !== undefined) {
        clearCompanyPostDraft(kind, userId);
      }
      setPhase({ kind: 'active' });
    },
    saveNow: () => {
      const at = write(true);
      // 이어 쓸지 묻는 중에 누르면 지금 쓰는 내용이 그 초안을 대신한다. 묻는 줄은 닫는다.
      if (at && phase.kind === 'offer') {
        setPhase({ kind: 'active' });
      }
      return at;
    },
    clear: () => {
      stopped.current = true;
      if (userId !== undefined) {
        clearCompanyPostDraft(kind, userId);
      }
    },
  };
}
