import { useRef, useState } from 'react';
import { Button, Field, cn } from '@ogonggo/ui';
import { useUploadBannerImage } from '@/entities/advertisement-exposure/api/useAdvertisementExposures';
import { bannerImageSrc } from '@/entities/advertisement-exposure/lib/exposure';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';

/** 올릴 수 있는 형식. 업로드가 알림 이미지 `usage`(`NOTIFICATION`)를 빌려 써서 JPEG·PNG 뿐이다. */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

interface BannerImageFieldProps {
  id: string;
  label: string;
  /** 권장 크기 안내. 비율이 다르면 홈에서 잘린다(`object-cover`). */
  sizeHint: string;
  /** 미리보기 비율 클래스. 홈과 같은 비율로 보여야 잘리는 곳을 미리 안다. */
  aspectClassName: string;
  value: string;
  onChange: (url: string) => void;
  error?: string;
}

/**
 * 배너 이미지. 파일을 고르면 바로 올리고 받은 주소를 쓴다. BE 노출은 이미지가 한 장뿐이고 HTTP(S) 절대 주소만 받아, 웹 안의
 * 기본 소재(`/banners/*.svg`)는 고를 수 없다.
 */
export function BannerImageField({
  id,
  label,
  sizeHint,
  aspectClassName,
  value,
  onChange,
  error,
}: BannerImageFieldProps) {
  const upload = useUploadBannerImage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [typeError, setTypeError] = useState<string | null>(null);

  const pick = (file: File | undefined) => {
    if (!file) {
      return;
    }
    upload.reset();
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setTypeError('JPG 또는 PNG 파일만 올릴 수 있어요.');
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
        '이미지를 올리지 못했어요. 잠시 뒤 다시 시도해 주세요.')
      : error);

  return (
    <Field label={label} htmlFor={id} error={shownError} required hint={sizeHint}>
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
      <div className="flex flex-col gap-2">
        {value ? (
          <img
            src={bannerImageSrc(value)}
            alt={`${label} 미리보기`}
            className={cn(
              'w-full rounded-md border border-gray-200 bg-gray-50 object-cover',
              aspectClassName,
            )}
          />
        ) : (
          <div
            className={cn(
              'flex w-full items-center justify-center rounded-md border border-dashed border-gray-300 text-sm text-gray-400',
              aspectClassName,
            )}
          >
            이미지가 없습니다
          </div>
        )}
        <div className="flex gap-2">
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
      </div>
    </Field>
  );
}
