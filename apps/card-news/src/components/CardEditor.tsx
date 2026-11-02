'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CARD_SIZES,
  type CardSizeId,
  type ElementId,
  type Layer,
  type RenderRequest,
  type Selection,
  isElementId,
  isLayerRef,
  layerRef,
} from '@/lib/card/types';
import {
  attachSlide,
  detachSlide,
  documentContent,
  documentTitle,
  duplicateSlide,
  insertSlide,
  jobName,
  moveSlide,
  newSlide,
  removeSlide,
  slideEditsOf,
  slideLabel,
  slideName,
  slideVariant,
  withSlideEdit,
  withSlideLayers,
} from '@/lib/card/document';
import { visibleSectionLabels } from '@/lib/card/render/slides';
import { stripMarkup } from '@/lib/card/markup';
import { resolvePalette } from '@/lib/card/variants';
import type { ToolContext } from '@/lib/ai/tools';
import { Button } from '@ogonggo/ui';
import { fileToDataUrl } from '@/lib/client/image';
import { useCardEditor } from '@/lib/client/useCardEditor';
import { useRenderKit } from '@/lib/client/useRenderKit';
import { AssistantPanel } from './AssistantPanel';
import { CaptionPanel } from './CaptionPanel';
import { ContentPanel } from './ContentPanel';
import { EditorCanvas, measureSlideBoxes, readTextLook, useBuiltSlides } from './EditorCanvas';
import { EditorToolbar } from './EditorToolbar';
import { TemplateDrawer } from './drawers/TemplateDrawer';
import { LeftRail } from './LeftRail';
import { type PanelTab, PropertiesPanel } from './PropertiesPanel';
import { templateTextField } from './TextPopover';
import { RegenerateModal } from './RegenerateModal';
import { type AddSlideOption, SlideStrip } from './SlideStrip';
import { VariantPicker } from './VariantPicker';

/**
 * 받기 요청 하나의 상한. 배포처가 Vercel 이면 함수 요청 본문이 4.5MB 를 넘을 수 없다. 이미지는 data URL
 * 로 실리므로 넣을 때 막는다.
 */
const MAX_RENDER_REQUEST = 4_000_000;
const NO_LAYERS: Layer[] = [];

/** 왼쪽 레일. 도형·배경 서랍은 2차라 두지 않는다. */
type DrawerKey = 'template' | 'jobs';

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
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  /** 템플릿 고르기(시안을 나란히)를 보고 있는가. 여기서 새로 만든 문서는 이것부터 연다. */
  const [picking, setPicking] = useState(false);
  const [size, setSize] = useState<CardSizeId>('post');
  /** 보고 있는 장의 id. `null` 이면 첫 장이다. */
  const [slideId, setSlideId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Selection | null>(null);
  /** 고른 배율. `null` 이면 캔버스 칸에 맞춘다. */
  const [zoom, setZoom] = useState<number | null>(null);
  const [scale, setScale] = useState(0);
  const [panelTab, setPanelTab] = useState<PanelTab>('properties');
  /** 열린 왼쪽 서랍. `null` 이면 닫혀 있다. */
  const [drawer, setDrawer] = useState<DrawerKey | null>('template');
  const { kit, error: kitError } = useRenderKit();
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
  const content = useMemo(() => (loaded ? documentContent(loaded.doc) : null), [loaded]);
  const built = useBuiltSlides(slides, size, kit);
  const sectionLabels = useMemo(
    () => (currentSlide ? visibleSectionLabels(currentSlide.spec, currentSlide.role) : []),
    [currentSlide],
  );

  // AI 비서의 도구는 요청 하나 동안 여러 번 불리며 그때마다 최신 화면 값을 본다. 렌더를 기다리지 않게
  // ref 로 넘긴다.
  const screenRef = useRef({ docVariant, size, slide, selected, built });
  screenRef.current = { docVariant, size, slide, selected, built };
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

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // 템플릿을 바꾸면 고른 요소를 푼다(템플릿마다 요소가 다르다). 보고 있는 장은 그대로다.
  useEffect(() => {
    setSelected(null);
  }, [variant]);

  const layers = (variant && docSlide?.layers[variant]) || NO_LAYERS;
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
        ...loaded.doc.jobs.map((_, index) => ({
          key: `job-${index}`,
          label: `공고 장 · ${jobName(loaded.doc, index)}`,
          onAdd: () => addSlide('job', index),
        })),
        { key: 'profile', label: '안내 장', onAdd: () => addSlide('profile') },
      ]
    : [];
  const slideEdits =
    variant && loaded && docSlide ? slideEditsOf(loaded.doc, docSlide)[variant] : undefined;
  const selectedLayer = isLayerRef(selected)
    ? layers.find((layer) => layerRef(layer.id) === selected)
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

  /** 위 막대의 `AI로 수정`. 오른쪽 AI 탭을 열고 입력 칸에 포커스를 준다. */
  const focusAssistant = () => {
    setPanelTab('ai');
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
          {loaded?.job && editing ? (
            <Button size="sm" variant="ghost" onClick={() => setRegenerateOpen(true)}>
              AI로 다시 쓰기
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
                  />
                ) : null,
              },
              {
                key: 'jobs',
                label: '공고',
                drawer: (
                  <div className="flex flex-col gap-4 p-4">
                    {jobLine}
                    {loaded.doc.jobs.length > 0 ? (
                      <ContentPanel content={content} onChange={editor.setContent} />
                    ) : null}
                    <CaptionPanel
                      caption={content.caption ?? ''}
                      onChange={(caption) => editor.setContent({ ...content, caption })}
                    />
                  </div>
                ),
              },
            ]}
          />
          <section className="flex min-w-0 flex-1 flex-col">
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
                textColor={resolvePalette(variant, loaded.doc.settings).headlineText}
                selected={selected}
                onSelect={setSelected}
                onEdit={(id, edit, group) => editor.setEdits(variant, docSlide.id, id, edit, group)}
                content={content}
                variant={variant}
                onContentChange={editor.setContent}
                sectionLabels={sectionLabels}
                zoom={zoom}
                onScale={setScale}
              />
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
                그리는 중
              </div>
            )}
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
          <aside className="w-[300px] shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-50 p-3">
            <PropertiesPanel
              tab={panelTab}
              onTabChange={setPanelTab}
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
                isElementId(selected) && editor.setEdits(variant, docSlide.id, selected, edit, group)
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
              logo={loaded.logo}
              onLogoChange={editor.setLogo}
              onBrandImage={(file) => void editor.setBrandImage(file)}
              candidates={editor.candidates}
              assistant={<AssistantPanel context={toolContext} />}
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
