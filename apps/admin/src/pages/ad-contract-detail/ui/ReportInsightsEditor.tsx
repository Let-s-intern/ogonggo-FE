import { useState } from 'react';
import { Button, Callout, Input, Textarea } from '@ogonggo/ui';
import type { ContractProductReport } from '@/entities/advertisement-contract/api/useContractReport';
import { useSaveReportInsights } from '@/entities/advertisement-contract/api/useSaveReportInsights';
import { advertisementErrorMessage } from '@/shared/api/advertisementErrors';

const MAX_COUNT = 6;
const MAX_TITLE = 60;
const MAX_BODY = 500;

interface Draft {
  title: string;
  body: string;
}

/**
 * 운영자가 이 상품의 리포트에 인사이트(제목·본문)를 직접 쓴다. `임시 저장` 은 운영자만 보고, `비즈니스에 보내기` 를 눌러야
 * 기업 회원의 리포트에 나온다. 저장하면 이 상품의 인사이트를 통째로 바꾼다.
 */
export function ReportInsightsEditor({
  contractId,
  report,
}: {
  contractId: number;
  report: ContractProductReport;
}) {
  const save = useSaveReportInsights(contractId, report.product.contractProductId);
  const saved = report.insights ?? [];
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    saved.map(({ title, body }) => ({ title, body })),
  );
  const [saving, setSaving] = useState<'draft' | 'send' | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const sent = saved.length > 0 && saved.every((insight) => insight.published);
  const filled = drafts.filter((draft) => draft.title.trim() || draft.body.trim());
  const incomplete = filled.some((draft) => !draft.title.trim() || !draft.body.trim());

  const update = (index: number, patch: Partial<Draft>) =>
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );

  const run = async (published: boolean) => {
    setSaving(published ? 'send' : 'draft');
    setMessage(null);
    try {
      await save(
        filled.map((draft) => ({ title: draft.title.trim(), body: draft.body.trim() })),
        published,
      );
      setDrafts(filled);
      setMessage({
        tone: 'success',
        text: !published
          ? '임시 저장했어요. 비즈니스에는 아직 보이지 않아요.'
          : filled.length === 0
            ? '인사이트를 모두 걷어냈어요.'
            : '비즈니스 리포트에 보냈어요.',
      });
    } catch (failure) {
      setMessage({
        tone: 'error',
        text: advertisementErrorMessage(failure, '인사이트를 저장하지 못했어요.'),
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-3" data-pdf-hide>
      <p className="text-sm text-gray-600">
        {saved.length === 0
          ? '아직 쓴 인사이트가 없어요.'
          : sent
            ? '비즈니스 리포트에 보낸 상태예요. 고친 뒤 다시 보내야 반영돼요.'
            : '임시 저장 상태예요. 비즈니스에는 보이지 않아요.'}
      </p>
      {drafts.map((draft, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label={`인사이트 ${index + 1} 제목`}
              placeholder="제목"
              maxLength={MAX_TITLE}
              value={draft.title}
              onChange={(event) => update(index, { title: event.target.value })}
              className="h-9 text-sm"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDrafts((current) => current.filter((_, i) => i !== index))}
            >
              삭제
            </Button>
          </div>
          <Textarea
            aria-label={`인사이트 ${index + 1} 본문`}
            placeholder="본문"
            rows={3}
            maxLength={MAX_BODY}
            value={draft.body}
            onChange={(event) => update(index, { body: event.target.value })}
          />
          <p className="text-right text-xs text-gray-400">
            {draft.title.length}/{MAX_TITLE} · {draft.body.length}/{MAX_BODY}
          </p>
        </div>
      ))}
      {message ? <Callout tone={message.tone}>{message.text}</Callout> : null}
      {incomplete ? <Callout tone="info">제목과 본문을 모두 써야 저장돼요.</Callout> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={drafts.length >= MAX_COUNT}
          onClick={() => setDrafts((current) => [...current, { title: '', body: '' }])}
        >
          인사이트 추가 ({drafts.length}/{MAX_COUNT})
        </Button>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={saving !== null || incomplete}
            onClick={() => void run(false)}
          >
            {saving === 'draft' ? '저장 중' : '임시 저장'}
          </Button>
          <Button size="sm" disabled={saving !== null || incomplete} onClick={() => void run(true)}>
            {saving === 'send' ? '보내는 중' : '비즈니스에 보내기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
