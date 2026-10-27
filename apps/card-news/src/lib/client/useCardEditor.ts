'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AiDraft, DraftResult } from '../ai/draft';
import { type CardJob, contentFromDraft, draftFromContent } from '../card/fromJob';
import type {
  CardContent,
  CardImage,
  CardSettings,
  CardSpec,
  ElementEdit,
  ElementId,
  Layer,
  SlideEdits,
  VariantId,
} from '../card/types';
import { VARIANTS } from '../card/variants';
import type { ImageCandidate, ImageCandidates } from '../server/images';
import { toCardImage } from './image';
import {
  type CardEdits,
  type CardLayers,
  clearCard,
  loadCard,
  restoreLayers,
  saveCard,
} from './storage';
import {
  FALLBACK_COLOR,
  type ProcessedLogo,
  defaultSettings,
  extractBrandColor,
  processLogo,
} from './theme';
import { useHistory } from './useHistory';

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
  /** 템플릿별·장별 요소 편집값. 템플릿을 바꿔도 각자 남는다. */
  edits: CardEdits;
  /** 템플릿별·장별 자유 요소(글자·이미지). */
  layers: CardLayers;
}

/** 실행 취소가 되돌리는 값. 로고·공고는 넣지 않는다. */
export type EditSnapshot = Pick<LoadedCard, 'content' | 'settings' | 'edits' | 'layers'>;

function snapshotOf(card: LoadedCard): EditSnapshot {
  return { content: card.content, settings: card.settings, edits: card.edits, layers: card.layers };
}

export type EditorStatus =
  | { kind: 'idle' }
  | { kind: 'loading'; message: string }
  | { kind: 'error'; message: string };

/** 다시 쓰기에서 지시를 비웠을 때 보내는 말. 빈 지시는 첫 초안 캐시를 돌려받으므로 넣는다. */
const REWRITE_INSTRUCTION = '지금 초안과 다른 표현으로 새로 써 줘.';

/** 썸네일의 처음 진하기. 시안마다 이 값에 자기 배율을 곱한다. */
export const PHOTO_OPACITY = 1;

/** 후보를 카드 이미지로. 다른 출처 이미지는 이 앱의 프록시를 거쳐야 캔버스로 읽힌다. */
export function candidateToImage(candidate: ImageCandidate, opacity: number): Promise<CardImage> {
  return toCardImage(candidate.proxyPath, opacity);
}

export async function requestDraft(body: {
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
  const [candidates, setCandidates] = useState<ImageCandidates | null>(null);

  const update = useCallback(
    (patch: Partial<LoadedCard>) =>
      setLoaded((current) => (current ? { ...current, ...patch } : current)),
    [],
  );

  // 문구·설정·편집값을 바꾸는 함수는 바꾸기 직전 값을 실행 취소 기록에 쌓는다. 기록은 마지막으로 그린
  // 값을 본다.
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;
  const history = useHistory<EditSnapshot>(
    () => {
      const current = loadedRef.current;
      return current ? snapshotOf(current) : null;
    },
    (snapshot) => setLoaded((current) => (current ? { ...current, ...snapshot } : current)),
  );
  const { record, clear: clearHistory } = history;
  const remember = useCallback(
    (group?: string) => {
      const current = loadedRef.current;
      if (current) {
        record(snapshotOf(current), group);
      }
    },
    [record],
  );

  /**
   * 기록에 쌓지 않고 바꾼다. AI 비서가 한 요청 안에서 여러 번 바꿀 때 쓴다 — 처음 바꾸기 전에 한 번만
   * `remember()` 로 쌓아 Ctrl+Z 한 번에 요청 전으로 돌아가게. 같은 요청의 다음 도구가 바로 읽도록
   * ref 도 같이 고친다.
   */
  const applyQuietly = useCallback((patch: Partial<EditSnapshot>) => {
    const current = loadedRef.current;
    if (!current) {
      return;
    }
    const next = { ...current, ...patch };
    loadedRef.current = next;
    setLoaded(next);
  }, []);
  const readLoaded = useCallback(() => loadedRef.current, []);

  /** 문구를 바꾼다. 이어 치는 글자는 한 단계로 되돌린다. */
  const setContent = useCallback(
    (content: CardContent) => {
      remember('content');
      update({ content });
    },
    [remember, update],
  );
  const setSettings = useCallback(
    (patch: Partial<CardSettings>) => {
      // 색 고르기·슬라이더처럼 같은 값을 잇달아 바꾸면 한 단계다.
      remember(`settings:${Object.keys(patch).sort().join(',')}`);
      setLoaded((current) =>
        current ? { ...current, settings: { ...current.settings, ...patch } } : current,
      );
    },
    [remember],
  );
  /**
   * 요소 하나의 편집값을 바꾼다. `null` 이면 템플릿 원래 배치로 돌린다. `group` 이 같은 변경은
   * 실행 취소에서 한 단계다(끄는 동안, 방향키를 누르고 있는 동안).
   */
  const setEdits = useCallback(
    (
      variant: VariantId,
      slide: number,
      id: ElementId,
      edit: ElementEdit | null,
      group?: string,
    ) => {
      remember(group);
      setLoaded((current) => {
        if (!current) {
          return current;
        }
        const slides: SlideEdits[] = [...(current.edits[variant] ?? [])];
        const { [id]: _previous, ...others } = slides[slide] ?? {};
        slides[slide] = edit ? { ...others, [id]: edit } : others;
        return { ...current, edits: { ...current.edits, [variant]: slides } };
      });
    },
    [remember],
  );

  /**
   * 장 하나의 자유 요소 목록을 바꾼다(넣기, 고치기, 지우기, 순서). 배열 순서가 칠하는 순서다. `group` 이
   * 같은 변경은 실행 취소에서 한 단계다.
   */
  const setLayers = useCallback(
    (variant: VariantId, slide: number, layers: Layer[], group?: string) => {
      remember(group);
      setLoaded((current) => {
        if (!current) {
          return current;
        }
        const slides: Layer[][] = [...(current.layers[variant] ?? [])];
        for (let index = 0; index < slide; index += 1) {
          slides[index] ??= [];
        }
        slides[slide] = layers;
        return { ...current, layers: { ...current.layers, [variant]: slides } };
      });
    },
    [remember],
  );

  /** 썸네일 후보를 받아, 아직 썸네일이 없으면 첫 후보(공고 원문 대표 이미지)를 넣는다. */
  const loadCandidates = useCallback(async (jobId: number) => {
    setCandidates(null);
    try {
      const response = await fetch(`/api/images?jobId=${jobId}`);
      if (!response.ok) {
        return;
      }
      const found = (await response.json()) as ImageCandidates;
      setCandidates(found);
      const first = found.photo[0];
      const image = first ? await candidateToImage(first, PHOTO_OPACITY).catch(() => null) : null;
      if (image) {
        setLoaded((current) =>
          current?.job.id === jobId && !current.settings.photo
            ? { ...current, settings: { ...current.settings, photo: image } }
            : current,
        );
      }
    } catch {
      // 후보가 없어도 시안은 썸네일 없이 그린다.
    }
  }, []);

  const selectJob = useCallback(
    async (jobId: number) => {
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
        clearHistory();
        if (saved) {
          setLoaded({
            job,
            logo,
            brandColor,
            content: saved.content,
            settings: saved.settings,
            edits: saved.edits ?? {},
            layers: await restoreLayers(saved.layers),
          });
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
            edits: {},
            layers: {},
          });
          setNotice(result.source === 'fallback' ? (result.message ?? null) : null);
        }
        setStatus({ kind: 'idle' });
        void loadCandidates(jobId);
      } catch (error) {
        setStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : '공고를 불러오지 못했습니다.',
        });
      }
    },
    [loadCandidates, clearHistory],
  );

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
        remember();
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
    [loaded, remember, update],
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
      saveCard(loaded.job.id, loaded.content, loaded.settings, loaded.edits, loaded.layers);
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
    // 썸네일은 그것을 쓰는 시안에만 싣는다. 렌더 요청 본문이 가벼워진다.
    const { photo, ...shared } = loaded.settings;
    return Object.fromEntries(
      VARIANTS.map((variant) => [
        variant.id,
        {
          variant: variant.id,
          content: loaded.content,
          settings: variant.image && photo ? { ...shared, photo } : shared,
          logo: logoSet,
          companyName: loaded.job.companyName,
          edits: loaded.edits[variant.id],
          layers: loaded.layers[variant.id],
        } satisfies CardSpec,
      ]),
    ) as Record<VariantId, CardSpec>;
  }, [loaded, tintReady, tinted]);

  return {
    loaded,
    status,
    candidates,
    notice,
    regenerating,
    specs,
    selectJob,
    regenerate,
    startOver,
    setContent,
    setSettings,
    setEdits,
    setLayers,
    remember,
    applyQuietly,
    readLoaded,
    undo: history.undo,
    redo: history.redo,
    resetBrandColor,
    setLogo: (next: string | undefined) => update({ logo: next }),
  };
}

export type CardEditorState = ReturnType<typeof useCardEditor>;
