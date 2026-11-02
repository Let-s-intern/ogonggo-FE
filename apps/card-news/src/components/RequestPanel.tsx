'use client';

import { type FormEvent, useState } from 'react';
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

export function RequestPanel({
  value,
  onChange,
}: {
  value: StartRequest;
  onChange: (next: StartRequest) => void;
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
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-bold">요청사항·추가 정보</h2>
        <p className="text-xs text-gray-500">
          공고 원문과 다르면 여기 적은 것을 따릅니다(예: 바뀐 마감 시각). 공고를 고르기 전에 적어
          주세요.
        </p>
      </div>
      <Textarea
        aria-label="요청사항"
        rows={3}
        placeholder="예: 마감을 11월 9일 23:59 로 써 줘. 신입 공채라는 점을 제목에 살려 줘."
        value={value.text}
        onChange={(event) => onChange({ ...value, text: event.target.value })}
      />
      <form onSubmit={addLink} className="flex gap-2">
        <Input
          aria-label="참고 링크"
          placeholder="참고 링크 붙여넣기"
          inputMode="url"
          className="h-9 text-sm"
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
      {error ? <p className="text-xs text-error">{error}</p> : null}
      {value.links.length > 0 ? (
        <ul className="flex flex-col gap-1 text-sm">
          {value.links.map((item) => (
            <li key={item} className="flex items-center justify-between gap-2">
              <span className="truncate text-blue-600">{item}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onChange({ ...value, links: value.links.filter((other) => other !== item) })
                }
              >
                빼기
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
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
          첨부한 이미지는 이 브라우저에 남아 편집 화면에서 씁니다. AI 에는 보내지 않습니다.
        </span>
      </div>
      {value.images.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {value.images.map((image) => (
            <li key={image.id} className="relative">
              <img src={image.dataUrl} alt="" className="size-16 rounded-md object-cover" />
              <button
                type="button"
                className="absolute inset-x-0 bottom-0 rounded-b-md bg-gray-900/70 text-xs text-white"
                onClick={() =>
                  onChange({
                    ...value,
                    images: value.images.filter((other) => other.id !== image.id),
                  })
                }
              >
                빼기
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
