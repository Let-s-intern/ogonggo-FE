import type { ReactNode } from 'react';
import { Button, Card, CardTitle, Checkbox } from '@ogonggo/ui';
import type { NewJob } from '@/entities/new-job/api/useNewJobQueue';
import { ContentSourceBadge, VisibilityBadge } from '@/shared/config/labels';
import { formatDateTime } from '@/shared/lib/format';

export type JobReviewSummary = Pick<
  NewJob,
  'id' | 'source' | 'visibility' | 'companyName' | 'title' | 'registeredAt' | 'inspectedAt'
>;

export interface JobReviewHeaderProps {
  job: JobReviewSummary;
  /** 검수 완료·노출 요청이 오가는 중. */
  busy: boolean;
  /** 상세를 받아 `내용 수정` 을 열 수 있는지. */
  canEdit: boolean;
  onCheck: (checked: boolean) => void;
  onEdit: () => void;
  onToggleHidden: () => void;
  /** 버튼 줄 앞에 붙는 것(목록 창의 `상세 페이지로`). */
  extra?: ReactNode;
  /** 버튼 `title` 에 단축키를 적는다. 단축키가 있는 오늘 올라온 공고 화면만 켠다. */
  keyHints?: boolean;
}

/**
 * 검수 편집기의 머리 카드. 등록 경로·노출·회사·공고 번호, 제목, 등록·검수 시각과 검수 완료 체크, `내용 수정`,
 * `비노출`·`다시 노출` 이다. 누를 때 무엇을 하는지는 부르는 쪽이 정한다 — 오늘 올라온 공고는 다음 건으로 넘기고,
 * 목록 창은 그 건에 머문다.
 */
export function JobReviewHeader({
  job,
  busy,
  canEdit,
  onCheck,
  onEdit,
  onToggleHidden,
  extra,
  keyHints = false,
}: JobReviewHeaderProps) {
  const hint = (label: string, key: string) => (keyHints ? `${label} (${key})` : undefined);
  const hideLabel = job.visibility === 'HIDDEN' ? '다시 노출' : '비노출';
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <ContentSourceBadge value={job.source} />
            <VisibilityBadge value={job.visibility} />
            <span className="text-sm text-gray-500">{job.companyName}</span>
            <span className="text-sm text-gray-400">공고 {job.id}</span>
          </div>
          <CardTitle className="break-words">{job.title}</CardTitle>
          <p className="pt-1 text-sm text-gray-500">
            등록 {formatDateTime(job.registeredAt)}
            {job.inspectedAt ? ` · 검수 완료 ${formatDateTime(job.inspectedAt)}` : ''}
          </p>
        </div>

        {/* 키보드가 주 조작인 화면도 있어 버튼을 둔다. 키 이름은 `title` 로 남긴다. */}
        <div className="flex shrink-0 items-center gap-2">
          {extra}
          {/*
            누르는 즉시 저장하는 체크박스라 AI 비서가 칸 채우기로 누르지 않게 막는다(`data-ai-human-only`,
            `features/ai-assistant/model/screen.ts`). 확정은 사람이 한다.
          */}
          <span data-ai-human-only title={hint('검수 완료 체크', 'Space 는 체크하고 다음 건')}>
            <Checkbox
              checked={Boolean(job.inspectedAt)}
              onChange={onCheck}
              disabled={busy}
              label="검수 완료"
              labelClassName="font-medium"
            />
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            disabled={!canEdit}
            title={hint('내용 수정', 'E')}
          >
            내용 수정
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onToggleHidden}
            disabled={busy}
            title={hint(hideLabel, 'H')}
          >
            {hideLabel}
          </Button>
        </div>
      </div>
    </Card>
  );
}
