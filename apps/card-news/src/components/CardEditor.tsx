'use client';

import { useEffect, useState } from 'react';
import type { VariantId } from '@/lib/card/types';
import { Button } from '@ogonggo/ui';
import { useCardEditor } from '@/lib/client/useCardEditor';
import { ContentPanel } from './ContentPanel';
import { JobPicker } from './JobPicker';
import { RegenerateModal } from './RegenerateModal';
import { SettingsPanel } from './SettingsPanel';
import { VariantPicker } from './VariantPicker';
import { VariantPreview } from './VariantPreview';

/**
 * 편집 화면 배치. 상태와 동작은 `useCardEditor` 에 있고, 여기서는 패널을 놓기만 한다.
 * 왼쪽: 공고 고르기 → 설정 → 문구. 오른쪽: 처음엔 다섯 시안의 1장(시안 고르기), 하나를 고르면 그
 * 시안의 세 장과 받기. 고른 뒤에는 그 세 장만 다시 그려 설정이 바로 보인다.
 */
export function CardEditor() {
  const editor = useCardEditor();
  const { loaded, status, notice, specs } = editor;
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [variant, setVariant] = useState<VariantId | null>(null);

  // 다른 공고를 고르면 시안부터 다시 고른다.
  const jobId = loaded?.job.id;
  useEffect(() => {
    setVariant(null);
  }, [jobId]);

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">오공고 카드뉴스</h1>
          <p className="text-sm text-gray-500">
            공고를 고르면 AI가 초안을 쓰고 시안 다섯 개를 보여 줍니다. 하나를 골라 고친 뒤 원하는
            장만 받습니다.
          </p>
        </div>
        {loaded ? (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={editor.startOver}>
              처음부터 다시
            </Button>
            <Button size="sm" onClick={() => setRegenerateOpen(true)}>
              AI로 다시 쓰기
            </Button>
          </div>
        ) : null}
      </header>

      {status.kind === 'loading' ? (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{status.message}</p>
      ) : null}
      {status.kind === 'error' ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error">{status.message}</p>
      ) : null}
      {notice ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <JobPicker
            selectedId={loaded?.job.id}
            onSelect={(jobId) => void editor.selectJob(jobId)}
          />
          {loaded ? (
            <>
              <SettingsPanel
                settings={loaded.settings}
                onChange={editor.setSettings}
                brandColor={loaded.brandColor}
                onResetBrandColor={editor.resetBrandColor}
                logo={loaded.logo}
                onLogoChange={editor.setLogo}
              />
              <ContentPanel content={loaded.content} onChange={editor.setContent} />
            </>
          ) : null}
        </div>
        <div className="flex flex-col gap-4">
          {loaded && specs ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{loaded.job.companyName}</span>{' '}
                  {loaded.job.title}
                </p>
                {loaded.job.sourceUrl ? (
                  <a
                    href={loaded.job.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-500 underline"
                  >
                    원문 보기
                  </a>
                ) : null}
              </div>
              {variant ? (
                <VariantPreview spec={specs[variant]} onRepick={() => setVariant(null)} />
              ) : (
                <VariantPicker specs={specs} current={variant} onPick={setVariant} />
              )}
            </>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">
              왼쪽에서 공고를 고르면 시안이 여기에 그려집니다.
            </div>
          )}
        </div>
      </div>

      <RegenerateModal
        open={regenerateOpen}
        busy={editor.regenerating}
        onClose={() => setRegenerateOpen(false)}
        onSubmit={(instruction) =>
          void editor.regenerate(instruction).then((ok) => ok && setRegenerateOpen(false))
        }
      />
    </main>
  );
}
