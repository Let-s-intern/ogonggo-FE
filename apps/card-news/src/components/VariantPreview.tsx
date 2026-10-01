'use client';

import { useState } from 'react';
import { Button } from '@ogonggo/ui';
import {
  CARD_SIZE_IDS,
  CARD_SIZES,
  SLIDE_COUNT,
  SLIDE_LABELS,
  type CardImage,
  type CardSizeId,
  type CardSpec,
} from '@/lib/card/types';
import { variantOf } from '@/lib/card/variants';
import { toCardImage } from '@/lib/client/image';
import { downloadSlides } from '@/lib/client/render';
import { IMAGE_OPACITY } from '@/lib/client/useCardEditor';
import { usePreviews } from '@/lib/client/usePreviews';

const SLIDES = Array.from({ length: SLIDE_COUNT }, (_, slide) => slide);

/**
 * 고른 시안 하나의 세 장 미리보기와 받기. 왼쪽 설정을 바꾸면 이 세 장만 다시 그린다. 장을 골라
 * 원하는 크기로 받는다(처음엔 세 장 모두 골라 둔다).
 */
export function VariantPreview({
  spec,
  onRepick,
  onImage,
}: {
  spec: CardSpec;
  onRepick: () => void;
  /** 이미지가 빠진 시안에서 바로 올린 사진. 공통 설정의 같은 칸에 들어간다. */
  onImage: (patch: { photo?: CardImage; building?: CardImage }) => void;
}) {
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

  const uploadMissing = (file: File) => {
    const kind = variant.image;
    if (!kind) {
      return;
    }
    void toCardImage(file, IMAGE_OPACITY[kind])
      .then((image) => onImage({ [kind]: image }))
      .catch(() => setError('이미지를 읽지 못했습니다. 다른 이미지를 골라 주세요.'));
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

      {variant.image && !spec.settings[variant.image] ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <span>
            {variant.image === 'building'
              ? '회사 건물 사진을 찾지 못해 사진 없이 그렸어요. 건물 사진을 올리면 이 시안이 완성됩니다.'
              : '관련 이미지를 찾지 못해 이미지 없이 그렸어요. 이미지를 올리면 이 시안이 완성됩니다.'}
          </span>
          <label className="cursor-pointer rounded-md border border-amber-300 bg-white px-2 py-1 font-semibold hover:bg-amber-100">
            사진 올리기
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) {
                  uploadMissing(file);
                }
              }}
            />
          </label>
        </div>
      ) : null}
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
