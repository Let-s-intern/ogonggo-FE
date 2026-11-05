import { useRef, useState } from 'react';
import { Button, Field } from '@ogonggo/ui';
import { useUploadNotificationImage } from '@/entities/notification-batch/api/useNotificationBatches';
import { serverErrorMessage } from '@/shared/api/authErrorMessages';
import type { NotificationImage } from '../lib/sendForm';

/** 서버가 받는 형식(`ImageAssetUsage.NOTIFICATION`). 고르는 창에서도 이 둘만 보인다. */
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

interface NotificationImageFieldProps {
  value: NotificationImage | null;
  onChange: (image: NotificationImage | null) => void;
}

/**
 * 알림에 붙일 이미지. 고르면 바로 올리고, 받은 `id` 를 발송 요청의 `imageId` 로 쓴다. 빼면 이미지 없이 보낸다 —
 * 올린 파일은 서버의 정리 작업이 지운다.
 */
export function NotificationImageField({ value, onChange }: NotificationImageFieldProps) {
  const upload = useUploadNotificationImage();
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
          onChange({ id: image.id, url: image.url });
        }
      },
    });
  };

  const error =
    typeError ??
    (upload.isError
      ? (serverErrorMessage(upload.error) ??
        '이미지를 올리지 못했어요. 잠시 뒤 다시 시도해 주세요.')
      : undefined);

  return (
    <Field label="이미지" htmlFor="notification-image" error={error}>
      <input
        ref={inputRef}
        id="notification-image"
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(event) => {
          pick(event.target.files?.[0]);
          // 같은 파일을 다시 골라도 `change` 가 오게 비운다.
          event.target.value = '';
        }}
      />
      {value ? (
        <div className="flex items-start gap-3">
          <img
            src={value.url}
            alt="알림 이미지 미리보기"
            className="h-24 w-40 rounded-md border border-gray-200 object-cover"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={upload.isPending}
              onClick={() => inputRef.current?.click()}
            >
              {upload.isPending ? '올리는 중' : '바꾸기'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onChange(null)}>
              빼기
            </Button>
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          disabled={upload.isPending}
          onClick={() => inputRef.current?.click()}
        >
          {upload.isPending ? '올리는 중' : '이미지 올리기'}
        </Button>
      )}
      <p className="pt-1.5 text-xs text-gray-500">
        선택 사항이에요. JPG·PNG 한 장을 붙이면 푸시 알림에 함께 보여요.
      </p>
    </Field>
  );
}
