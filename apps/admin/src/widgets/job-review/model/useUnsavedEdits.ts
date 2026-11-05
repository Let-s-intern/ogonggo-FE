import { useCallback, useState } from 'react';
import { INLINE_SECTIONS, type InlineJobEdit, type InlineSection } from './useInlineJobEdit';

/** 구역 저장(`useInlineJobEdit`) 밖에서 따로 고치는 것. 분석 결과와 원문 HTML 이다. */
export type JobReviewDraft = 'analysis' | 'sourceHtml';

/**
 * 편집기 두 칸에 저장하지 않은 고침이 있는지. 구역 저장의 고침과, 분석 결과·원문 HTML 의 초안(`onDraftChange` 로
 * 알려 온다)을 합친다. 다른 공고로 넘어가거나 창을 닫기 전에 묻는 데 쓴다 — 넘어가면 이 고침은 사라진다.
 */
export function useUnsavedEdits(edit: InlineJobEdit | null) {
  const [drafts, setDrafts] = useState<Partial<Record<JobReviewDraft, boolean>>>({});

  const onDraftChange = useCallback(
    (draft: JobReviewDraft, dirty: boolean) =>
      setDrafts((previous) =>
        previous[draft] === dirty ? previous : { ...previous, [draft]: dirty },
      ),
    [],
  );

  const hasUnsaved =
    (edit
      ? (Object.keys(INLINE_SECTIONS) as InlineSection[]).some((section) => edit.isDirty(section))
      : false) || Object.values(drafts).some(Boolean);

  return { hasUnsaved, onDraftChange };
}
