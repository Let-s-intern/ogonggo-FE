'use client';

import { useRef, type ReactNode } from 'react';
import { cn, useToast } from '@ogonggo/ui';
import {
  ATTACHMENT_CONTENT_TYPES,
  checkAttachment,
  uploadAttachment,
  type AttachmentUsage,
} from '@/shared/lib/uploadAttachment';

/** 글 하나에 붙일 수 있는 사진 수. 저장 요청 `imageIds` 의 상한이다. */
export const MAX_ATTACHMENTS = 3;

/**
 * 첨부 칸의 사진 한 장. `done` 만 `id` 가 있고 저장 요청에 실린다.
 *
 * `url` 은 미리보기 주소다. 올리는 중·실패는 고른 파일의 `blob:` 주소, 다 올리면 서버가 준 주소다.
 * `file` 은 실패한 것을 `다시 시도` 할 때 쓴다.
 */
export interface ImageAttachment {
  key: string;
  status: 'uploading' | 'failed' | 'done';
  url: string;
  id?: string;
  file?: File;
}

/** 읽어 온 글의 `images` 를 첨부 칸의 처음 값으로. 수정·복사·이어 쓰기가 쓴다. */
export function toImageAttachments(
  images: readonly { id: string; url: string }[],
): ImageAttachment[] {
  return images.map((image) => ({ key: image.id, status: 'done', id: image.id, url: image.url }));
}

/** 저장 요청의 `imageIds`. 미리보기 순서 그대로다. */
export function toImageIds(items: readonly ImageAttachment[]): string[] {
  return items.flatMap((item) => (item.status === 'done' && item.id ? [item.id] : []));
}

/** 아직 올리는 중인 사진이 있는지. 폼은 이때 등록 버튼을 막는다. */
export function isUploadingAttachments(items: readonly ImageAttachment[]): boolean {
  return items.some((item) => item.status === 'uploading');
}

export interface ImageAttachmentFieldProps {
  value: ImageAttachment[];
  onChange: (next: ImageAttachment[]) => void;
  /** 발급 API 의 `usage`. 사진이 놓일 S3 폴더를 정한다. */
  usage: AttachmentUsage;
  /** 칸 제목. 시안의 `이미지 첨부`. 뒤에 회색 `선택` 이 붙는다. */
  label?: string;
  /** 상자 아래 회색 안내. 취준고민은 개인정보 안내, 사이드·스터디는 썸네일 안내를 더한다. */
  notice?: ReactNode;
  /** 첫 칸에 `대표` 를 붙인다. 첫 사진이 목록 썸네일이 되는 사이드·스터디가 켠다. */
  markCover?: boolean;
}

/**
 * 글에 사진을 붙이는 칸(시안 `v13 취준고민/고민 올리기 모달.png`). 취준고민과 사이드·스터디 작성이
 * 같이 쓴다.
 *
 * 고르는 즉시 올린다(`uploadAttachment`). 저장 버튼에서 몰아 올리면 실패한 사진을 다시 고를 기회
 * 없이 글 저장이 실패한다. 올리는 중인 미리보기는 흐리게, 실패한 것은 `다시 시도` 와 삭제를 둔다.
 *
 * 값은 부르는 쪽이 들고 있다. 올리기가 끝나는 시점은 비동기라, 그 사이 다른 사진을 지우거나 더한
 * 것을 덮어쓰지 않도록 마지막으로 내보낸 값(`latest`)을 기준으로 고친다. 부르는 쪽이 아직 다시
 * 그리지 않았어도 같은 순간에 끝난 두 장이 서로를 지우지 않는다.
 *
 * 미리보기는 `next/image` 대신 `img` 다. `blob:` 주소와 S3 주소가 섞여 들어온다.
 */
export function ImageAttachmentField({
  value,
  onChange,
  usage,
  label = '이미지 첨부',
  notice,
  markCover = false,
}: ImageAttachmentFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const latest = useRef(value);
  latest.current = value;

  const emit = (next: ImageAttachment[]) => {
    latest.current = next;
    onChange(next);
  };
  const patch = (key: string, change: Partial<ImageAttachment>) =>
    emit(latest.current.map((item) => (item.key === key ? { ...item, ...change } : item)));

  const upload = async (key: string, file: File, blobUrl: string) => {
    try {
      const image = await uploadAttachment(file, usage);
      URL.revokeObjectURL(blobUrl);
      patch(key, { status: 'done', id: image.id, url: image.url, file: undefined });
    } catch {
      patch(key, { status: 'failed' });
    }
  };

  /**
   * 형식·크기를 먼저 거르고, 남은 칸보다 많으면 앞에서부터 칸만큼만 올린다. 걸러진 것이 있으면
   * 토스트로 알린다 — 토스트는 한 번에 하나만 떠서 첫 사유 하나만 띄운다.
   */
  const pick = (files: File[]) => {
    const rejected = files.map(checkAttachment).find((error) => error !== null);
    const accepted = files.filter((file) => checkAttachment(file) === null);
    const room = MAX_ATTACHMENTS - latest.current.length;
    if (rejected) {
      toast.show({ message: rejected.message, tone: 'error' });
    } else if (accepted.length > room) {
      toast.show({ message: `사진은 ${MAX_ATTACHMENTS}장까지 올릴 수 있어요`, tone: 'error' });
    }
    const added = accepted.slice(0, room).map((file): ImageAttachment => ({
      key: crypto.randomUUID(),
      status: 'uploading',
      url: URL.createObjectURL(file),
      file,
    }));
    if (added.length === 0) {
      return;
    }
    emit([...latest.current, ...added]);
    for (const item of added) {
      if (item.file) {
        void upload(item.key, item.file, item.url);
      }
    }
  };

  const retry = (item: ImageAttachment) => {
    if (!item.file) {
      return;
    }
    patch(item.key, { status: 'uploading' });
    void upload(item.key, item.file, item.url);
  };

  const remove = (item: ImageAttachment) => {
    if (item.url.startsWith('blob:')) {
      URL.revokeObjectURL(item.url);
    }
    emit(latest.current.filter((other) => other.key !== item.key));
  };

  return (
    <div>
      <p className="pb-1.5 text-sm font-medium text-gray-700">
        {label} <span className="text-xs font-normal text-gray-400">선택</span>
      </p>
      {value.length > 0 && (
        <ul className={cn('flex flex-wrap gap-2', value.length < MAX_ATTACHMENTS && 'pb-2')}>
          {value.map((item, index) => (
            <li
              key={item.key}
              className={cn(
                'relative size-20 overflow-hidden rounded-md bg-gray-100',
                item.status === 'failed' && 'ring-1 ring-red-500',
              )}
            >
              {/* oxlint-disable-next-line no-img-element */}
              <img
                src={item.url}
                alt={`첨부 사진 ${index + 1}`}
                className={cn('size-full object-cover', item.status !== 'done' && 'opacity-40')}
              />
              {markCover && index === 0 && (
                <span className="absolute top-1 left-1 rounded-sm bg-blue-500 px-1 text-[11px] leading-4 font-medium text-white">
                  대표
                </span>
              )}
              {item.status === 'uploading' && <span className="sr-only">올리는 중</span>}
              {item.status === 'failed' && (
                <button
                  type="button"
                  onClick={() => retry(item)}
                  className="absolute inset-x-0 bottom-0 bg-gray-900/70 py-1 text-xs font-medium text-white"
                >
                  다시 시도
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(item)}
                aria-label={`첨부 사진 ${index + 1} 삭제`}
                className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-gray-900/60 text-white"
              >
                <span aria-hidden="true" className="icon-[lucide--x] block size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {value.length < MAX_ATTACHMENTS && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept={ATTACHMENT_CONTENT_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(event) => {
              pick(Array.from(event.target.files ?? []));
              event.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-md bg-gray-100 px-5 py-4 text-left"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white">
              <span
                aria-hidden="true"
                className="icon-[lucide--image-plus] block size-5 text-gray-500"
              />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-sm text-gray-700">이미지 추가하기</span>
              <span className="text-xs text-gray-400">
                JPG, PNG · 최대 {MAX_ATTACHMENTS}장 · 장당 10MB
              </span>
            </span>
          </button>
        </>
      )}
      {notice && <div className="pt-2 text-xs text-gray-400">{notice}</div>}
    </div>
  );
}
