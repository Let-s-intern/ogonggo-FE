'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CARD_SIZES,
  type CardSizeId,
  type ElementId,
  elementLabel,
  JOB_VALUE_LABELS,
  type JobValueKey,
  type Layer,
  type RenderRequest,
  type Selection,
  isElementId,
  isLayerRef,
  layerLabel,
  layerRef,
} from '@/lib/card/types';
import { arrangeBundle } from '@/lib/card/bundle';
import {
  type BundleLayout,
  attachSlide,
  bundleLayoutOf,
  companyNames,
  detachSlide,
  documentContent,
  documentTitle,
  duplicateSlide,
  insertSlide,
  jobName,
  jobValue,
  moveJob,
  moveSlide,
  newSlide,
  removeJob,
  removeSlide,
  resolveLayers,
  slideEditsOf,
  slideLabel,
  slideName,
  slideVariant,
  withBundleLayout,
  withCoverRow,
  withSlideEdit,
  withSlideLayers,
  withBackground,
} from '@/lib/card/document';
import { specPalette, visibleSectionLabels } from '@/lib/card/render/slides';
import { stripMarkup } from '@/lib/card/markup';
import type { AssistantScope, ToolContext } from '@/lib/ai/tools';
import { Button } from '@ogonggo/ui';
import { fileToDataUrl } from '@/lib/client/image';
import { putImage } from '@/lib/client/imageStore';
import { useCardEditor } from '@/lib/client/useCardEditor';
import { useRenderKit } from '@/lib/client/useRenderKit';
import { AssistantPanel } from './AssistantPanel';
import {
  type CanvasHandle,
  EditorCanvas,
  measureSlideBoxes,
  readTextLook,
  useBuiltSlides,
} from './EditorCanvas';
import { EditorToolbar } from './EditorToolbar';
import { BackgroundDrawer } from './drawers/BackgroundDrawer';
import { ElementsDrawer } from './drawers/ElementsDrawer';
import { JobsDrawer } from './drawers/JobsDrawer';
import { type JobValueChip, type TextPreset, TextDrawer } from './drawers/TextDrawer';
import { UploadDrawer } from './drawers/UploadDrawer';
import { TemplateDrawer } from './drawers/TemplateDrawer';
import { LeftRail } from './LeftRail';
import { PropertiesPanel } from './PropertiesPanel';
import { bundleTextField, templateTextField } from './TextPopover';
import { type AddSlideOption, SlideStrip } from './SlideStrip';
import { VariantPicker } from './VariantPicker';

/**
 * 받기 요청 하나의 상한. 배포처가 Vercel 이면 함수 요청 본문이 4.5MB 를 넘을 수 없다. 이미지는 data URL
 * 로 실리므로 넣을 때 막는다.
 */
const MAX_RENDER_REQUEST = 4_000_000;
const NO_LAYERS: Layer[] = [];

/**
 * AI 입력창 위 범위 알약. `선택한 <요소>` 는 고른 것이 있을 때만 그린다. 비서는 범위 밖을 바꾸는 도구를
 * 실행 전에 거절당한다(`outOfScope()`).
 */
function ScopePills({
  scope,
  onChange,
  selectedName,
}: {
  scope: AssistantScope;
  onChange: (scope: AssistantScope) => void;
  selectedName: string | null;
}) {
  const pills: { value: AssistantScope; label: string }[] = [
    ...(selectedName ? [{ value: 'selected' as const, label: `선택한 ${selectedName}` }] : []),
    { value: 'slide', label: '이 장 전체' },
    { value: 'all', label: '모든 장' },
  ];
  const current = scope === 'selected' && !selectedName ? 'slide' : scope;
  return (
    <div
      role="radiogroup"
      aria-label="AI 수정 범위"
      className="flex flex-wrap items-center gap-1.5 text-xs"
    >
      <span className="text-gray-500">대상</span>
      {pills.map((pill) => (
        <button
          key={pill.value}
          type="button"
          role="radio"
          aria-checked={current === pill.value}
          onClick={() => onChange(pill.value)}
          className={`max-w-56 truncate rounded-full px-2.5 py-0.5 ${
            current === pill.value
              ? 'bg-indigo-50 font-bold text-indigo-800'
              : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {pill.label}
        </button>
      ))}
    </div>
  );
}

/** 캔버스 칸 아래 비울 높이. 캔버스 아래 떠 있는 AI 입력창(접었을 때)이 캔버스를 가리지 않게. */
const AI_SPACE = 112;
/** AI 입력창을 닫았을 때도 캔버스 아래에 남기는 여백. */
const CLOSED_AI_SPACE = 32;

/** 왼쪽 레일. 도형 서랍은 2차라 두지 않는다. */
type DrawerKey = 'template' | 'text' | 'elements' | 'background' | 'upload' | 'jobs';

/**
 * 편집 화면 배치(`/edit/<문서 id>`). 상태와 동작은 `useCardEditor` 에 있고, 여기서는 패널을 놓기만 한다.
 *
 * 남은 문서를 고른 템플릿으로 연다. 여기서 새로 만든 문서(`?jobId=` 로 들어온 공고)는 템플릿 고르기
 * (열 시안을 한 장씩 나란히)부터 연다. 편집 화면은 위 막대 아래 네 열이다 — 왼쪽 레일과 서랍, 가운데
 * 캔버스와 장 목록, 오른쪽 디자인 패널. 받기는 위 막대의 `내보내기` 다.
 */
export function CardEditor({ docId }: { docId: string }) {
  const editor = useCardEditor();
  const { loaded, status, notice, specs, openDocument } = editor;
  /** 템플릿 고르기(시안을 나란히)를 보고 있는가. 여기서 새로 만든 문서는 이것부터 연다. */
  const [picking, setPicking] = useState(false);
  const [size, setSize] = useState<CardSizeId>('post');
  /** 보고 있는 장의 id. `null` 이면 첫 장이다. */
  const [slideId, setSlideId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);
  /** 고른 배율. `null` 이면 캔버스 칸에 맞춘다. */
  const [zoom, setZoom] = useState<number | null>(null);
  const [scale, setScale] = useState(0);
  /** AI 로 고칠 범위. 고른 것이 있으면 `선택한 요소`, 없으면 `이 장 전체` 로 시작한다. */
  const [scope, setScope] = useState<AssistantScope>('slide');
  // 캔버스 아래 AI 입력창. 닫으면 그 자리만큼 캔버스를 키우고, 위 막대의 `AI로 수정` 으로 다시 연다.
  const [aiOpen, setAiOpen] = useState(true);
  /** 열린 왼쪽 서랍. `null` 이면 닫혀 있다. */
  const [drawer, setDrawer] = useState<DrawerKey | null>('template');
  const { kit, error: kitError } = useRenderKit();
  const canvasRef = useRef<CanvasHandle>(null);
  /** 문서 템플릿. 장마다 `한 장씩` 으로 덮어쓴 템플릿이 있으면 그 장은 그것으로 그린다. */
  const docVariant = loaded && !picking ? loaded.doc.variant : null;
  const slides = useMemo(
    () =>
      docVariant && specs && loaded
        ? loaded.doc.slides.map((item, index) => specs[slideVariant(item, docVariant)][index]!)
        : null,
    [docVariant, specs, loaded],
  );
  /** 보고 있는 장이 문서의 몇 번째인가(0부터). */
  const slide = Math.max(0, slides?.findIndex((item) => item.id === slideId) ?? 0);
  const currentSlide = slides?.[slide];
  const docSlide = loaded?.doc.slides.find((item) => item.id === currentSlide?.id);
  /** 보고 있는 장의 템플릿. 편집값·자유 요소는 이 템플릿 것을 고친다. */
  const variant = docSlide && docVariant ? slideVariant(docSlide, docVariant) : docVariant;
  /** 보고 있는 장이 그리는 문구. 캔버스에서 템플릿 글자를 고치면 이 장의 공고(표지면 표지)에 들어간다. */
  const content = useMemo(
    () => (loaded && docSlide ? documentContent(loaded.doc, docSlide) : null),
    [loaded, docSlide],
  );
  const built = useBuiltSlides(slides, size, kit);
  const sectionLabels = useMemo(
    () => (currentSlide ? visibleSectionLabels(currentSlide.spec, currentSlide.role) : []),
    [currentSlide],
  );

  // AI 비서의 도구는 요청 하나 동안 여러 번 불리며 그때마다 최신 화면 값을 본다. 렌더를 기다리지 않게
  // ref 로 넘긴다.
  const screenRef = useRef({ docVariant, size, slide, selected, built, scope });
  screenRef.current = { docVariant, size, slide, selected, built, scope };
  const { readLoaded, remember, applyQuietly } = editor;
  const toolContext = useMemo<ToolContext>(
    () => ({
      readLoaded,
      remember: () => remember(),
      apply: applyQuietly,
      variant: () => screenRef.current.docVariant ?? 'wave',
      size: () => screenRef.current.size,
      slide: () => screenRef.current.slide,
      selected: () => screenRef.current.selected,
      scope: () => screenRef.current.scope,
      measure: () => {
        const { built: slides, size: sizeId } = screenRef.current;
        if (!slides) {
          return null;
        }
        const measured = slides.map((slideBuilt) => ({
          boxes: measureSlideBoxes(slideBuilt.id, CARD_SIZES[sizeId].width),
          overflow: slideBuilt.overflow,
        }));
        return measured.every((item) => item.boxes)
          ? measured.map(({ boxes, overflow }) => ({ boxes: boxes ?? [], overflow }))
          : null;
      },
    }),
    [readLoaded, remember, applyQuietly],
  );

  // 주소의 문서를 연다. 남은 문서는 고른 템플릿으로, 새로 만든 문서는 템플릿 고르기부터.
  useEffect(() => {
    void openDocument(docId).then((opened) => {
      if (opened) {
        setPicking(opened.created);
        setSize(opened.doc.size ?? 'post');
      }
    });
  }, [docId, openDocument]);

  // 묶음 공고 장을 배치대로 나눈다(장 하나에 회사 몇 곳). 글자 폭으로 재므로 렌더 키트를 받은 뒤다. 나눈 결과는
  // 실행 취소 기록에 쌓지 않는다 — 바꾸기 전 문서로 되돌리면 그 문서대로 다시 나뉜다.
  const loadedDoc = loaded?.doc;
  useEffect(() => {
    if (kit && loadedDoc) {
      const arranged = arrangeBundle(loadedDoc, kit.measure);
      if (arranged !== loadedDoc) {
        applyQuietly(arranged);
      }
    }
  }, [kit, loadedDoc, applyQuietly]);

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // 요소를 고르면 AI 범위를 그 요소로, 고른 것을 풀면 이 장 전체로 돌린다. `모든 장` 은 사람이 바꿀 때까지 둔다.
  useEffect(() => {
    setScope((current) => {
      if (selected) {
        return current === 'all' ? current : 'selected';
      }
      return current === 'selected' ? 'slide' : current;
    });
  }, [selected]);

  // 템플릿을 바꾸면 고른 요소를 푼다(템플릿마다 요소가 다르다). 보고 있는 장은 그대로다.
  useEffect(() => {
    setSelected(null);
  }, [variant]);

  // 공고 값과 이어진 글자는 이 장의 공고 값으로 채워 캔버스에 넘긴다(받기와 같은 글).
  const layers =
    (variant && loaded && docSlide
      ? resolveLayers(loaded.doc, docSlide, docSlide.layers[variant])
      : undefined) || NO_LAYERS;
  // 덮어쓴 배경이 있으면 그 배경에 맞춘 색이다(새 글자가 배경에 묻히지 않게).
  const palette = currentSlide ? specPalette(currentSlide.spec, currentSlide.role) : null;
  /** 텍스트 서랍의 오공고 글 스타일. 강조 상자·칩은 지금 색으로 채운다. */
  const textStyles: { label: string; preset: TextPreset }[] = palette
    ? [
        {
          label: '강조 제목',
          preset: {
            text: '강조 제목',
            style: {
              fontSize: 96,
              fontWeight: 900,
              lineHeight: 1.25,
              color: palette.boxText,
              background: palette.box,
            },
          },
        },
        {
          label: '칩',
          preset: {
            text: '마감 기한',
            style: {
              fontSize: 36,
              fontWeight: 700,
              width: 400,
              color: palette.chipText,
              background: palette.chip,
              radius: 999,
            },
          },
        },
        {
          label: '· 담당 업무\n· 우대 사항',
          preset: {
            text: '• 담당 업무\n• 우대 사항',
            style: { fontSize: 40, fontWeight: 500, lineHeight: 1.5 },
          },
        },
        {
          label: '마감 11월 9일\n업무 국내영업',
          preset: {
            text: '마감    11월 9일\n업무    국내영업',
            style: { fontSize: 40, fontWeight: 600, lineHeight: 1.6 },
          },
        },
      ]
    : [];
  const jobValues: JobValueChip[] =
    loaded && docSlide && loaded.doc.jobs.length > 0
      ? (Object.entries(JOB_VALUE_LABELS) as [JobValueKey, string][]).map(([key, label]) => ({
          label,
          value: jobValue(loaded.doc, docSlide, key),
          style: { fontSize: 44, fontWeight: 700, lineHeight: 1.4, bind: key },
        }))
      : [];
  /** 업로드 서랍에서 올린 이미지를 이 브라우저에 남기고 문서의 업로드 목록에 더한다. */
  const upload = async (files: File[]) => {
    const ids = await Promise.all(
      files.map(async (file) => {
        const id = `upload-${crypto.randomUUID().slice(0, 8)}`;
        await putImage(id, await fileToDataUrl(file));
        return id;
      }),
    );
    editor.changeDocument((doc) => ({ ...doc, uploads: [...(doc.uploads ?? []), ...ids] }));
  };
  const names = useMemo(
    () => (loaded ? loaded.doc.slides.map((item) => slideName(loaded.doc, item)) : []),
    [loaded],
  );
  /** `장 추가` 메뉴. 지금 장 바로 뒤에 넣고 그 장으로 간다. */
  const addSlide = (role: 'free' | 'profile' | 'job', jobIndex?: number) => {
    const next = newSlide(role, jobIndex);
    editor.changeSlides((doc) => insertSlide(doc, next, slide + 1));
    setSlideId(next.id);
    setSelected(null);
  };
  const addOptions: AddSlideOption[] = loaded
    ? [
        { key: 'free', label: '빈 장', onAdd: () => addSlide('free') },
        // 회사 블록 배치는 공고 장을 회사마다 나눠 두므로 공고 장을 따로 더하지 않는다.
        ...(bundleLayoutOf(loaded.doc).kind === 'labels' ? loaded.doc.jobs : []).map(
          (_, index) => ({
            key: `job-${index}`,
            label: `공고 장 · ${jobName(loaded.doc, index)}`,
            onAdd: () => addSlide('job', index),
          }),
        ),
        { key: 'profile', label: '안내 장', onAdd: () => addSlide('profile') },
      ]
    : [];
  const slideEdits =
    variant && loaded && docSlide ? slideEditsOf(loaded.doc, docSlide)[variant] : undefined;
  const selectedLayer = isLayerRef(selected)
    ? layers.find((layer) => layerRef(layer.id) === selected)
    : undefined;
  /** 고른 글이 이어진 공고 값(자유 글자) 또는 문구 칸(템플릿 글자)의 이름. */
  const valueLabel =
    !loaded?.doc.jobs.length || !variant || !content || !currentSlide
      ? undefined
      : selectedLayer
        ? selectedLayer.kind === 'text' && selectedLayer.bind
          ? JOB_VALUE_LABELS[selectedLayer.bind]
          : undefined
        : isElementId(selected)
          ? (templateTextField(selected, content, variant, currentSlide.role)?.label ??
            (docSlide ? bundleTextField(selected, loaded.doc, docSlide)?.label : undefined))
          : undefined;
  const setLayers = (next: Layer[], group?: string) =>
    variant && docSlide && editor.setLayers(variant, docSlide.id, next, group);
  /**
   * 템플릿 글자 요소를 자유 텍스트로 푼다. 지금 보이는 글자·자리·크기·색으로 글자 요소를 만들고 원래
   * 요소는 숨긴다. 실행 취소 한 번에 둘 다 돌아간다.
   */
  const unfold = (id: ElementId) => {
    const field =
      variant && content && currentSlide
        ? templateTextField(id, content, variant, currentSlide.role)
        : null;
    const look = readTextLook(id, CARD_SIZES[size].width);
    if (!variant || !loaded || !docSlide || !field || !look) {
      return;
    }
    const text = id.endsWith('-list')
      ? field.value
          .split('\n')
          .filter((line) => line.trim())
          .map((line) => `• ${line}`)
          .join('\n')
      : stripMarkup(field.value);
    // 줄이 다시 나뉘지 않게 폭을 조금 넉넉히 잡는다.
    const slack = 24;
    const layer: Layer = {
      id: crypto.randomUUID().slice(0, 8),
      kind: 'text',
      text,
      x: Math.round(look.x - (look.align === 'center' ? slack / 2 : 0)),
      y: Math.round(look.y),
      width: Math.round(look.width + slack),
      fontSize: look.fontSize,
      fontWeight: look.fontWeight,
      color: look.color,
      align: look.align,
      lineHeight: look.lineHeight,
    };
    const current = slideEditsOf(loaded.doc, docSlide)[variant]?.[id] ?? { dx: 0, dy: 0, scale: 1 };
    editor.remember();
    editor.applyQuietly(
      withSlideLayers(
        withSlideEdit(loaded.doc, docSlide.id, variant, id, { ...current, hidden: true }),
        docSlide.id,
        variant,
        [...layers, layer],
      ),
    );
    setSelected(layerRef(layer.id));
  };

  /** 문서나 어느 장이든 배경 서랍에서 배경을 덮어썼는가. */
  const backgroundOverridden = Boolean(
    loaded && (loaded.doc.settings.background || loaded.doc.slides.some((item) => item.background)),
  );
  const clearBackground = () => editor.changeDocument((doc) => withBackground(doc, null));

  const overflow = built
    ? built.flatMap((slideBuilt, index) => (slideBuilt.overflow ? [index] : []))
    : [];

  /** 이 장의 받기 요청이 상한을 넘으면 알릴 말. */
  const checkLayers = (next: Layer[]): string | null => {
    if (!currentSlide) {
      return null;
    }
    const request: RenderRequest = {
      spec: { ...currentSlide.spec, layers: next },
      role: currentSlide.role,
      size,
    };
    return JSON.stringify(request).length > MAX_RENDER_REQUEST
      ? '이 장의 이미지가 많거나 커서 받기 요청이 4MB 를 넘습니다. 이미지를 빼거나 더 작은 이미지를 넣어 주세요.'
      : null;
  };

  /** 위 막대의 `AI로 수정`. 닫아 둔 AI 입력창을 다시 열고 입력 칸에 포커스를 준다. */
  const focusAssistant = () => {
    setAiOpen(true);
    // 다시 그려진 뒤에 포커스를 준다(닫혀 있는 동안은 입력 칸이 숨겨져 있다).
    requestAnimationFrame(() =>
      document.querySelector<HTMLTextAreaElement>('[aria-label="AI 비서에게 요청"]')?.focus(),
    );
  };

  const editing = Boolean(loaded && content && slides && currentSlide && docSlide && variant);
  const toolbar = (
    <EditorToolbar
      title={loaded ? documentTitle(loaded.doc) : null}
      onTitleChange={editor.setTitle}
      bundleCount={loaded?.doc.kind === 'bundle' ? loaded.doc.jobs.length : null}
      editing={
        editing && slides
          ? {
              onUndo: editor.undo,
              onRedo: editor.redo,
              size,
              onSizeChange: setSize,
              zoom,
              onZoomChange: setZoom,
              scale,
              onAi: focusAssistant,
              slides,
              names,
            }
          : null
      }
      actions={
        <>
          {loaded?.job && loaded.doc.kind === 'single' ? (
            <Button size="sm" variant="ghost" onClick={editor.startOver}>
              처음부터 다시
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" onClick={() => void logout()}>
            로그아웃
          </Button>
        </>
      }
    />
  );

  const jobLine =
    loaded?.doc.kind === 'bundle' ? (
      <p className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900">묶음 {loaded.doc.jobs.length}개 공고</span>{' '}
        {documentTitle(loaded.doc)}
      </p>
    ) : loaded?.job ? (
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{loaded.job.companyName}</span>{' '}
          {loaded.job.title}
        </p>
        {loaded.job.sourceUrl ? (
          <a
            href={loaded.job.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-sm text-blue-500 underline"
          >
            원문 보기
          </a>
        ) : null}
      </div>
    ) : null;

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-gray-100">
      {toolbar}

      {status.kind === 'loading' ? (
        <p className="shrink-0 bg-blue-50 px-4 py-2 text-sm text-blue-700">{status.message}</p>
      ) : null}
      {status.kind === 'error' ? (
        <p className="shrink-0 bg-red-50 px-4 py-2 text-sm text-error">{status.message}</p>
      ) : null}
      {notice ? (
        <p className="shrink-0 bg-amber-50 px-4 py-2 text-sm text-amber-800">{notice}</p>
      ) : null}
      {kitError ? (
        <p className="shrink-0 bg-red-50 px-4 py-2 text-sm text-error">
          캔버스를 그릴 글꼴을 받지 못했습니다. 새로고침해 주세요.
        </p>
      ) : null}

      {loaded && content && slides && currentSlide && docSlide && variant ? (
        <div className="flex min-h-0 flex-1">
          <LeftRail
            open={drawer}
            onOpenChange={setDrawer}
            items={[
              {
                key: 'template',
                label: '템플릿',
                drawer: specs ? (
                  <TemplateDrawer
                    kind={loaded.doc.kind}
                    specs={specs}
                    slideIndex={slide}
                    slideName={slideLabel(names[slide] ?? '', slide)}
                    docVariant={loaded.doc.variant}
                    slideOverride={docSlide.variant}
                    size={size}
                    kit={kit}
                    onPick={(picked) => editor.pickTemplate(picked)}
                    onPickSlide={(picked) => editor.pickTemplate(picked, docSlide.id)}
                    {...(backgroundOverridden ? { onClearBackground: clearBackground } : {})}
                    {...(loaded.doc.kind === 'bundle'
                      ? {
                          bundleLayout: bundleLayoutOf(loaded.doc),
                          onBundleLayout: (layout: BundleLayout) =>
                            editor.changeDocument((doc) => withBundleLayout(doc, layout)),
                        }
                      : {})}
                  />
                ) : null,
              },
              {
                key: 'text',
                label: '텍스트',
                drawer: (
                  <TextDrawer
                    styles={textStyles}
                    values={jobValues}
                    onAdd={({ text, style }) => canvasRef.current?.addText(text, style)}
                  />
                ),
              },
              {
                key: 'elements',
                label: '요소',
                drawer: (
                  <ElementsDrawer
                    logos={[
                      { label: '기업 로고', src: loaded.logo },
                      { label: '렛츠커리어', src: kit?.assets.markColor },
                      { label: '오공고', src: kit?.assets.ogonggoLogo },
                      { label: '옛 오공고', src: kit?.assets.ogonggoClassic },
                    ]}
                    brandColor={loaded.doc.settings.brandColor}
                    onAdd={(src) => canvasRef.current?.addImageSource(src)}
                  />
                ),
              },
              {
                key: 'background',
                label: '배경',
                drawer: (
                  <BackgroundDrawer
                    key={docSlide.id}
                    settings={loaded.doc.settings}
                    slideBackground={docSlide.background}
                    overridden={backgroundOverridden}
                    slideName={slideLabel(names[slide] ?? '', slide)}
                    uploads={loaded.doc.uploads ?? []}
                    onUpload={(files) => void upload(files)}
                    onChange={(background, all, group) =>
                      editor.changeDocument(
                        (doc) => withBackground(doc, background, all ? undefined : docSlide.id),
                        group,
                      )
                    }
                    onClear={clearBackground}
                  />
                ),
              },
              {
                key: 'upload',
                label: '업로드',
                drawer: (
                  <UploadDrawer
                    uploads={loaded.doc.uploads ?? []}
                    onUpload={(files) => void upload(files)}
                    onAdd={(src) => canvasRef.current?.addImageSource(src)}
                  />
                ),
              },
              {
                key: 'jobs',
                label: '공고',
                drawer: (
                  <JobsDrawer
                    doc={loaded.doc}
                    onJobContent={editor.setJobContent}
                    onCaption={(caption) =>
                      editor.changeDocument((doc) => ({ ...doc, caption }), 'caption')
                    }
                    onCover={(patch) =>
                      editor.changeDocument(
                        (doc) => (doc.cover ? { ...doc, cover: { ...doc.cover, ...patch } } : doc),
                        'cover',
                      )
                    }
                    onRow={(jobIndex, row) =>
                      editor.changeDocument((doc) => withCoverRow(doc, jobIndex, row), 'row')
                    }
                    onMove={(from, to) => editor.changeDocument((doc) => moveJob(doc, from, to))}
                    onRemove={(jobIndex) => {
                      editor.changeDocument((doc) => removeJob(doc, jobIndex));
                      setSelected(null);
                    }}
                    onAddJobs={editor.addMoreJobs}
                  />
                ),
              },
            ]}
          />
          <section className="flex min-w-0 flex-1 flex-col">
            <div className="relative flex min-h-0 flex-1 flex-col">
              {built ? (
                <EditorCanvas
                  slides={built}
                  size={size}
                  slide={docSlide.id}
                  edits={slideEdits}
                  layers={layers}
                  onLayers={setLayers}
                  checkLayers={checkLayers}
                  onLogo={(image) =>
                    void fileToDataUrl(image).then(editor.setLogo, () => undefined)
                  }
                  onBrand={(image) => void editor.setBrandImage(image)}
                  textColor={palette?.headlineText ?? '#111111'}
                  canvasRef={canvasRef}
                  selected={selected}
                  onSelect={setSelected}
                  onEdit={(id, edit, group) =>
                    editor.setEdits(variant, docSlide.id, id, edit, group)
                  }
                  content={content}
                  variant={variant}
                  onContentChange={(next) => editor.setSlideContent(docSlide.id, next)}
                  bundleText={(id) => {
                    const field = bundleTextField(id, loaded.doc, docSlide);
                    return field
                      ? {
                          ...field,
                          set: (value: string) =>
                            editor.changeDocument((doc) => field.apply(doc, value), 'content'),
                        }
                      : null;
                  }}
                  sectionLabels={sectionLabels}
                  zoom={zoom}
                  onScale={setScale}
                  bottomSpace={aiOpen ? AI_SPACE : CLOSED_AI_SPACE}
                />
              ) : (
                <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
                  그리는 중
                </div>
              )}
              {/* 캔버스 아래 떠 있는 AI 입력창. 장 목록 위, 캔버스 칸 안에 있어 장 목록·내보내기에 가리지 않는다. */}
              {/* 닫아도 지우지 않고 숨긴다 — 대화 기록이 남는다. */}
              <div
                className={`pointer-events-none absolute inset-x-0 bottom-3 z-20 justify-center ${
                  aiOpen ? 'flex' : 'hidden'
                }`}
              >
                <div className="pointer-events-auto flex w-full justify-center">
                  <AssistantPanel
                    context={toolContext}
                    onClose={() => setAiOpen(false)}
                    scope={
                      <ScopePills
                        scope={scope}
                        onChange={setScope}
                        selectedName={
                          selectedLayer
                            ? layerLabel(selectedLayer)
                            : isElementId(selected)
                              ? elementLabel(selected, sectionLabels)
                              : null
                        }
                      />
                    }
                  />
                </div>
              </div>
            </div>
            {built ? (
              <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-2">
                <SlideStrip
                  slides={built}
                  names={names}
                  size={size}
                  current={docSlide.id}
                  onSelect={(next) => {
                    setSlideId(next);
                    setSelected(null);
                  }}
                  onMove={(id, to) => editor.changeSlides((doc) => moveSlide(doc, id, to))}
                  onDuplicate={(id) => editor.changeSlides((doc) => duplicateSlide(doc, id))}
                  onRemove={(id) => {
                    editor.changeSlides((doc) => removeSlide(doc, id));
                    setSelected(null);
                  }}
                  addOptions={addOptions}
                />
                {overflow.length > 0 ? (
                  <p className="pt-1 text-xs font-semibold text-error">
                    주의: {overflow.map((index) => index + 1).join('·')}장은 글이 많아 가장 작은
                    글자로도 넘칩니다. 항목을 줄이거나 글자 크기를 낮춰 주세요.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
          <aside
            aria-label="디자인"
            className="w-[300px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white"
          >
            <PropertiesPanel
              onAlign={(kind) => canvasRef.current?.align(kind)}
              valueLabel={valueLabel}
              settings={loaded.doc.settings}
              onSettingsChange={editor.setSettings}
              selected={isElementId(selected) ? selected : null}
              sectionLabels={sectionLabels}
              edit={isElementId(selected) ? slideEdits?.[selected] : undefined}
              jobTemplate={
                loaded.doc.kind === 'bundle' && docSlide.role === 'job'
                  ? {
                      detached: Boolean(docSlide.detached),
                      onDetach: () => editor.changeSlides((doc) => detachSlide(doc, docSlide.id)),
                      onAttach: () => editor.changeSlides((doc) => attachSlide(doc, docSlide.id)),
                    }
                  : undefined
              }
              onEdit={(edit, group) =>
                isElementId(selected) &&
                editor.setEdits(variant, docSlide.id, selected, edit, group)
              }
              layer={selectedLayer}
              onLayerChange={(layer, group) =>
                setLayers(
                  layers.map((item) => (item.id === layer.id ? layer : item)),
                  group,
                )
              }
              onLayerRemove={(layer) => {
                setLayers(layers.filter((item) => item.id !== layer.id));
                setSelected(null);
              }}
              onLayerOrder={(layer, step) => {
                const index = layers.indexOf(layer);
                const target = Math.max(0, Math.min(layers.length - 1, index + step));
                if (index >= 0 && target !== index) {
                  const next = layers.filter((item) => item !== layer);
                  next.splice(target, 0, layer);
                  setLayers(next);
                }
              }}
              onDeselect={() => setSelected(null)}
              onUnfold={
                isElementId(selected) &&
                variant &&
                templateTextField(selected, content, variant, currentSlide.role)
                  ? () => unfold(selected)
                  : undefined
              }
              brandColor={loaded.brandColor}
              onResetBrandColor={editor.resetBrandColor}
              multiCompany={companyNames(loaded.doc).length > 1}
              logo={loaded.logo}
              onLogoChange={editor.setLogo}
              onBrandImage={(file) => void editor.setBrandImage(file)}
              candidates={editor.candidates}
            />
          </aside>
        </div>
      ) : loaded && specs ? (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6">
          {jobLine}
          <VariantPicker
            specs={specs}
            current={null}
            onPick={(picked) => {
              editor.setVariant(picked);
              setPicking(false);
            }}
          />
        </div>
      ) : null}
    </main>
  );
}
