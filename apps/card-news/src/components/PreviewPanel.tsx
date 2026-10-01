'use client';

import { useEffect, useState } from 'react';
import { Button } from '@ogonggo/ui';
import {
  CARD_SIZE_IDS,
  CARD_SIZES,
  SLIDE_COUNT,
  SLIDE_LABELS,
  type CardSizeId,
  type CardSpec,
} from '@/lib/card/types';
import { downloadSlide, downloadZip, renderSlide } from '@/lib/client/render';

interface Preview {
  url: string;
  overflow: boolean;
}

/**
 * 세 장 미리보기와 다운로드. 미리보기도 다운로드와 같은 렌더 API 로 그린다 — 본 그대로 받는다.
 * 편집할 때마다 다시 그리면 요청이 몰리므로 마지막 입력 뒤 0.5초를 기다린다.
 */
export function PreviewPanel({ spec }: { spec: CardSpec }) {
  const [size, setSize] = useState<CardSizeId>('post');
  const [previews, setPreviews] = useState<(Preview | null)[]>(() => Array(SLIDE_COUNT).fill(null));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setError(null);
      Promise.all(
        Array.from({ length: SLIDE_COUNT }, (_, slide) =>
          renderSlide(spec, slide, size, controller.signal),
        ),
      )
        .then((slides) => {
          const next = slides.map((slide) => ({
            url: URL.createObjectURL(slide.blob),
            overflow: slide.overflow,
          }));
          setPreviews((current) => {
            current.forEach((preview) => preview && URL.revokeObjectURL(preview.url));
            return next;
          });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setError('미리보기를 그리지 못했습니다. 잠시 뒤 다시 시도해 주세요.');
          }
        });
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [spec, size]);

  const run = async (label: string, task: () => Promise<void>) => {
    setBusy(label);
    try {
      await task();
    } catch {
      setError('다운로드에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(null);
    }
  };

  const { width, height } = CARD_SIZES[size];

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => run('zip', () => downloadZip(spec, [size]))}
          >
            {busy === 'zip' ? '만드는 중' : `${width}x${height} 세 장 zip`}
          </Button>
          <Button
            size="sm"
            disabled={busy !== null}
            onClick={() => run('all', () => downloadZip(spec, CARD_SIZE_IDS))}
          >
            {busy === 'all' ? '만드는 중' : '모든 크기 zip'}
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {previews.map((preview, slide) => (
          <figure key={slide} className="flex flex-col gap-2">
            <div
              className="flex items-center justify-center overflow-hidden rounded-lg bg-gray-100"
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
            <figcaption className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{SLIDE_LABELS[slide]}</span>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy !== null}
                onClick={() => run(`slide-${slide}`, () => downloadSlide(spec, slide, size))}
              >
                PNG 받기
              </Button>
            </figcaption>
            {preview?.overflow ? (
              <p className="text-xs font-semibold text-error">
                주의: 글이 많아 가장 작은 글자로도 넘칩니다. 항목을 줄여 주세요.
              </p>
            ) : null}
          </figure>
        ))}
      </div>
    </section>
  );
}
