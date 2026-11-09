import { useRef, useState, type ReactNode } from 'react';
import { Button, Field, Input } from '@ogonggo/ui';
import { useUploadContentImage } from '@/entities/content/api/useContent';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

/** 올릴 수 있는 형식. 어드민의 다른 업로드(배너·알림 이미지)와 같다. */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

interface ImageUploadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
  required?: boolean;
  hint?: string;
  /** 칸 아래에 붙는 것. 로고 칸의 로고 추천(`LogoSuggest`)이 여기 온다. */
  children?: ReactNode;
}

type Mode = 'upload' | 'url';

/**
 * 이미지 한 장. 값은 언제나 주소다. 넣는 길을 둘 중에서 고른다.
 *
 * - 파일 올리기: 고르면 바로 올리고 받은 주소를 값으로 쓴다(`useUploadContentImage`). 모양은 배너 이미지 칸
 *   (`widgets/banner-form/ui/BannerImageField.tsx`)을 따른다.
 * - 주소 입력: 채용공고 편집처럼 주소를 그대로 적는다. 바깥 주소는 서버가 막지 않고 저장한다.
 *
 * 처음에는 파일 올리기로 연다. 저장된 값이 있으면 어느 쪽이든 미리보기가 같이 보인다.
 */
export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  hint,
  children,
}: ImageUploadFieldProps) {
  const [mode, setMode] = useState<Mode>('upload');
  const upload = useUploadContentImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  const pick = (file: File | undefined) => {
    if (!file) {
      return;
    }
    upload.reset();
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setTypeError('JPG 또는 PNG 파일만 올릴 수 있습니다.');
      return;
    }
    setTypeError(null);
    upload.mutate(file, {
      onSuccess: (image) => {
        if (image) {
          onChange(image.url);
        }
      },
    });
  };

  const shownError =
    typeError ??
    (upload.isError
      ? (serverErrorMessage(upload.error) ??
        '이미지를 올리지 못했습니다. 잠시 뒤 다시 시도해 주세요.')
      : error);

  const preview = value.trim();

  return (
    <Field label={label} htmlFor={id} error={shownError} required={required} hint={hint}>
      <div className="mb-2 flex gap-1" role="group" aria-label={`${label} 넣는 방법`}>
        {(
          [
            ['upload', '파일 올리기'],
            ['url', '주소 입력'],
          ] as const
        ).map(([key, text]) => (
          <Button
            key={key}
            size="sm"
            variant={mode === key ? 'primary' : 'secondary'}
            aria-pressed={mode === key}
            onClick={() => setMode(key)}
          >
            {text}
          </Button>
        ))}
      </div>
      <input
        ref={inputRef}
        id={mode === 'upload' ? id : undefined}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          // 같은 파일을 다시 골라도 `change` 가 오게 비운다.
          event.target.value = '';
        }}
      />
      {mode === 'url' ? (
        <Input
          id={id}
          type="url"
          placeholder="https://"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
      <div className="mt-2 flex items-center gap-3">
        {preview ? (
          <img
            key={preview}
            src={preview}
            alt={`${label} 미리보기`}
            className="h-20 w-auto rounded-md border border-gray-200 bg-gray-50 object-contain"
          />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed border-gray-300 text-sm text-gray-400">
            이미지가 없습니다
          </div>
        )}
        {mode === 'upload' ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {upload.isPending ? '올리는 중' : value ? '바꾸기' : '이미지 올리기'}
          </Button>
        ) : null}
        {value ? (
          <Button size="sm" variant="secondary" onClick={() => onChange('')}>
            빼기
          </Button>
        ) : null}
      </div>
      {children}
    </Field>
  );
}
