'use client';

import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Button, Callout, useToast } from '@ogonggo/ui';
import { isSignedIn, subscribeTokens } from '@/shared/api/authTokens';
import { clearDraft, formatSavedAt, readDraft, writeDraft } from '../lib/draft';
import {
  type AdApplicationFormValues,
  EMPTY_FORM,
  PURPOSES,
  STEPS,
  type StepNumber,
} from '../model/form';
import { StepSection } from './StepSection';

export interface AdApplicationPrefill {
  jobId?: number;
  placementKey?: string;
  startDate?: string;
  jobField?: string;
}

export interface AdApplicationFormProps {
  prefill: AdApplicationPrefill;
}

/**
 * 광고 신청서(시안 B-04). 다섯 단계 아코디언이고 한 번에 한 칸이 열린다. 비회원·기업회원이 같은 화면을 쓴다 —
 * 로그인했으면 3단계의 가입 칸이 빠지고 담당자 정보가 미리 채워진다(`memos/결정-광고시스템-business-신청서-2026-11-03.md`).
 *
 * 임시저장은 이 브라우저에 둔다. 다시 들어오면 저장한 값을 불러오고, `새로 작성` 으로 지울 수 있다.
 */
export function AdApplicationForm({ prefill: _prefill }: AdApplicationFormProps) {
  const toast = useToast();
  const signedIn = useSyncExternalStore(subscribeTokens, isSignedIn, () => false);
  const [values, setValues] = useState<AdApplicationFormValues>(EMPTY_FORM);
  const [open, setOpen] = useState<StepNumber | 0>(1);
  const [restoredAt, setRestoredAt] = useState<string | null>(null);

  // 저장소는 브라우저에만 있어 첫 렌더 뒤에 읽는다.
  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setValues(draft.values);
      setRestoredAt(draft.savedAt);
    }
  }, []);

  const patch = (next: Partial<AdApplicationFormValues>) =>
    setValues((previous) => ({ ...previous, ...next }));

  const saveDraft = () => {
    const savedAt = writeDraft(values);
    toast.show({ message: `임시저장했어요 (${formatSavedAt(savedAt)})` });
  };

  const startOver = () => {
    clearDraft();
    setValues(EMPTY_FORM);
    setRestoredAt(null);
    setOpen(1);
  };

  const done: Record<StepNumber, boolean> = { 1: false, 2: false, 3: false, 4: false, 5: false };
  const summaries: Partial<Record<StepNumber, string>> = {
    1: PURPOSES.find((purpose) => purpose.value === values.purpose)?.label,
  };

  const body = (n: StepNumber) => {
    switch (n) {
      case 1:
        return (
          <fieldset className="flex flex-col gap-3">
            <legend className="pb-3 text-sm font-semibold text-gray-900">광고 목적</legend>
            <div className="grid gap-2 md:grid-cols-3">
              {PURPOSES.map((purpose) => (
                <label
                  key={purpose.value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-4 py-3 text-sm has-checked:border-blue-500 has-checked:bg-blue-00"
                >
                  <input
                    type="radio"
                    name="purpose"
                    value={purpose.value}
                    checked={values.purpose === purpose.value}
                    onChange={() => patch({ purpose: purpose.value })}
                    className="accent-blue-500"
                  />
                  <span className="font-semibold text-gray-900">{purpose.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-950 md:text-3xl">광고 신청</h1>
        <p className="pt-2 text-sm text-gray-500 md:text-base">
          {signedIn
            ? '게시 중인 공고를 선택하고 지면과 일정을 정해 주세요.'
            : '로그인 없이 작성할 수 있어요. 공고가 없으면 1단계에서 바로 등록하고, 3단계에서 가입이 함께 진행돼요.'}
        </p>
      </div>
      <Callout
        tone="info"
        className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between"
      >
        <span>
          신청 즉시 확정되지 않아요. 담당자 메일로 견적서와 확정 안내를 영업일 2일 안에 보내드려요.
        </span>
        <Link href="/schedule" className="shrink-0 font-semibold underline">
          신청 가능 일정 보기
        </Link>
      </Callout>
      {restoredAt ? (
        <Callout tone="success" className="flex items-center justify-between gap-3">
          <span>{formatSavedAt(restoredAt)} 에 임시저장한 신청서를 불러왔어요.</span>
          <button type="button" onClick={startOver} className="shrink-0 font-semibold underline">
            새로 작성
          </button>
        </Callout>
      ) : null}

      {STEPS.map((step) => (
        <StepSection
          key={step.n}
          n={step.n}
          title={step.title}
          description={step.description}
          open={open === step.n}
          done={done[step.n]}
          summary={summaries[step.n]}
          onToggle={() => setOpen((current) => (current === step.n ? 0 : step.n))}
          onNext={step.n < 5 ? () => setOpen((step.n + 1) as StepNumber) : undefined}
        >
          {body(step.n)}
        </StepSection>
      ))}

      <div className="sticky bottom-0 z-10 -mx-5 flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-3 md:mx-0 md:rounded-md md:border">
        <Button type="button" variant="secondary" onClick={saveDraft}>
          임시저장
        </Button>
      </div>
    </div>
  );
}
