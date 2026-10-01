'use client';

import { useState } from 'react';
import { Button } from '@ogonggo/ui';
import {
  CARD_SIZE_IDS,
  CARD_SIZES,
  SLIDE_COUNT,
  SLIDE_LABELS,
  type CardSizeId,
  type CardSpec,
} from '@/lib/card/types';
import { variantOf } from '@/lib/card/variants';
import { downloadSlides } from '@/lib/client/render';
import { usePreviews } from '@/lib/client/usePreviews';

const SLIDES = Array.from({ length: SLIDE_COUNT }, (_, slide) => slide);

/**
 * 고른 시안 하나의 세 장 미리보기와 받기. 왼쪽 설정을 바꾸면 이 세 장만 다시 그린다. 장을 골라
 * 원하는 크기로 받는다(처음엔 세 장 모두 골라 둔다).
 */
export function VariantPreview({ spec, onRepick }: { spec: CardSpec; onRepick: () => void }) {
  const variant = variantOf(spec.variant);
  const [size, setSize] = useState<CardSizeId>('post');
  const [sizes, setSizes] = useState<Set<CardSizeId>>(() => new Set(['post']));
  const [selected, setSelected] = useState<Set<number>>(() => new Set(SLIDES));
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { previews, error: renderError } = usePreviews(
    SLIDES.map((slide) => ({ spec, slide })),
    size,
    spec,
  );

  const toggle = <T,>(set: (update: (current: Set<T>) => Set<T>) => void, value: T) =>
    set((current) => {
      const next = new Set(current);
      if (!next.delete(value)) {
        next.add(value);
      }
      return next;
    });

  const targets = SLIDES.filter((slide) => selected.has(slide)).map((slide) => ({ spec, slide }));
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

  const { width, height } = CARD_SIZES[size];

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold">{variant.label}</h2>
          <Button size="sm" variant="secondary" onClick={onRepick}>
            다른 시안 고르기
          </Button>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {CARD_SIZE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setSize(id)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                size === id ? 'bg-white shadow-sm' : 'text-gray-500'
              }`}
            >
              {CARD_SIZES[id].label}
            </button>
          ))}
        </div>
      </div>

      {renderError ? (
        <p className="text-sm text-error">
          미리보기를 그리지 못했습니다. 잠시 뒤 다시 시도해 주세요.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SLIDES.map((slide) => {
          const preview = previews[slide];
          return (
            <figure key={slide} className="flex flex-col gap-2">
              <div
                className="flex items-center justify-center overflow-hidden bg-gray-100"
                style={{ aspectRatio: `${width} / ${height}` }}
              >
                {preview ? (
                  <img
                    src={preview.url}
                    alt={SLIDE_LABELS[slide]}
                    className="size-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-gray-400">그리는 중</span>
                )}
              </div>
              <figcaption>
                <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={selected.has(slide)}
                    onChange={() => toggle(setSelected, slide)}
                  />
                  {SLIDE_LABELS[slide]}
                </label>
              </figcaption>
              {preview?.overflow ? (
                <p className="text-xs font-semibold text-error">
                  주의: 글이 많아 가장 작은 글자로도 넘칩니다. 항목을 줄여 주세요.
                </p>
              ) : null}
            </figure>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-600">받을 크기</span>
        {CARD_SIZE_IDS.map((id) => (
          <label key={id} className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={sizes.has(id)}
              onChange={() => toggle(setSizes, id)}
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
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </section>
  );
}
