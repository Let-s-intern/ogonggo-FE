'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BUNDLE_LAYOUT_LABELS,
  type BundleLayout,
  type BundleLayoutKind,
  type DocumentKind,
  type RenderSlide,
} from '@/lib/card/document';
import { CARD_SIZES, type CardSizeId, type VariantId } from '@/lib/card/types';
import { VARIANTS } from '@/lib/card/variants';
import type { RenderKit } from '@/lib/client/useRenderKit';
import { SlideStage, useBuiltSlides } from '../EditorCanvas';
import { Segmented } from '../fields';
import { Drawer } from '../LeftRail';

type TemplateTab = 'single' | 'bundle' | 'slide';

const TABS: { value: TemplateTab; label: string }[] = [
  { value: 'single', label: '단일 공고' },
  { value: 'bundle', label: '묶음' },
  { value: 'slide', label: '한 장씩' },
];

const LAYOUT_OPTIONS = (Object.keys(BUNDLE_LAYOUT_LABELS) as BundleLayoutKind[]).map((value) => ({
  value,
  label: BUNDLE_LAYOUT_LABELS[value],
}));

const PER_SLIDE_OPTIONS: { value: '1' | '2'; label: string }[] = [
  { value: '1', label: '한 장에 1개' },
  { value: '2', label: '2개' },
];

/**
 * 묶음 공고 장 배치 고르기. 항목명 표는 공고마다 한 장이고, 2열 카드는 한 장에 공고 1~2개, 회사 블록은 회사
 * 1~2곳이다(둘이 장에 들어가지 않으면 하나씩). 고르면 사람이 고른 배치로 남는다.
 */
function BundleLayoutPicker({
  layout,
  onChange,
}: {
  layout: BundleLayout;
  onChange: (layout: BundleLayout) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-2">
      <span className="text-xs font-bold text-gray-500">공고 장 배치</span>
      <Segmented
        label="공고 장 배치"
        options={LAYOUT_OPTIONS}
        value={layout.kind}
        onChange={(kind) =>
          onChange({ kind, perSlide: kind === 'labels' ? 1 : layout.perSlide, manual: true })
        }
      />
      <p className="text-xs text-gray-500">
        {layout.manual ? '직접 고른 배치입니다. ' : '내용에 맞춰 자동으로 고른 배치입니다. '}
        {layout.manual ? (
          <button
            type="button"
            className="text-blue-600 underline"
            onClick={() => onChange({ ...layout, manual: false })}
          >
            자동으로 고르기
          </button>
        ) : null}
      </p>
      {layout.kind === 'labels' ? (
        <p className="text-xs text-gray-500">공고마다 한 장입니다.</p>
      ) : (
        <>
          <Segmented
            label={layout.kind === 'companies' ? '한 장에 놓는 회사 수' : '한 장에 놓는 공고 수'}
            options={PER_SLIDE_OPTIONS}
            value={String(layout.perSlide) as '1' | '2'}
            onChange={(value) =>
              onChange({ ...layout, perSlide: Number(value) as 1 | 2, manual: true })
            }
          />
          <p className="text-xs text-gray-500">
            2개를 고르면 둘이 한 장에 들어갈 때만 같이 놓고, 넘치면 하나씩 나눕니다.
          </p>
        </>
      )}
    </div>
  );
}

/** 재기 전 미리보기 폭(px). 실제 폭은 두 열 칸에서 잰다 — 스크롤바가 서랍 폭을 먹으면 칸이 좁아진다. */
const FALLBACK_PREVIEW_WIDTH = 110;
/** 두 열 사이(`gap-2.5`)와 버튼 안쪽 여백(`p-1.5` 양쪽). */
const GRID_GAP = 10;
const CELL_PADDING = 12;

/** 두 열 칸에 꼭 맞는 미리보기 폭. 서랍 폭이 바뀌면 다시 잰다. */
function usePreviewWidth() {
  const [grid, setGrid] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(FALLBACK_PREVIEW_WIDTH);
  useEffect(() => {
    if (!grid) {
      return;
    }
    const fit = () =>
      setWidth(Math.max(40, Math.floor((grid.clientWidth - GRID_GAP) / 2 - CELL_PADDING)));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [grid]);
  return { ref: setGrid, width };
}

/**
 * 템플릿 서랍. `단일 공고`·`묶음` 은 한 벌 통째로(모든 장, 장마다 덮어쓴 템플릿도 지운다), `한 장씩` 은
 * 보고 있는 장에만 시안 배경·배치를 덮어쓴다. 미리보기는 캔버스와 같은 `buildSlide()` 를 브라우저에서
 * 그린다(서버를 부르지 않는다).
 *
 * 묶음 문서를 공고 하나로, 공고 하나 문서를 묶음으로 바꾸지는 않는다 — 문서 종류와 다른 탭은 시작
 * 화면을 가리킨다.
 */
export function TemplateDrawer({
  kind,
  specs,
  slideIndex,
  slideName,
  docVariant,
  slideOverride,
  size,
  kit,
  onPick,
  onPickSlide,
  bundleLayout,
  onBundleLayout,
}: {
  kind: DocumentKind;
  /** 시안별로 모든 장을 그 시안으로 편 값(장에 덮어쓴 템플릿은 뺀다). */
  specs: Record<VariantId, RenderSlide[]>;
  /** 보고 있는 장(0부터). */
  slideIndex: number;
  /** 보고 있는 장 이름(`slideLabel()`). */
  slideName: string;
  docVariant: VariantId;
  /** 보고 있는 장에 덮어쓴 템플릿. */
  slideOverride: VariantId | undefined;
  size: CardSizeId;
  kit: RenderKit | null;
  onPick: (variant: VariantId) => void;
  /** `null` 이면 덮어쓴 것을 지워 문서 템플릿을 따른다. */
  onPickSlide: (variant: VariantId | null) => void;
  /** 묶음 공고 장 배치. 묶음 문서에만 있다. */
  bundleLayout?: BundleLayout;
  onBundleLayout?: (layout: BundleLayout) => void;
}) {
  const [tab, setTab] = useState<TemplateTab>(kind === 'bundle' ? 'bundle' : 'single');
  const docTab = kind === 'bundle' ? 'bundle' : 'single';

  // 탭마다 시안별로 그릴 장. 단일은 시안의 대표 장, 묶음은 표지, 한 장씩은 보고 있는 장이다.
  const targets = useMemo(
    () =>
      VARIANTS.map((variant) => {
        const slides = specs[variant.id];
        const cover = Math.max(
          0,
          slides.findIndex((slide) => slide.role === 'cover'),
        );
        const index =
          tab === 'slide' ? slideIndex : tab === 'bundle' ? cover : (variant.previewSlide ?? 0);
        return slides[Math.min(index, slides.length - 1)]!;
      }),
    [specs, tab, slideIndex],
  );
  const built = useBuiltSlides(targets, size, kit);
  const current = tab === 'slide' ? (slideOverride ?? docVariant) : docVariant;
  const sizeValue = CARD_SIZES[size];
  const preview = usePreviewWidth();

  return (
    <Drawer title="템플릿">
      <Segmented label="템플릿 종류" options={TABS} value={tab} onChange={setTab} />
      {tab !== 'slide' && tab !== docTab ? (
        <p className="text-sm text-gray-600">
          {kind === 'bundle'
            ? '이 문서는 여러 공고 묶음입니다. 공고 하나 카드뉴스는 '
            : '이 문서는 공고 하나로 만들었습니다. 여러 공고 묶음은 '}
          <Link href="/" className="text-blue-600 underline">
            시작 화면
          </Link>
          에서 만듭니다.
        </p>
      ) : (
        <>
          <p className="text-xs font-bold text-gray-500">
            {tab === 'slide'
              ? `${slideName}에만 덮어쓰기`
              : tab === 'bundle'
                ? '묶음 · 표지 + 공고별 장 + 안내, 모든 장에 적용'
                : '모든 장에 적용'}
          </p>
          {tab === 'bundle' && bundleLayout && onBundleLayout ? (
            <BundleLayoutPicker layout={bundleLayout} onChange={onBundleLayout} />
          ) : null}
          {tab === 'slide' && slideOverride ? (
            <button
              type="button"
              onClick={() => onPickSlide(null)}
              className="self-start text-sm text-blue-600 underline"
            >
              문서 템플릿 따르기
            </button>
          ) : null}
          <div ref={preview.ref} className="grid grid-cols-2 gap-2.5">
            {VARIANTS.map((variant, index) => {
              const on = current === variant.id;
              const slide = built?.[index];
              return (
                <button
                  key={variant.id}
                  type="button"
                  aria-pressed={on}
                  aria-label={variant.label}
                  title={variant.description}
                  onClick={() => (tab === 'slide' ? onPickSlide(variant.id) : onPick(variant.id))}
                  className={`flex flex-col gap-1 rounded-lg bg-white p-1.5 text-left ${
                    on ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-200 hover:ring-blue-300'
                  }`}
                >
                  <span className="pointer-events-none block overflow-hidden rounded">
                    {slide ? (
                      <SlideStage element={slide.element} size={sizeValue} width={preview.width} />
                    ) : (
                      <span
                        className="block bg-gray-100"
                        style={{
                          width: preview.width,
                          height: (preview.width * sizeValue.height) / sizeValue.width,
                        }}
                      />
                    )}
                  </span>
                  <span className="truncate text-xs text-gray-700">{variant.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Drawer>
  );
}
