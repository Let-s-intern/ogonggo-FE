'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AiDraft, DraftResult } from '../ai/draft';
import {
  type CardDocument,
  type RenderSlide,
  documentContent,
  singleDocument,
  slideSpec,
  withContent,
  withSlideEdit,
  withSlideLayers,
} from '../card/document';
import { type CardJob, contentFromDraft, draftFromContent } from '../card/fromJob';
import type {
  BrandImage,
  CardContent,
  CardImage,
  CardSettings,
  ElementEdit,
  ElementId,
  Layer,
  VariantId,
} from '../card/types';
import { VARIANTS } from '../card/variants';
import type { ImageCandidate, ImageCandidates } from '../server/images';
import { fileToBrandImage, toCardImage } from './image';
import { BRAND_IMAGE_ID, getImage, putImage } from './imageStore';
import { loadDocument, loadSingleDocument, restoreLayers, saveDocument } from './storage';
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
 * 편집하는 값은 문서(`CardDocument`) 하나다. 시안 열 개는 그 하나에서 `specs`(시안별 장 목록)로
 * 갈라진다.
 */

export interface LoadedCard {
  /** 첫 공고. 공고가 없는 문서(빈 캔버스)면 `null` 이다. */
  job: CardJob | null;
  /** 원래 색 로고. 사람이 바꿀 수 있다. */
  logo?: string;
  /** 로고에서 뽑은 대표 색. 없으면 흑백 로고이거나 로고가 없다. */
  brandColor: string | null;
  /** 문구·설정·장마다의 편집값. */
  doc: CardDocument;
}

/** 실행 취소가 되돌리는 값. 문서 통째다. 로고·공고는 넣지 않는다. */
export type EditSnapshot = CardDocument;

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
  return toCardImage(candidate.proxyPath, opacity).then((image) => ({
    ...image,
    label: candidate.source,
  }));
}

/** 이 브라우저에 올려 둔 브랜드 로고. 없거나 못 읽으면 `undefined`. */
async function loadBrandImage(): Promise<BrandImage | undefined> {
  try {
    const parsed = JSON.parse((await getImage(BRAND_IMAGE_ID)) || 'null') as BrandImage | null;
    return parsed?.dataUrl ? parsed : undefined;
  } catch {
    return undefined;
  }
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

/** 공고 하나의 카드용 값과 로고(data URL), 로고에서 뽑은 대표 색. */
export async function fetchCardJob(
  jobId: number,
): Promise<{ job: CardJob; logo?: string; brandColor: string | null }> {
  const response = await fetch(`/api/jobs/${jobId}`);
  const body = (await response.json()) as {
    job?: CardJob;
    logoDataUrl?: string | null;
    message?: string;
  };
  if (!response.ok || !body.job) {
    throw new Error(body.message ?? '공고를 불러오지 못했습니다.');
  }
  const logo = body.logoDataUrl ?? undefined;
  const brandColor = logo ? await extractBrandColor(logo).catch(() => null) : null;
  return { job: body.job, logo, brandColor };
}

/** 연 문서. `created` 면 여기서 새 초안으로 만든 문서다(남은 편집본이 없었다). */
export interface OpenedDocument {
  doc: CardDocument;
  created: boolean;
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
  // 고른 시안은 기록에 들지 않는다 — 되돌려도 지금 시안 그대로다.
  const history = useHistory<EditSnapshot>(
    () => loadedRef.current?.doc ?? null,
    (snapshot) =>
      setLoaded((current) =>
        current ? { ...current, doc: { ...snapshot, variant: current.doc.variant } } : current,
      ),
  );
  const { record, clear: clearHistory } = history;
  const remember = useCallback(
    (group?: string) => {
      const current = loadedRef.current;
      if (current) {
        record(current.doc, group);
      }
    },
    [record],
  );
  /** 문서를 바꾼다(기록은 부르는 쪽이 쌓는다). */
  const changeDoc = useCallback(
    (change: (doc: CardDocument) => CardDocument) =>
      setLoaded((current) => (current ? { ...current, doc: change(current.doc) } : current)),
    [],
  );

  /**
   * 기록에 쌓지 않고 바꾼다. AI 비서가 한 요청 안에서 여러 번 바꿀 때 쓴다 — 처음 바꾸기 전에 한 번만
   * `remember()` 로 쌓아 Ctrl+Z 한 번에 요청 전으로 돌아가게. 같은 요청의 다음 도구가 바로 읽도록
   * ref 도 같이 고친다.
   */
  const applyQuietly = useCallback((doc: EditSnapshot) => {
    const current = loadedRef.current;
    if (!current) {
      return;
    }
    const next = { ...current, doc };
    loadedRef.current = next;
    setLoaded(next);
  }, []);
  const readLoaded = useCallback(() => loadedRef.current, []);

  /** 문구를 바꾼다. 이어 치는 글자는 한 단계로 되돌린다. */
  const setContent = useCallback(
    (content: CardContent) => {
      remember('content');
      changeDoc((doc) => withContent(doc, content));
    },
    [remember, changeDoc],
  );
  const setSettings = useCallback(
    (patch: Partial<CardSettings>) => {
      // 색 고르기·슬라이더처럼 같은 값을 잇달아 바꾸면 한 단계다.
      remember(`settings:${Object.keys(patch).sort().join(',')}`);
      changeDoc((doc) => ({ ...doc, settings: { ...doc.settings, ...patch } }));
    },
    [remember, changeDoc],
  );
  /**
   * 브랜드 로고를 올린 이미지로 바꾼다. 이 브라우저에 하나만 남기고 다른 공고에서도 쓴다. 파일이 없으면
   * 올린 로고를 지우고 오공고로 돌린다.
   */
  const setBrandImage = useCallback(
    async (file: Blob | null) => {
      const brandImage = file ? await fileToBrandImage(file) : undefined;
      void putImage(BRAND_IMAGE_ID, brandImage ? JSON.stringify(brandImage) : '');
      setSettings({ brandImage, brandMark: brandImage ? 'custom' : 'ogonggo' });
    },
    [setSettings],
  );
  /**
   * 장 하나(`slideId`)의 요소 편집값을 바꾼다. `null` 이면 템플릿 원래 배치로 돌린다. `group` 이 같은
   * 변경은 실행 취소에서 한 단계다(끄는 동안, 방향키를 누르고 있는 동안).
   */
  const setEdits = useCallback(
    (
      variant: VariantId,
      slideId: string,
      id: ElementId,
      edit: ElementEdit | null,
      group?: string,
    ) => {
      remember(group);
      changeDoc((doc) => withSlideEdit(doc, slideId, variant, id, edit));
    },
    [remember, changeDoc],
  );

  /**
   * 장 하나의 자유 요소 목록을 바꾼다(넣기, 고치기, 지우기, 순서). 배열 순서가 칠하는 순서다. `group` 이
   * 같은 변경은 실행 취소에서 한 단계다.
   */
  const setLayers = useCallback(
    (variant: VariantId, slideId: string, layers: Layer[], group?: string) => {
      remember(group);
      changeDoc((doc) => withSlideLayers(doc, slideId, variant, layers));
    },
    [remember, changeDoc],
  );

  /** 고른 시안을 문서에 남긴다. 실행 취소 기록에는 쌓지 않는다. */
  const setVariant = useCallback(
    (variant: VariantId) => changeDoc((doc) => ({ ...doc, variant })),
    [changeDoc],
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
          current?.job?.id === jobId && !current.doc.settings.photo
            ? {
                ...current,
                doc: { ...current.doc, settings: { ...current.doc.settings, photo: image } },
              }
            : current,
        );
      }
    } catch {
      // 후보가 없어도 시안은 썸네일 없이 그린다.
    }
  }, []);

  /**
   * 공고를 연다. 남은 편집본이 있으면 그것을, 없거나 `fresh` 면 새 AI 초안을 연다. `quiet` 면 남은
   * 편집본을 열었다고 알리지 않는다 — 편집 화면 주소가 문서 id 라 그 문서를 여는 것이 당연하다.
   *
   * `request` 가 있으면 남은 편집본 대신 그 요청을 지시로 새 초안을 쓰고 문서에 남긴다. `uploads` 는
   * 첨부 이미지 id 로, 문서에 더한다.
   */
  const selectJob = useCallback(
    async (
      jobId: number,
      {
        fresh = false,
        quiet = false,
        request = '',
        uploads = [],
      }: { fresh?: boolean; quiet?: boolean; request?: string; uploads?: string[] } = {},
    ): Promise<OpenedDocument | null> => {
      setStatus({ kind: 'loading', message: '공고를 읽는 중' });
      setNotice(null);
      try {
        const { job, logo, brandColor } = await fetchCardJob(jobId);
        const saved = fresh || request.trim() ? null : loadSingleDocument(job);
        const brandImage = await loadBrandImage();
        clearHistory();
        let opened: OpenedDocument;
        if (saved) {
          opened = {
            doc: await restoreLayers({
              ...saved,
              settings: { ...saved.settings, brandImage },
              ...(uploads.length > 0 ? { uploads: [...(saved.uploads ?? []), ...uploads] } : {}),
            }),
            created: false,
          };
          if (!quiet) {
            setNotice('이 브라우저에 남아 있던 편집본을 불러왔어요.');
          }
        } else {
          setStatus({ kind: 'loading', message: 'AI가 초안을 쓰는 중' });
          const result = await requestDraft({ jobId, instruction: request.trim() || undefined });
          opened = {
            doc: {
              ...singleDocument(job, contentFromDraft(job, result.draft), {
                ...defaultSettings(brandColor ?? FALLBACK_COLOR),
                brandImage,
              }),
              request: request.trim(),
              ...(uploads.length > 0 ? { uploads } : {}),
            },
            created: true,
          };
          setNotice(result.source === 'fallback' ? (result.message ?? null) : null);
        }
        setLoaded({ job, logo, brandColor, doc: opened.doc });
        setStatus({ kind: 'idle' });
        void loadCandidates(jobId);
        return opened;
      } catch (error) {
        setStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : '공고를 불러오지 못했습니다.',
        });
        return null;
      }
    },
    [loadCandidates, clearHistory],
  );

  /**
   * 편집 화면 주소의 문서를 연다. 공고 하나 문서(`job-<번호>`)는 남은 편집본이 없으면 새 초안으로
   * 만든다(오공고 웹의 `?jobId=` 버튼). 다른 문서는 이 브라우저에 남은 것만 연다. 로고와 썸네일 후보는
   * 첫 공고 것이다.
   */
  const openDocument = useCallback(
    async (docId: string): Promise<OpenedDocument | null> => {
      const single = /^job-(\d+)$/.exec(docId);
      if (single) {
        return selectJob(Number(single[1]), { quiet: true });
      }
      setNotice(null);
      const saved = loadDocument(docId);
      if (!saved) {
        setStatus({
          kind: 'error',
          message: '이 브라우저에 남아 있는 문서가 아닙니다. 시작 화면에서 새로 만들어 주세요.',
        });
        return null;
      }
      setStatus({ kind: 'loading', message: '문서를 여는 중' });
      try {
        const first = saved.jobs[0];
        const card = first
          ? await fetchCardJob(first.jobId)
          : { job: null, logo: undefined, brandColor: null };
        const brandImage = await loadBrandImage();
        clearHistory();
        const doc = await restoreLayers({ ...saved, settings: { ...saved.settings, brandImage } });
        setLoaded({ ...card, doc });
        setStatus({ kind: 'idle' });
        if (first) {
          void loadCandidates(first.jobId);
        } else {
          // 공고가 없으면 찾을 썸네일 후보도 없다.
          setCandidates({ photo: [] });
        }
        return { doc, created: false };
      } catch (error) {
        setStatus({
          kind: 'error',
          message: error instanceof Error ? error.message : '문서를 열지 못했습니다.',
        });
        return null;
      }
    },
    [selectJob, loadCandidates, clearHistory],
  );

  const regenerate = useCallback(
    async (instruction: string): Promise<boolean> => {
      const job = loaded?.job;
      if (!loaded || !job) {
        return false;
      }
      setRegenerating(true);
      try {
        const result = await requestDraft({
          jobId: job.id,
          instruction: instruction || REWRITE_INSTRUCTION,
          current: draftFromContent(documentContent(loaded.doc)),
        });
        remember();
        changeDoc((doc) =>
          withContent(doc, contentFromDraft(job, result.draft, documentContent(doc))),
        );
        setNotice(result.source === 'fallback' ? (result.message ?? null) : null);
        return true;
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'AI 초안을 받지 못했습니다.');
        return false;
      } finally {
        setRegenerating(false);
      }
    },
    [loaded, remember, changeDoc],
  );

  const startOver = useCallback(() => {
    if (loaded?.job && loaded.doc.kind === 'single') {
      // 남은 편집본은 새 초안을 저장할 때 덮어쓴다. 지우지 않는다 — 지우면 v2 편집본을 다시 옮겨 온다.
      // 시작할 때 적은 요청과 첨부 이미지는 새 초안에도 남긴다.
      void selectJob(loaded.job.id, {
        fresh: true,
        request: loaded.doc.request,
        uploads: loaded.doc.uploads,
      });
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
      saveDocument(loaded.doc);
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
    const { doc } = loaded;
    return Object.fromEntries(
      VARIANTS.map((variant) => [
        variant.id,
        doc.slides.map((slide) => slideSpec(doc, slide, variant.id, logoSet)),
      ]),
    ) as Record<VariantId, RenderSlide[]>;
  }, [loaded, tintReady, tinted]);

  return {
    loaded,
    status,
    candidates,
    notice,
    regenerating,
    specs,
    selectJob,
    openDocument,
    regenerate,
    startOver,
    setContent,
    setSettings,
    setBrandImage,
    setEdits,
    setLayers,
    setVariant,
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
