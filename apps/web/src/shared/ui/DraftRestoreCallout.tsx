import { Button, Callout } from '@ogonggo/ui';
import { formatDraftSavedAt } from '@/shared/lib/companyPostDraft';

export interface DraftRestoreCalloutProps {
  savedAt: string;
  onRestore: () => void;
  onDiscard: () => void;
}

/**
 * 새 공고 폼 위에 뜨는 이어쓰기 안내(`shared/lib/useCompanyPostDraft.ts`). 이 브라우저에 임시저장한
 * 내용이 있을 때만 그린다. 답하기 전까지는 자동 저장이 그 내용을 덮어쓰지 않는다.
 */
export function DraftRestoreCallout({ savedAt, onRestore, onDiscard }: DraftRestoreCalloutProps) {
  return (
    <Callout className="flex flex-wrap items-center justify-between gap-3 bg-blue-50">
      <span>{formatDraftSavedAt(savedAt)}에 임시저장한 내용이 있어요.</span>
      <span className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="bg-white"
          onClick={onDiscard}
        >
          새로 작성하기
        </Button>
        <Button type="button" size="sm" onClick={onRestore}>
          이어서 작성하기
        </Button>
      </span>
    </Callout>
  );
}
