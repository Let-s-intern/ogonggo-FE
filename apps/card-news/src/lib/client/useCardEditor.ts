'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AiDraft, DraftResult } from '../ai/draft';
import { type CardJob, contentFromDraft, draftFromContent } from '../card/fromJob';
import type { CardContent, CardSettings, CardSpec, VariantId } from '../card/types';
import { VARIANTS } from '../card/variants';
import { clearCard, loadCard, saveCard } from './storage';
import {
  FALLBACK_COLOR,
  type ProcessedLogo,
  defaultSettings,
  extractBrandColor,
  processLogo,
} from './theme';

/**
 * 편집 화면의 상태와 동작. 화면 컴포넌트는 이 훅이 주는 값만 그리고, 바꿀 때는 이 훅의 함수를
 * 부른다 — 공고 읽기, AI 초안, 저장, 로고 칠하기, 배경 이미지 고르기가 여기 모여 있다.
 *
 * 문구와 설정은 하나다. 시안 다섯 개는 그 하나에서 `specs` 로 갈라진다.
 */

export interface LoadedCard {
  job: CardJob;
  /** 원래 색 로고. 사람이 바꿀 수 있다. */
  logo?: string;
  /** 로고에서 뽑은 대표 색. 없으면 흑백 로고이거나 로고가 없다. */
  brandColor: string | null;
  content: CardContent;
  settings: CardSettings;
}

export type EditorStatus =
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

export function useCardEditor() {
  const [loaded, setLoaded] = useState<LoadedCard | null>(null);
  const [status, setStatus] = useState<EditorStatus>({ kind: 'idle' });
  const [notice, setNotice] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const update = useCallback(
    (patch: Partial<LoadedCard>) =>
      setLoaded((current) => (current ? { ...current, ...patch } : current)),
    [],
  );
  const setContent = useCallback((content: CardContent) => update({ content }), [update]);
  const setSettings = useCallback(
    (patch: Partial<CardSettings>) =>
      setLoaded((current) =>
        current ? { ...current, settings: { ...current.settings, ...patch } } : current,
      ),
    [],
  );

  const selectJob = useCallback(async (jobId: number) => {
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
      const job = body.job;
      const logo = body.logoDataUrl ?? undefined;
      const brandColor = logo ? await extractBrandColor(logo).catch(() => null) : null;

      const saved = loadCard(jobId);
      if (saved) {
        setLoaded({ job, logo, brandColor, content: saved.content, settings: saved.settings });
        setNotice('이 브라우저에 남아 있던 편집본을 불러왔어요.');
      } else {
        setStatus({ kind: 'loading', message: 'AI가 초안을 쓰는 중' });
        const result = await requestDraft({ jobId });
        setLoaded({
          job,
          logo,
          brandColor,
          content: contentFromDraft(job, result.draft),
          settings: defaultSettings(brandColor ?? FALLBACK_COLOR),
        });
        setNotice(result.source === 'fallback' ? (result.message ?? null) : null);
      }
      setStatus({ kind: 'idle' });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : '공고를 불러오지 못했습니다.',
      });
    }
  }, []);

  const regenerate = useCallback(
    async (instruction: string): Promise<boolean> => {
      if (!loaded) {
        return false;
      }
      setRegenerating(true);
      try {
        const result = await requestDraft({
          jobId: loaded.job.id,
          instruction: instruction || REWRITE_INSTRUCTION,
          current: draftFromContent(loaded.content),
        });
        update({ content: contentFromDraft(loaded.job, result.draft, loaded.content) });
        setNotice(result.source === 'fallback' ? (result.message ?? null) : null);
        return true;
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'AI 초안을 받지 못했습니다.');
        return false;
      } finally {
        setRegenerating(false);
      }
    },
    [loaded, update],
  );

  const startOver = useCallback(() => {
    if (loaded) {
      clearCard(loaded.job.id);
      void selectJob(loaded.job.id);
    }
  }, [loaded, selectJob]);

  const resetBrandColor = useCallback(() => {
    if (loaded) {
      setSettings({ brandColor: loaded.brandColor ?? FALLBACK_COLOR });
    }
  }, [loaded, setSettings]);

  // 고칠 때마다 이 브라우저에 남긴다(이미지는 빼고).
  useEffect(() => {
    if (loaded) {
      saveCard(loaded.job.id, loaded.content, loaded.settings);
    }
  }, [loaded]);

  // 로고 세 판(배경을 걷은 원래 색·흰색·검정)은 로고가 바뀔 때만 다시 만든다. 어느 시안이 어느
  // 판을 쓸지는 렌더가 고른다.
  const logo = loaded?.logo;
  const [tinted, setTinted] = useState<{
    source: string;
    original: ProcessedLogo;
    white: ProcessedLogo;
    black: ProcessedLogo;
  } | null>(null);
  useEffect(() => {
    if (!logo) {
      return;
    }
    let cancelled = false;
    Promise.all([processLogo(logo), processLogo(logo, '#FFFFFF'), processLogo(logo, '#111111')])
      .then(([original, white, black]) => {
        if (!cancelled) {
          setTinted({ source: logo, original, white, black });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [logo]);
  const tintReady = !logo || tinted?.source === logo;

  const specs = useMemo(() => {
    if (!loaded || !tintReady) {
      return null;
    }
    const logoSet =
      loaded.logo && tinted?.source === loaded.logo
        ? {
            original: tinted.original.dataUrl,
            white: tinted.white.dataUrl,
            black: tinted.black.dataUrl,
            aspect: tinted.original.aspect,
          }
        : undefined;
    return Object.fromEntries(
      VARIANTS.map((variant) => [
        variant.id,
        {
          variant: variant.id,
          content: loaded.content,
          settings: loaded.settings,
          logo: logoSet,
          companyName: loaded.job.companyName,
        } satisfies CardSpec,
      ]),
    ) as Record<VariantId, CardSpec>;
  }, [loaded, tintReady, tinted]);

  return {
    loaded,
    status,
    notice,
    regenerating,
    specs,
    selectJob,
    regenerate,
    startOver,
    setContent,
    setSettings,
    resetBrandColor,
    setLogo: (next: string | undefined) => update({ logo: next }),
  };
}

export type CardEditorState = ReturnType<typeof useCardEditor>;
