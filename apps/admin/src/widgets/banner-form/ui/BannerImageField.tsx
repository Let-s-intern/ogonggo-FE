import { useRef, useState } from 'react';
import { Button, Field, Select, cn } from '@ogonggo/ui';
import { useUploadBannerImage } from '@/entities/banner/api/useBanners';
import { bannerImageSrc } from '@/entities/banner/lib/banner';
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
  /** 비워 둘 수 없는가. 모바일 이미지는 홈 자리에서 비울 수 있다(웹이 PC 이미지를 쓴다). */
  required?: boolean;
  /** 이 칸에 고를 수 있는 기본 소재(사용자 웹의 `/banners/*.svg`). */
  presets?: { key: string; label: string; url: string }[];
}

/**
 * 배너 이미지 하나(PC 또는 모바일). 파일을 고르면 바로 올리고 받은 주소를 쓴다. 칸마다 업로드·기본 소재·미리보기가 따로
 * 있어 PC 와 모바일을 다른 소재로 채울 수 있다.
 */
export function BannerImageField({
  id,
  label,
  sizeHint,
  aspectClassName,
  value,
  onChange,
  error,
  required = true,
  presets = [],
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
    <Field label={label} htmlFor={id} error={shownError} required={required} hint={sizeHint}>
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
          {presets.length > 0 ? (
            <Select
              aria-label={`${label} 기본 소재`}
              className="w-auto"
              options={[
                { value: '', label: '기본 소재에서 고르기' },
                ...presets.map((preset) => ({ value: preset.key, label: preset.label })),
              ]}
              value=""
              onChange={(event) => {
                const preset = presets.find((item) => item.key === event.target.value);
                if (preset) {
                  upload.reset();
                  setTypeError(null);
                  onChange(preset.url);
                }
              }}
            />
          ) : null}
        </div>
      </div>
    </Field>
  );
}
