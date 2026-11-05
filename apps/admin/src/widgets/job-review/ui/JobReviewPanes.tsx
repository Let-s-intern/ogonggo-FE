import { useCallback, type Ref } from 'react';
import { Button, Callout, Card, cn } from '@ogonggo/ui';
import type { NewJobDetail } from '@/entities/new-job/api/useNewJobQueue';
import { requestAssistantQuestion, useAssistantBusy } from '@/features/ai-assistant';
import type { InlineJobEdit } from '../model/useInlineJobEdit';
import type { JobReviewDraft } from '../model/useUnsavedEdits';
import { AnalysisPane } from './AnalysisPane';
import { SourcePane } from './SourcePane';

export type JobReviewPane = 'analysis' | 'source';

export interface JobReviewPanesProps {
  jobId: number;
  detail: { data: NewJobDetail | undefined; isError: boolean };
  edit: InlineJobEdit | null;
  /**
   * 두 칸을 나란히 놓을 때(본문 폭 944px 이상)의 칸 높이. Tailwind 가 읽도록 클래스 그대로 넘긴다
   * (예: `@min-[944px]:h-[calc(100vh-19rem)]`).
   */
  paneHeightClass: string;
  analysisRef?: Ref<HTMLDivElement>;
  sourceRef?: Ref<HTMLDivElement>;
  /** 마우스가 올라간 칸. 오늘 올라온 공고는 W/S 가 스크롤할 칸으로 쓴다. */
  onPaneEnter?: (pane: JobReviewPane) => void;
  /** AI 비서에게 검수를 부탁한 뒤. 오늘 올라온 공고는 키가 먹게 화면에 포커스를 돌린다. */
  onAskedAssistant?: () => void;
  /** 분석 결과·원문 HTML 에 저장하지 않은 고침이 생기거나 없어질 때. */
  onDraftChange?: (draft: JobReviewDraft, dirty: boolean) => void;
}

/**
 * 검수 편집기의 두 칸. 왼쪽은 우리가 만든 값(썸네일·분류·본문 칸·분석 결과), 오른쪽은 원문이다. 두 칸 모두 그
 * 자리에서 고친다. 오른쪽 칸 머리에 `AI 비서에게 검수 요청` 이 있다.
 *
 * 두 칸은 각자 스크롤한다. 본문 폭이 944px(비서 패널을 닫은 1280px 화면) 아래면 위아래로 쌓는다 — 비서 패널을
 * 열면 본문이 400px 줄어 화면 폭이 아니라 감싼 칸의 폭(`@container`)으로 가른다.
 */
export function JobReviewPanes({
  jobId,
  detail,
  edit,
  paneHeightClass,
  analysisRef,
  sourceRef,
  onPaneEnter,
  onAskedAssistant,
  onDraftChange,
}: JobReviewPanesProps) {
  const isAssistantBusy = useAssistantBusy();
  const onAnalysisDraft = useCallback(
    (dirty: boolean) => onDraftChange?.('analysis', dirty),
    [onDraftChange],
  );
  const onSourceDraft = useCallback(
    (dirty: boolean) => onDraftChange?.('sourceHtml', dirty),
    [onDraftChange],
  );
  return (
    <div className="@container mt-4">
      <div className="grid gap-4 @min-[944px]:grid-cols-2">
        <Card className="min-w-0 p-0" onMouseEnter={() => onPaneEnter?.('analysis')}>
          <div
            ref={analysisRef}
            tabIndex={-1}
            className={cn('overflow-y-auto p-4 outline-none', paneHeightClass)}
          >
            <h2 className="pb-4 text-base font-bold text-gray-900">공고 분석</h2>
            {detail.data && edit ? (
              <AnalysisPane job={detail.data} edit={edit} onDraftChange={onAnalysisDraft} />
            ) : detail.isError ? (
              <Callout tone="error">상세를 불러오지 못했습니다.</Callout>
            ) : (
              <p className="text-sm text-gray-500">불러오는 중입니다.</p>
            )}
          </div>
        </Card>
        <Card
          className={cn('min-w-0', paneHeightClass)}
          onMouseEnter={() => onPaneEnter?.('source')}
        >
          {detail.data ? (
            <SourcePane
              ref={sourceRef}
              job={detail.data}
              edit={edit ?? undefined}
              className="h-full"
              onDraftChange={onSourceDraft}
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isAssistantBusy}
                  title={isAssistantBusy ? 'AI 비서가 답하는 중입니다' : undefined}
                  onClick={() => {
                    requestAssistantQuestion(`공고 ${jobId} 를 검수해줘`);
                    onAskedAssistant?.();
                  }}
                >
                  AI 비서에게 검수 요청
                </Button>
              }
            />
          ) : (
            <p className="text-sm text-gray-500">불러오는 중입니다.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
