'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CARD_SIZE_IDS,
  CARD_SIZES,
  type CardSizeId,
  type CardSpec,
  type ElementId,
  type Layer,
  type RenderRequest,
  SLIDE_COUNT,
  SLIDE_LABELS,
  type Selection,
  type VariantId,
  isElementId,
  isLayerRef,
  layerRef,
} from '@/lib/card/types';
import { visibleSectionLabels } from '@/lib/card/render/slides';
import { resolvePalette, variantOf } from '@/lib/card/variants';
import type { ToolContext } from '@/lib/ai/tools';
import { Button } from '@ogonggo/ui';
import { fileToDataUrl } from '@/lib/client/image';
import { downloadSlides } from '@/lib/client/render';
import { useCardEditor } from '@/lib/client/useCardEditor';
import { useRenderKit } from '@/lib/client/useRenderKit';
import { AssistantPanel } from './AssistantPanel';
import { CaptionPanel } from './CaptionPanel';
import { ContentPanel } from './ContentPanel';
import { EditorCanvas, measureSlideBoxes, useBuiltSlides } from './EditorCanvas';
import { JobPicker } from './JobPicker';
import { PropertiesPanel } from './PropertiesPanel';
import { RegenerateModal } from './RegenerateModal';
import { VariantPicker } from './VariantPicker';

const SLIDES = Array.from({ length: SLIDE_COUNT }, (_, slide) => slide);

/**
 * 받기 요청 하나의 상한. 배포처가 Vercel 이면 함수 요청 본문이 4.5MB 를 넘을 수 없다. 이미지는 data URL
 * 로 실리므로 넣을 때 막는다.
 */
const MAX_RENDER_REQUEST = 4_000_000;
const NO_LAYERS: Layer[] = [];

function toggled<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (!next.delete(value)) {
    next.add(value);
  }
  return next;
}

/**
 * 편집 화면 하단 바. 템플릿 바꾸기, 캔버스 크기, 받을 장·크기 고르기와 받기, 넘침 경고. 받기는 서버
 * 렌더(PNG)다 — 캔버스와 같은 JSX 를 이미지 생성기가 그린다.
 */
function BottomBar({
  spec,
  size,
  onSizeChange,
  overflow,
  onRepick,
}: {
  spec: CardSpec;
  size: CardSizeId;
  onSizeChange: (size: CardSizeId) => void;
  /** 넘친 장 번호. */
  overflow: number[];
  onRepick: () => void;
}) {
  const [slides, setSlides] = useState<Set<number>>(() => new Set(SLIDES));
  const [sizes, setSizes] = useState<Set<CardSizeId>>(() => new Set(['post']));
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targets = SLIDES.filter((slide) => slides.has(slide)).map((slide) => ({ spec, slide }));
  const count = targets.length * sizes.size;

  const download = async () => {
    setError(null);
    setProgress('준비 중');
    try {
      await downloadSlides(targets, [...sizes], (done, total) => setProgress(`${done}/${total}`));
    } catch {
      setError('다운로드에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="sticky bottom-0 z-10 flex flex-col gap-2 rounded-2xl bg-white p-3 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={onRepick}>
            템플릿 바꾸기
          </Button>
          <span className="text-sm font-bold">{variantOf(spec.variant).label}</span>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {CARD_SIZE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onSizeChange(id)}
                aria-pressed={size === id}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  size === id ? 'bg-white shadow-sm' : 'text-gray-500'
                }`}
              >
                {CARD_SIZES[id].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-600">받을 장</span>
          {SLIDES.map((slide) => (
            <label key={slide} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={slides.has(slide)}
                onChange={() => setSlides((current) => toggled(current, slide))}
              />
              {SLIDE_LABELS[slide]}
            </label>
          ))}
          <span className="text-sm text-gray-600">받을 크기</span>
          {CARD_SIZE_IDS.map((id) => (
            <label key={id} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={sizes.has(id)}
                onChange={() => setSizes((current) => toggled(current, id))}
              />
              {CARD_SIZES[id].label}
            </label>
          ))}
          <Button
            size="sm"
            disabled={count === 0 || progress !== null}
            onClick={() => void download()}
          >
            {progress ? `만드는 중 ${progress}` : `고른 ${count}장 받기`}
          </Button>
        </div>
      </div>
      {overflow.length > 0 ? (
        <p className="text-xs font-semibold text-error">
          주의: {overflow.map((slide) => slide + 1).join('·')}장은 글이 많아 가장 작은 글자로도
          넘칩니다. 항목을 줄이거나 글자 크기를 낮춰 주세요.
        </p>
      ) : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

/**
 * 편집 화면 배치. 상태와 동작은 `useCardEditor` 에 있고, 여기서는 패널을 놓기만 한다.
 *
 * 공고 고르기 → 템플릿 고르기(열 시안을 한 장씩 나란히) → 편집. 편집은 3단이다 — 왼쪽 문구와
 * 인스타 본문, 가운데 캔버스, 오른쪽 속성. 아래 바에서 템플릿을 바꾸고 받는다.
 */
export function CardEditor({ initialJobId }: { initialJobId?: number }) {
  const editor = useCardEditor();
  const { loaded, status, notice, specs, selectJob } = editor;
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [variant, setVariant] = useState<VariantId | null>(null);
  const [size, setSize] = useState<CardSizeId>('post');
  const [slide, setSlide] = useState(0);
  const [selected, setSelected] = useState<Selection | null>(null);
  const { kit, error: kitError } = useRenderKit();
  const spec = variant && specs ? specs[variant] : null;
  const built = useBuiltSlides(spec, size, kit);
  const sectionLabels = useMemo(
    () => (spec ? visibleSectionLabels(spec, slide) : []),
    [spec, slide],
  );

  // AI 비서의 도구는 요청 하나 동안 여러 번 불리며 그때마다 최신 화면 값을 본다. 렌더를 기다리지 않게
  // ref 로 넘긴다.
  const screenRef = useRef({ variant, size, slide, selected, built });
  screenRef.current = { variant, size, slide, selected, built };
  const { readLoaded, remember, applyQuietly } = editor;
  const toolContext = useMemo<ToolContext>(
    () => ({
      readLoaded,
      remember: () => remember(),
      apply: applyQuietly,
      variant: () => screenRef.current.variant ?? 'wave',
      pickVariant: setVariant,
      size: () => screenRef.current.size,
      slide: () => screenRef.current.slide,
      selected: () => {
        const now = screenRef.current.selected;
        return isElementId(now) ? now : null;
      },
      measure: () => {
        const { built: slides, size: sizeId } = screenRef.current;
        if (!slides) {
          return null;
        }
        const measured = slides.map((slideBuilt, index) => ({
          boxes: measureSlideBoxes(index, CARD_SIZES[sizeId].width),
          overflow: slideBuilt.overflow,
        }));
        return measured.every((item) => item.boxes)
          ? measured.map(({ boxes, overflow }) => ({ boxes: boxes ?? [], overflow }))
          : null;
      },
    }),
    [readLoaded, remember, applyQuietly],
  );

  // 주소에 공고 번호가 있으면 처음 한 번 그 공고를 고른다.
  useEffect(() => {
    if (initialJobId) {
      void selectJob(initialJobId);
    }
  }, [initialJobId, selectJob]);

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  // 다른 공고를 고르면 시안부터 다시 고른다.
  const jobId = loaded?.job.id;
  useEffect(() => {
    setVariant(null);
  }, [jobId]);

  // 템플릿을 바꾸면 1장부터, 아무것도 고르지 않은 채로 연다.
  useEffect(() => {
    setSlide(0);
    setSelected(null);
  }, [variant]);

  const layers = (variant && loaded?.layers[variant]?.[slide]) || NO_LAYERS;
  const selectedLayer = isLayerRef(selected)
    ? layers.find((layer) => layerRef(layer.id) === selected)
    : undefined;
  const setLayers = (next: Layer[], group?: string) =>
    variant && editor.setLayers(variant, slide, next, group);
  /** 이 장의 받기 요청이 상한을 넘으면 알릴 말. */
  const checkLayers = (next: Layer[]): string | null => {
    if (!spec) {
      return null;
    }
    const slidesLayers = [...(spec.layers ?? [])];
    slidesLayers[slide] = next;
    const request: RenderRequest = { spec: { ...spec, layers: slidesLayers }, slide, size };
    return JSON.stringify(request).length > MAX_RENDER_REQUEST
      ? '이 장의 이미지가 많거나 커서 받기 요청이 4MB 를 넘습니다. 이미지를 빼거나 더 작은 이미지를 넣어 주세요.'
      : null;
  };

  /** 캔버스에서 누른 글 요소의 문구 칸으로 간다. 목록은 지금 장의 섹션 칸이다. */
  const focusText = (id: ElementId) => {
    const key = id.startsWith('section-')
      ? slide === 0
        ? 'summarySections'
        : 'detailSections'
      : id;
    const field = document.getElementById(`content-${key}`);
    const details = field?.closest('details');
    if (details) {
      details.open = true;
    }
    field?.focus({ preventScroll: true });
    field?.scrollIntoView({ block: 'nearest' });
  };

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h1 className="text-xl font-bold">오공고 카드뉴스</h1>
        <p className="text-sm text-gray-500">
          공고를 고르면 AI가 초안을 쓰고 시안 열 개를 보여 줍니다. 하나를 골라 캔버스에서 고친 뒤
          원하는 장만 받습니다.
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={() => void logout()}>
          로그아웃
        </Button>
        {loaded ? (
          <>
            <Button size="sm" variant="secondary" onClick={editor.startOver}>
              처음부터 다시
            </Button>
            <Button size="sm" onClick={() => setRegenerateOpen(true)}>
              AI로 다시 쓰기
            </Button>
          </>
        ) : null}
      </div>
    </header>
  );

  const jobLine = loaded ? (
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

  const side =
    'flex flex-col gap-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto';

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-6">
      {header}

      {status.kind === 'loading' ? (
        <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">{status.message}</p>
      ) : null}
      {status.kind === 'error' ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error">{status.message}</p>
      ) : null}
      {notice ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>
      ) : null}

      {loaded && spec && variant ? (
        <>
          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)_320px]">
            <div className={side}>
              <ContentPanel content={loaded.content} onChange={editor.setContent} />
              <CaptionPanel
                caption={loaded.content.caption ?? ''}
                onChange={(caption) => editor.setContent({ ...loaded.content, caption })}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-3">
              {jobLine}
              {kitError ? (
                <p className="text-sm text-error">
                  캔버스를 그릴 글꼴을 받지 못했습니다. 새로고침해 주세요.
                </p>
              ) : null}
              {built ? (
                <EditorCanvas
                  slides={built}
                  size={size}
                  slide={slide}
                  edits={loaded.edits[variant]?.[slide]}
                  layers={layers}
                  onLayers={setLayers}
                  checkLayers={checkLayers}
                  onLogo={(image) =>
                    void fileToDataUrl(image).then(editor.setLogo, () => undefined)
                  }
                  textColor={resolvePalette(variant, loaded.settings).headlineText}
                  selected={selected}
                  onSelect={setSelected}
                  onSlideChange={(next) => {
                    setSlide(next);
                    setSelected(null);
                  }}
                  onEdit={(id, edit, group) => editor.setEdits(variant, slide, id, edit, group)}
                  onFocusText={focusText}
                  sectionLabels={sectionLabels}
                />
              ) : (
                <div className="flex h-80 items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
                  그리는 중
                </div>
              )}
            </div>
            <div className={side}>
              <PropertiesPanel
                settings={loaded.settings}
                onSettingsChange={editor.setSettings}
                selected={isElementId(selected) ? selected : null}
                sectionLabels={sectionLabels}
                edit={
                  isElementId(selected) ? loaded.edits[variant]?.[slide]?.[selected] : undefined
                }
                onEdit={(edit, group) =>
                  isElementId(selected) && editor.setEdits(variant, slide, selected, edit, group)
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
                brandColor={loaded.brandColor}
                onResetBrandColor={editor.resetBrandColor}
                logo={loaded.logo}
                onLogoChange={editor.setLogo}
                candidates={editor.candidates}
                assistant={<AssistantPanel context={toolContext} />}
              />
            </div>
          </div>
          <BottomBar
            spec={spec}
            size={size}
            onSizeChange={setSize}
            overflow={
              built
                ? built.flatMap((slideBuilt, index) => (slideBuilt.overflow ? [index] : []))
                : []
            }
            onRepick={() => setVariant(null)}
          />
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
          <JobPicker
            selectedId={loaded?.job.id}
            onSelect={(jobId) => void editor.selectJob(jobId)}
          />
          <div className="flex flex-col gap-4">
            {loaded && specs ? (
              <>
                {jobLine}
                <VariantPicker specs={specs} current={variant} onPick={setVariant} />
              </>
            ) : (
              <div className="flex h-80 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-sm text-gray-500">
                왼쪽에서 공고를 고르면 시안이 여기에 그려집니다.
              </div>
            )}
          </div>
        </div>
      )}

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
