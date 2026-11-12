'use client';

import { useRef, useState } from 'react';
import { Field } from '@ogonggo/ui';
import { uploadImage } from '@/shared/lib/uploadImage';
import { MAX_SOURCE_IMAGES } from '../model/values';

export interface JobSourceImagesFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
  /** 칸 아래에 띄울 안내. 올린 이미지가 만료돼 빠졌을 때 쓴다(`shared/lib/expiredImages.ts`). */
  notice?: string;
}

const UPLOAD_ERROR = '이미지를 올리지 못했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 공고 원문 이미지(선택, 이슈 #653, BE LC-3612). 공고 포스터나 상세 이미지를 올리면 공개 상세 `공고 원문`
 * 탭에 글 아래로 올린 순서대로 보인다. 글 칸은 그대로 모두 쓴다 — 이 칸은 글을 대신하지 않는다.
 *
 * 대표 이미지 칸(`CoverImageField`)과 같은 `POST /api/v1/images` 로 한 장씩 올리고, 저장할 때 공고에 붙는다.
 * 여러 장을 한 번에 고를 수 있고 최대 `MAX_SOURCE_IMAGES` 장이다. 넘치는 장은 올리지 않고 알린다.
 * 순서는 위·아래 버튼으로 바꾼다. 원문에 보이는 순서가 이 순서다.
 */
export function JobSourceImagesField({ value, onChange, notice }: JobSourceImagesFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = MAX_SOURCE_IMAGES - value.length;

  const select = async (files: File[]) => {
    if (files.length === 0 || pending) {
      return;
    }
    const picked = files.slice(0, remaining);
    setPending(true);
    setError(
      files.length > remaining ? `원문 이미지는 ${MAX_SOURCE_IMAGES}장까지 올릴 수 있어요.` : null,
    );
    const uploaded: string[] = [];
    try {
      // 한 장씩 올려 순서를 고른 순서대로 지킨다.
      for (const file of picked) {
        const url = await uploadImage(file);
        if (!url) {
          setError(UPLOAD_ERROR);
          break;
        }
        uploaded.push(url);
      }
    } catch {
      setError(UPLOAD_ERROR);
    } finally {
      if (uploaded.length > 0) {
        onChange([...value, ...uploaded]);
      }
      setPending(false);
    }
  };

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= value.length) {
      return;
    }
    const next = [...value];
    const [moved] = next.splice(index, 1);
    if (moved !== undefined) {
      next.splice(target, 0, moved);
    }
    onChange(next);
  };

  return (
    <Field
      label="원문 이미지"
      hint={`선택 · 공고 포스터나 상세 이미지를 올리면 공고 상세의 공고 원문에 글 아래로 보여요. 최대 ${MAX_SOURCE_IMAGES}장`}
      error={error ?? notice}
      className="pb-0"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        multiple
        className="hidden"
        onChange={(event) => {
          void select(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <div className="flex flex-col gap-3">
        {value.length > 0 ? (
          <ol className="flex flex-col gap-2">
            {value.map((url, index) => (
              <li
                key={`${url}-${index}`}
                className="flex items-center gap-3 rounded-md border border-gray-200 bg-white p-2"
              >
                <span className="w-5 shrink-0 text-center text-sm text-gray-500">{index + 1}</span>
                {/* 오공고가 아닌 도메인이 올 수 있어 `next/image` 대신 `img` 를 쓴다(`CoverImageField`). */}
                {/* oxlint-disable-next-line no-img-element */}
                <img
                  src={url}
                  alt={`원문 이미지 ${index + 1}`}
                  className="h-16 w-16 shrink-0 rounded-sm bg-gray-50 object-contain"
                />
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={`원문 이미지 ${index + 1} 위로`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    className="rounded-sm p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <span aria-hidden="true" className="icon-[lucide--chevron-up] block size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`원문 이미지 ${index + 1} 아래로`}
                    disabled={index === value.length - 1}
                    onClick={() => move(index, 1)}
                    className="rounded-sm p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
                  >
                    <span aria-hidden="true" className="icon-[lucide--chevron-down] block size-5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`원문 이미지 ${index + 1} 빼기`}
                    onClick={() => onChange(value.filter((_, item) => item !== index))}
                    className="rounded-sm p-1.5 text-gray-500 hover:bg-gray-100"
                  >
                    <span aria-hidden="true" className="icon-[lucide--x] block size-5" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        {remaining > 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center disabled:cursor-not-allowed"
          >
            <span
              aria-hidden="true"
              className="icon-[lucide--image-plus] block size-6 text-gray-400"
            />
            <span className="text-sm text-gray-500">
              {pending
                ? '올리는 중입니다.'
                : `클릭해 이미지를 추가하세요. (${value.length}/${MAX_SOURCE_IMAGES})`}
            </span>
            <span className="text-xs text-gray-400">
              JPG, PNG · 여러 장을 한 번에 고를 수 있어요
            </span>
          </button>
        ) : null}
      </div>
    </Field>
  );
}
