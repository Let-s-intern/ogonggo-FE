'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AiDraft, DraftResult } from '../ai/draft';
import {
  type CardDocument,
  type RenderSlide,
  companyNames,
  singleDocument,
  slideSpec,
  withContent,
  withSlideEdit,
  addJobs,
  withSlideContent,
  withSlideLayers,
  withSlideTemplate,
  withTemplate,
} from '../card/document';
import { type CardJob, contentFromDraft } from '../card/fromJob';
import type {
  BrandImage,
  CardContent,
  CardImage,
  CardLogo,
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
import {
  loadDocument,
  loadSingleDocument,
  restoreLayers,
  saveDocument,
  takeNotice,
} from './storage';
import {
  FALLBACK_COLOR,
  OGONGGO_COLOR,
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

/** 실행 취소가 되돌리는 값. 문서 통째다(템플릿 포함). 로고·공고는 넣지 않는다. */
export type EditSnapshot = CardDocument;

export type EditorStatus =
  | { kind: 'idle' }
  | { kind: 'loading'; message: string }
  | { kind: 'error'; message: string };

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
  const [candidates, setCandidates] = useState<ImageCandidates | null>(null);
  /** 문서마다 열 때 한 번 보일 알림(`takeNotice()`). */
  const notices = useRef(new Map<string, string | null>());

  const update = useCallback(
    (patch: Partial<LoadedCard>) =>
      setLoaded((current) => (current ? { ...current, ...patch } : current)),
    [],
  );

  // 문구·설정·편집값을 바꾸는 함수는 바꾸기 직전 값을 실행 취소 기록에 쌓는다. 기록은 마지막으로 그린
  // 값을 본다.
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;
  // 템플릿(문서 템플릿과 장마다 덮어쓴 템플릿)도 문서에 들어 있어 같이 되돌린다.
  const history = useHistory<EditSnapshot>(
    () => loadedRef.current?.doc ?? null,
    (snapshot) => setLoaded((current) => (current ? { ...current, doc: snapshot } : current)),
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

  /**
   * 장 하나가 그리는 문구를 바꾼다(캔버스에서 템플릿 글자 고치기). 묶음 표지는 표지에, 공고 장은 그 장의
   * 공고에 들어간다(`withSlideContent()`). 이어 치는 글자는 한 단계로 되돌린다.
   */
  const setSlideContent = useCallback(
    (slideId: string, content: CardContent) => {
      remember('content');
      changeDoc((doc) =>
        withSlideContent(
          doc,
          doc.slides.find((slide) => slide.id === slideId),
          content,
        ),
      );
    },
    [remember, changeDoc],
  );
  /** 묶은 공고 하나의 문구를 바꾼다(공고 서랍). 인스타 본문은 문서 것이다. */
  const setJobContent = useCallback(
    (jobIndex: number, content: CardContent) => {
      remember('content');
      changeDoc((doc) => withContent(doc, content, jobIndex));
    },
    [remember, changeDoc],
  );
  /** 문서를 바꾸고 실행 취소 기록에 쌓는다. `group` 이 같으면 이어 친 글자처럼 한 단계다. */
  const changeDocument = useCallback(
    (change: (doc: CardDocument) => CardDocument, group?: string) => {
      remember(group);
      changeDoc(change);
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

  /** 장 목록을 바꾼다(장 떼기·붙이기, 넣기, 지우기, 순서). 실행 취소 한 단계다. */
  const changeSlides = useCallback(
    (change: (doc: CardDocument) => CardDocument) => {
      remember();
      changeDoc(change);
    },
    [remember, changeDoc],
  );

  /** 문서 제목을 바꾼다. 빈 글이면 회사 이름 제목으로 돌린다. */
  const setTitle = useCallback(
    (title: string) => {
      remember();
      changeDoc(({ title: _previous, ...doc }) => (title ? { ...doc, title } : doc));
    },
    [remember, changeDoc],
  );

  /** 템플릿 고르기(새 문서를 처음 열 때)에서 고른 시안을 문서에 남긴다. 실행 취소 기록에는 쌓지 않는다. */
  const setVariant = useCallback(
    (variant: VariantId) => changeDoc((doc) => withTemplate(doc, variant)),
    [changeDoc],
  );
  /**
   * 템플릿 서랍에서 템플릿을 바꾼다. `slideId` 가 없으면 문서 템플릿(모든 장), 있으면 그 장에만 덮어쓴다
   * (`null` 이면 덮어쓴 것을 지운다). 실행 취소 한 단계다.
   */
  const pickTemplate = useCallback(
    (variant: VariantId | null, slideId?: string) => {
      remember();
      changeDoc((doc) =>
        slideId
          ? withSlideTemplate(doc, slideId, variant)
          : variant
            ? withTemplate(doc, variant)
            : doc,
      );
    },
    [remember, changeDoc],
  );

  /**
   * 공고를 더 묶는다(공고 서랍의 `공고 더 묶기`). 공고마다 AI 초안을 쓴다 — 시작할 때 적은 요청사항을
   * 같이 넘긴다. 표지 표 줄은 초안의 첫 직무와 빈 `모집 분야` 로 시작한다(공고 상세에 직무 분류가 없다).
   * 실패하면 오류 글을 돌려준다.
   */
  const addMoreJobs = useCallback(
    async (jobIds: number[]): Promise<string | null> => {
      const request = loadedRef.current?.doc.request.trim() || undefined;
      try {
        const added = await Promise.all(
          jobIds.map(async (jobId) => {
            const [{ job }, result] = await Promise.all([
              fetchCardJob(jobId),
              requestDraft({ jobId, instruction: request }),
            ]);
            const content = contentFromDraft(job, result.draft);
            return {
              jobId,
              companyName: job.companyName,
              content,
              row: [content.roleTitle, ''] as [string, string],
            };
          }),
        );
        remember();
        changeDoc((doc) => addJobs(doc, added));
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : '공고를 더 묶지 못했습니다.';
      }
    },
    [remember, changeDoc],
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
        // 개발 모드는 여는 effect 를 두 번 부른다. 꺼낸 알림을 ref 에 두어 두 번째에도 보이게.
        if (!notices.current.has(docId)) {
          notices.current.set(docId, takeNotice(docId));
        }
        setNotice(notices.current.get(docId) ?? null);
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

  // 여러 회사 묶음은 첫 회사 로고 색이 아니라 오공고 색으로 되돌린다.
  const resetBrandColor = useCallback(() => {
    if (loaded) {
      setSettings({
        brandColor:
          companyNames(loaded.doc).length > 1
            ? OGONGGO_COLOR
            : (loaded.brandColor ?? FALLBACK_COLOR),
      });
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

  // 여러 회사 묶음의 회사 로고. 회사마다 첫 공고의 로고를 받아 배경을 걷고 옅은 테두리까지 잘라 둔다(첫 회사도
  // 회사 블록에서는 이것을 쓴다). 문서에는 남기지 않는다(저장소 한도). 받기 전과 로고가 없는 회사는 회사명을
  // 글자로 그린다.
  const [companyLogos, setCompanyLogos] = useState<Partial<Record<string, CardLogo>>>({});
  const requestedLogos = useRef(new Set<string>());
  const otherCompanies = useMemo(() => {
    const jobs = loaded?.doc.jobs ?? [];
    const seen = new Map<string, number>();
    for (const job of jobs) {
      if (!seen.has(job.companyName)) {
        seen.set(job.companyName, job.jobId);
      }
    }
    // 한 회사 문서는 받지 않는다(회사 블록이 아니면 편집 화면의 로고를 쓴다).
    return JSON.stringify(seen.size > 1 ? [...seen] : []);
  }, [loaded?.doc.jobs]);
  useEffect(() => {
    for (const [name, jobId] of JSON.parse(otherCompanies) as [string, number][]) {
      if (requestedLogos.current.has(name)) {
        continue;
      }
      requestedLogos.current.add(name);
      fetchCardJob(jobId)
        .then(({ logo: source }) => (source ? processLogo(source, undefined, 'strict') : null))
        .then((processed) => {
          if (processed) {
            setCompanyLogos((current) => ({
              ...current,
              [name]: { original: processed.dataUrl, aspect: processed.aspect },
            }));
          }
        })
        .catch(() => undefined);
    }
  }, [otherCompanies]);

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
        doc.slides.map((slide) => slideSpec(doc, slide, variant.id, logoSet, companyLogos)),
      ]),
    ) as Record<VariantId, RenderSlide[]>;
  }, [loaded, tintReady, tinted, companyLogos]);

  return {
    loaded,
    status,
    candidates,
    notice,
    specs,
    selectJob,
    openDocument,
    startOver,
    setSlideContent,
    setJobContent,
    changeDocument,
    addMoreJobs,
    setSettings,
    setBrandImage,
    setEdits,
    setLayers,
    changeSlides,
    setTitle,
    setVariant,
    pickTemplate,
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
