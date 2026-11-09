import { useRef, useState } from 'react';
import { Button, Field } from '@ogonggo/ui';
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
}

/**
 * 이미지 한 장. 파일을 고르면 바로 올리고 받은 주소를 값으로 쓴다(`useUploadContentImage`). 모양은 배너 이미지 칸
 * (`widgets/banner-form/ui/BannerImageField.tsx`)을 따른다.
 */
export function ImageUploadField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  hint,
}: ImageUploadFieldProps) {
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

  return (
    <Field label={label} htmlFor={id} error={shownError} required={required} hint={hint}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          // 같은 파일을 다시 골라도 `change` 가 오게 비운다.
          event.target.value = '';
        }}
      />
      <div className="flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt={`${label} 미리보기`}
            className="h-20 w-auto rounded-md border border-gray-200 bg-gray-50 object-contain"
          />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded-md border border-dashed border-gray-300 text-sm text-gray-400">
            이미지가 없습니다
          </div>
        )}
        <Button
          size="sm"
          variant="secondary"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? '올리는 중' : value ? '바꾸기' : '이미지 올리기'}
        </Button>
        {value ? (
          <Button size="sm" variant="secondary" onClick={() => onChange('')}>
            빼기
          </Button>
        ) : null}
      </div>
    </Field>
  );
}
