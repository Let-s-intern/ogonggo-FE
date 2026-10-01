'use client';

import { useEffect, useState } from 'react';
import type { VariantId } from '@/lib/card/types';
import { DEFAULT_VARIANT } from '@/lib/card/variants';
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
 * 왼쪽: 공고 고르기 → 설정 → 문구. 오른쪽: 처음엔 기본 시안(썸네일)의 세 장과 받기. "다른 시안
 * 고르기"를 누르면 열 시안의 1장을 나란히 보여 준다. 한 시안만 그리므로 설정이 바로 보인다.
 */
export function CardEditor() {
  const editor = useCardEditor();
  const { loaded, status, notice, specs } = editor;
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [variant, setVariant] = useState<VariantId | null>(DEFAULT_VARIANT);

  // 다른 공고를 고르면 기본 시안(썸네일)으로 다시 연다. "다른 시안 고르기"로 바꿀 수 있다.
  const jobId = loaded?.job.id;
  useEffect(() => {
    setVariant(DEFAULT_VARIANT);
  }, [jobId]);

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">오공고 카드뉴스</h1>
          <p className="text-sm text-gray-500">
            공고를 고르면 AI가 초안을 쓰고 썸네일 시안으로 카드를 만듭니다. 시안은 바꿀 수 있고,
            고친 뒤 원하는 장만 받습니다.
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
                candidates={editor.candidates}
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
