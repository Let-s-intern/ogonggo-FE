'use client';

import { useRef, useState } from 'react';
import { Field } from '@ogonggo/ui';
import { uploadImage } from '@/shared/lib/uploadImage';

export interface CoverImageFieldProps {
  /** 목업의 라벨. 채용공고와 부트캠프가 같은 말을 쓰지만 붙는 필드 이름은 다르다. */
  label?: string;
  value: string;
  onChange: (url: string) => void;
}

/**
 * 공고 대표 이미지(v5 PRD 3·4 절). **이 칸은 실제로 동작한다** — 같은 단의 기업 로고 칸과
 * 다르다.
 *
 * `createImage`(`POST /api/v1/images`) 로 올리고 응답의 `url` 을 폼 값에 넣는다. 그 값이
 * 공고에 붙는 것은 폼을 저장할 때다. 올리기만 하고 나가면 공고에 붙지 않는다.
 *
 * 올린 뒤에는 그 이미지를 그대로 보여 준다. 주소만 남기면 올라간 것이 맞는지 확인할 방법이
 * 없다.
 */
export function CoverImageField({
  label = '공고 대표 이미지',
  value,
  onChange,
}: CoverImageFieldProps) {
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
      const url = await uploadImage(file);
      if (url) {
        onChange(url);
      } else {
        setError('이미지를 올리지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } catch {
      setError('이미지를 올리지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <Field label={label} required error={error ?? undefined} className="pb-0">
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={pending}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center disabled:cursor-not-allowed"
      >
        {value ? (
          // 미리보기는 올라간 주소를 그대로 가리킨다. 오공고가 아닌 도메인이 올 수 있어
          // `next/image` 대신 `img` 를 쓴다 — 도메인마다 설정을 더해야 하는 쪽이다.
          // oxlint-disable-next-line no-img-element
          <img
            src={value}
            alt="공고 대표 이미지 미리보기"
            className="max-h-48 w-auto rounded-md object-contain"
          />
        ) : (
          <span aria-hidden="true" className="icon-[lucide--upload] block size-6 text-gray-400" />
        )}
        <span className="text-sm text-gray-500">
          {pending
            ? '올리는 중입니다.'
            : value
              ? '이미지를 다시 올리려면 클릭하세요.'
              : '이미지 파일을 드래그하거나 클릭해 업로드하세요.'}
        </span>
        <span className="text-xs text-gray-400">권장 1200 x 630px · JPG, PNG</span>
      </button>
    </Field>
  );
}
