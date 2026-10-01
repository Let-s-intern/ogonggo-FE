'use client';

import { type ChangeEvent, useState } from 'react';
import type { CardImage } from '@/lib/card/types';
import { toCardImage } from '@/lib/client/image';
import { candidateToImage } from '@/lib/client/useCardEditor';
import type { ImageCandidate } from '@/lib/server/images';

interface ImagePickerProps {
  label: string;
  image?: CardImage;
  candidates: ImageCandidate[] | null;
  defaultOpacity: number;
  onChange: (image: CardImage | undefined) => void;
}

/** 시안 하나의 배경 이미지. 후보를 누르거나 직접 올린다. */
export function ImagePicker({
  label,
  image,
  candidates,
  defaultOpacity,
  onChange,
}: ImagePickerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async (load: () => Promise<CardImage>) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await load());
    } catch {
      setError('이미지를 읽지 못했습니다. 다른 이미지를 골라 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      void apply(() => toCardImage(file, image?.opacity ?? defaultOpacity));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{label}</span>
        <span className="flex items-center gap-2">
          <label className="cursor-pointer rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
            {busy ? '읽는 중' : '올리기'}
            <input type="file" accept="image/*" className="hidden" onChange={upload} />
          </label>
          {image ? (
            <button
              type="button"
              className="text-xs text-gray-500 underline"
              onClick={() => onChange(undefined)}
            >
              빼기
            </button>
          ) : null}
        </span>
      </div>
      {candidates === null ? (
        <p className="text-xs text-gray-400">후보를 찾는 중</p>
      ) : candidates.length === 0 ? (
        <p className="text-xs text-gray-500">자동으로 찾은 이미지가 없어요. 직접 올려 주세요.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {candidates.map((candidate) => (
            <button
              key={candidate.url}
              type="button"
              title={candidate.source}
              disabled={busy}
              onClick={() =>
                void apply(() => candidateToImage(candidate.url, image?.opacity ?? defaultOpacity))
              }
              className="size-16 shrink-0 overflow-hidden rounded border border-gray-200 hover:border-blue-500"
            >
              <img
                src={`/api/images/proxy?url=${encodeURIComponent(candidate.url)}`}
                alt={candidate.source}
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      {image ? (
        <label className="flex items-center justify-between gap-2 text-sm text-gray-700">
          진하기
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={image.opacity}
            onChange={(event) => onChange({ ...image, opacity: Number(event.target.value) })}
          />
        </label>
      ) : null}
      {error ? <p className="text-xs text-error">{error}</p> : null}
    </div>
  );
}
