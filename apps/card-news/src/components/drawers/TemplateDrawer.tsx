'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { DocumentKind, RenderSlide } from '@/lib/card/document';
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

/** 미리보기 폭(px). 서랍 300px 에 두 열이다. */
const PREVIEW_WIDTH = 126;

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
          {tab === 'slide' && slideOverride ? (
            <button
              type="button"
              onClick={() => onPickSlide(null)}
              className="self-start text-sm text-blue-600 underline"
            >
              문서 템플릿 따르기
            </button>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5">
            {VARIANTS.map((variant, index) => {
              const on = current === variant.id;
              const preview = built?.[index];
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
                    {preview ? (
                      <SlideStage
                        element={preview.element}
                        size={sizeValue}
                        width={PREVIEW_WIDTH}
                      />
                    ) : (
                      <span
                        className="block bg-gray-100"
                        style={{
                          width: PREVIEW_WIDTH,
                          height: (PREVIEW_WIDTH * sizeValue.height) / sizeValue.width,
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
