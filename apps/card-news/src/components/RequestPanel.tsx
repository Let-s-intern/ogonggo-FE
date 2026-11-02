'use client';

import { type FormEvent, type ReactNode, useState } from 'react';
import { Button, Input, Textarea } from '@ogonggo/ui';
import { fileToDataUrl } from '@/lib/client/image';
import { putImage } from '@/lib/client/imageStore';

/**
 * 시작 화면에서 적는 요청사항·추가 정보. 글과 참고 링크는 문서의 `request` 로 합쳐 초안 모델에 넘기고,
 * 첨부 이미지는 IndexedDB 에 넣어 id 만 문서에 남긴다(`uploads`). 이미지는 모델에 보내지 않는다.
 */
export interface StartRequest {
  text: string;
  links: string[];
  images: { id: string; dataUrl: string }[];
}

export const EMPTY_REQUEST: StartRequest = { text: '', links: [], images: [] };

/** 문서 `request` 로 남길 글. 참고 링크는 글로만 넘긴다 — 서버가 그 주소를 읽지 않는다. */
export function requestText({ text, links }: StartRequest): string {
  const parts = [text.trim()];
  if (links.length > 0) {
    parts.push(
      ['참고 링크(읽지 않음, 글로만 참고)', ...links.map((link) => `- ${link}`)].join('\n'),
    );
  }
  return parts.filter(Boolean).join('\n\n');
}

function isLink(value: string): boolean {
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * 시작 화면 맨 아래 전체 폭 요청사항 바. 탭마다 다음 단계 버튼(`action`)을 오른쪽에 둔다. 화면에 고정하지
 * 않는다 — 탭 격자의 두 열을 다 차지하는 마지막 칸이다.
 */
export function RequestPanel({
  value,
  onChange,
  action,
}: {
  value: StartRequest;
  onChange: (next: StartRequest) => void;
  action: ReactNode;
}) {
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addLink = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = link.trim();
    if (!isLink(trimmed)) {
      setError('http 나 https 로 시작하는 주소를 넣어 주세요.');
      return;
    }
    setError(null);
    setLink('');
    if (!value.links.includes(trimmed)) {
      onChange({ ...value, links: [...value.links, trimmed] });
    }
  };

  const attach = async (files: FileList | null) => {
    const images = await Promise.all(
      [...(files ?? [])]
        .filter((file) => file.type.startsWith('image/'))
        .map(async (file) => {
          const dataUrl = await fileToDataUrl(file);
          const id = `upload-${crypto.randomUUID().slice(0, 8)}`;
          // 남기지 못해도(사생활 보호 창) 이번 화면에서는 쓴다.
          await putImage(id, dataUrl);
          return { id, dataUrl };
        }),
    );
    onChange({ ...value, images: [...value.images, ...images] });
  };

  return (
    <section
      aria-label="요청사항·추가 정보"
      className="rounded-2xl bg-white shadow-sm lg:col-span-2"
    >
      <div className="flex w-full flex-col gap-2 px-4 py-3">
        <div className="flex items-end gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-sm font-bold">
              요청사항·추가 정보{' '}
              <span className="text-xs font-normal text-gray-500">
                공고 원문과 다르면 여기 적은 것을 따릅니다(예: 바뀐 마감 시각). 초안을 쓸 때 같이
                보냅니다.
              </span>
            </span>
            <Textarea
              rows={2}
              placeholder="예: 마감을 11월 9일 23:59 로 써 줘. 신입 공채라는 점을 제목에 살려 줘."
              value={value.text}
              onChange={(event) => onChange({ ...value, text: event.target.value })}
            />
          </label>
          <div className="shrink-0">{action}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={addLink} className="flex items-center gap-2">
            <Input
              aria-label="참고 링크"
              placeholder="참고 링크 붙여넣기"
              inputMode="url"
              className="h-8 w-64 text-sm"
              value={link}
              onChange={(event) => {
                setLink(event.target.value);
                setError(null);
              }}
            />
            <Button type="submit" size="sm" variant="secondary" className="shrink-0">
              링크 더하기
            </Button>
          </form>
          <label className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            이미지 첨부
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(event) => {
                void attach(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
          <span className="text-xs text-gray-500">
            첨부한 이미지는 편집 화면에서 씁니다. AI 에는 보내지 않습니다.
          </span>
          {error ? <span className="text-xs text-error">{error}</span> : null}
          {value.links.map((item) => (
            <span
              key={item}
              className="flex max-w-60 items-center gap-1 rounded-full bg-gray-100 py-0.5 pr-1 pl-3 text-xs"
            >
              <span className="truncate text-blue-600">{item}</span>
              <button
                type="button"
                aria-label={`${item} 빼기`}
                className="rounded-full px-1.5 text-gray-500 hover:bg-gray-200"
                onClick={() =>
                  onChange({ ...value, links: value.links.filter((other) => other !== item) })
                }
              >
                빼기
              </button>
            </span>
          ))}
          {value.images.map((image) => (
            <span key={image.id} className="flex items-center gap-1">
              <img src={image.dataUrl} alt="" className="size-8 rounded object-cover" />
              <button
                type="button"
                className="text-xs text-gray-500 underline"
                onClick={() =>
                  onChange({
                    ...value,
                    images: value.images.filter((other) => other.id !== image.id),
                  })
                }
              >
                빼기
              </button>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
