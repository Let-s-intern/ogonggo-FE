'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@ogonggo/ui';
import type { AiDraft, DraftResult } from '@/lib/ai/draft';
import { type CardJob, contentFromDraft, draftFromContent } from '@/lib/card/fromJob';
import type { CardContent, CardSpec, CardTheme } from '@/lib/card/types';
import { clearCard, loadCard, saveCard } from '@/lib/client/storage';
import { FALLBACK_COLOR, extractBrandColor, themeFromColor } from '@/lib/client/theme';
import { ContentPanel } from './ContentPanel';
import { JobPicker } from './JobPicker';
import { PreviewPanel } from './PreviewPanel';
import { RegenerateModal } from './RegenerateModal';
import { ThemePanel } from './ThemePanel';

interface Loaded {
  job: CardJob;
  logoDataUrl?: string;
  brandColor: string | null;
  content: CardContent;
  theme: CardTheme;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading'; message: string }
  | { kind: 'error'; message: string };

/** 다시 쓰기에서 지시를 비웠을 때 보내는 말. 빈 지시는 첫 초안 캐시를 돌려받으므로 넣는다. */
const REWRITE_INSTRUCTION = '지금 초안과 다른 표현으로 새로 써 줘.';

async function requestDraft(body: {
  jobId: number;
  instruction?: string;
  current?: AiDraft;
}): Promise<DraftResult> {
  const response = await fetch('/api/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = (await response.json()) as DraftResult & { message?: string };
  if (!response.ok) {
    throw new Error(result.message ?? 'AI 초안을 받지 못했습니다.');
  }
  return result;
}

export function CardEditor() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [notice, setNotice] = useState<string | null>(null);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const selectJob = async (jobId: number) => {
    setStatus({ kind: 'loading', message: '공고를 읽는 중' });
    setNotice(null);
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const body = (await response.json()) as {
        job?: CardJob;
        logoDataUrl?: string | null;
        message?: string;
      };
      if (!response.ok || !body.job) {
        throw new Error(body.message ?? '공고를 불러오지 못했습니다.');
      }
      const logoDataUrl = body.logoDataUrl ?? undefined;
      const brandColor = logoDataUrl
        ? await extractBrandColor(logoDataUrl).catch(() => null)
        : null;

      const saved = loadCard(jobId);
      if (saved) {
        setLoaded({
          job: body.job,
          logoDataUrl,
          brandColor,
          content: saved.content,
          theme: saved.theme,
        });
        setNotice('이 브라우저에 남아 있던 편집본을 불러왔어요.');
        setStatus({ kind: 'idle' });
        return;
      }

      setStatus({ kind: 'loading', message: 'AI가 초안을 쓰는 중' });
      const result = await requestDraft({ jobId });
      setLoaded({
        job: body.job,
        logoDataUrl,
        brandColor,
        content: contentFromDraft(body.job, result.draft),
        theme: themeFromColor(brandColor ?? FALLBACK_COLOR),
      });
      setNotice(result.source === 'fallback' ? (result.message ?? null) : null);
      setStatus({ kind: 'idle' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : '공고를 불러오지 못했습니다.',
      });
    }
  };

  const regenerate = async (instruction: string) => {
    if (!loaded) {
      return;
    }
    setRegenerating(true);
    try {
      const result = await requestDraft({
        jobId: loaded.job.id,
        instruction: instruction || REWRITE_INSTRUCTION,
        current: draftFromContent(loaded.content),
      });
      setLoaded({ ...loaded, content: contentFromDraft(loaded.job, result.draft, loaded.content) });
      setNotice(result.source === 'fallback' ? (result.message ?? null) : null);
      setRegenerateOpen(false);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'AI 초안을 받지 못했습니다.');
    } finally {
      setRegenerating(false);
    }
  };

  const startOver = () => {
    if (!loaded) {
      return;
    }
    clearCard(loaded.job.id);
    void selectJob(loaded.job.id);
  };

  // 고칠 때마다 이 브라우저에 남긴다.
  useEffect(() => {
    if (loaded) {
      saveCard(loaded.job.id, loaded.content, loaded.theme);
    }
  }, [loaded]);

  const spec: CardSpec | null = useMemo(
    () =>
      loaded
        ? {
            content: loaded.content,
            theme: loaded.theme,
            logoDataUrl: loaded.logoDataUrl,
            companyName: loaded.job.companyName,
          }
        : null,
    [loaded],
  );

  return (
    <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">오공고 카드뉴스</h1>
          <p className="text-sm text-gray-500">
            공고를 고르면 AI가 초안을 쓰고, 고친 뒤 크기별 PNG로 받습니다.
          </p>
        </div>
        {loaded ? (
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={startOver}>
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <JobPicker selectedId={loaded?.job.id} onSelect={(jobId) => void selectJob(jobId)} />
          {loaded ? (
            <>
              <ThemePanel
                theme={loaded.theme}
                onChange={(theme) => setLoaded({ ...loaded, theme })}
                brandColor={loaded.brandColor}
                onResetToBrand={() =>
                  setLoaded({
                    ...loaded,
                    theme: themeFromColor(loaded.brandColor ?? FALLBACK_COLOR),
                  })
                }
                logoDataUrl={loaded.logoDataUrl}
                onLogoChange={(logoDataUrl) => setLoaded({ ...loaded, logoDataUrl })}
              />
              <ContentPanel
                content={loaded.content}
                onChange={(content) => setLoaded({ ...loaded, content })}
              />
            </>
          ) : null}
        </div>
        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          {spec ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{loaded?.job.companyName}</span>{' '}
                  {loaded?.job.title}
                </p>
                {loaded?.job.sourceUrl ? (
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
              <PreviewPanel spec={spec} />
            </>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">
              왼쪽에서 공고를 고르면 카드가 여기에 그려집니다.
            </div>
          )}
        </div>
      </div>

      <RegenerateModal
        open={regenerateOpen}
        busy={regenerating}
        onClose={() => setRegenerateOpen(false)}
        onSubmit={(instruction) => void regenerate(instruction)}
      />
    </main>
  );
}
