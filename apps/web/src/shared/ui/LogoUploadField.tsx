'use client';

import { useRef, useState } from 'react';
import { cn } from '@ogonggo/ui';
import { uploadImageAsset } from '@/shared/lib/uploadImage';

export interface LogoUploadFieldProps {
  /** 라벨이 가리킬 업로드 버튼의 `id`. */
  id?: string;
  /** 지금 보이는 로고 주소. 없으면 업로드 버튼이다. */
  url?: string;
  /** 올린 이미지의 식별자와 주소. 프로필은 식별자를, 공고는 주소를 저장한다. */
  onUploaded: (image: { id: string; url: string }) => void;
  onClear: () => void;
  disabled?: boolean;
  /** 박스 크기. 프로필(정사각)과 공고 폼(입력칸 옆 가로형)이 다르다. */
  className?: string;
}

/**
 * 기업 로고 올리기 칸(v5 PRD 2·3·4 절). 기업 프로필, 채용공고 폼, 부트캠프 폼이 같은 것을
 * 쓴다.
 *
 * `POST /api/v1/images` 로 올리고 결과를 부른 쪽에 넘긴다. 올린 이미지가 어디에 붙는지는
 * 저장할 때 정해진다 — 올리기만 하고 나가면 붙지 않는다(`CoverImageField` 와 같다).
 *
 * 올린 뒤에는 그 이미지를 그대로 보여 준다. 오공고가 아닌 도메인이 올 수 있어 `next/image`
 * 대신 `img` 를 쓴다.
 */
export function LogoUploadField({
  id,
  url,
  onUploaded,
  onClear,
  disabled = false,
  className,
}: LogoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const select = async (file: File | undefined) => {
    if (!file || pending) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const image = await uploadImageAsset(file);
      if (image) {
        onUploaded(image);
      } else {
        setError('로고를 올리지 못했습니다.');
      }
    } catch {
      setError('로고를 올리지 못했습니다.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(event) => {
          void select(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      <div className="relative">
        <button
          id={id}
          type="button"
          aria-label={url ? '기업 로고 바꾸기' : '기업 로고 업로드'}
          disabled={disabled || pending}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center overflow-hidden rounded-md border border-dashed border-gray-300 bg-gray-50 text-[10px] leading-tight text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed',
            className,
          )}
        >
          {url ? (
            // oxlint-disable-next-line no-img-element
            <img src={url} alt="기업 로고" className="h-full w-full object-contain" />
          ) : (
            <>
              <span aria-hidden="true" className="icon-[lucide--upload] block size-3.5" />
              <span className="pt-0.5">{pending ? '올리는 중' : '로고 업로드'}</span>
              <span>1:1 비율 권장</span>
            </>
          )}
        </button>
        {url && !disabled ? (
          <button
            type="button"
            aria-label="기업 로고 삭제"
            onClick={onClear}
            className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 hover:text-gray-900"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block size-3" />
          </button>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="max-w-32 text-xs break-keep text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
