'use client';

import { type ChangeEvent, useEffect, useState } from 'react';
import { mix } from '@/lib/card/color';
import {
  BACKGROUND_PATTERNS,
  type BackgroundPattern,
  type CardBackground,
  type CardSettings,
} from '@/lib/card/types';
import { backgroundTone } from '@/lib/card/variants';
import { getImage } from '@/lib/client/imageStore';
import { Drawer } from '../LeftRail';

/** 사진의 처음 진하기. 글자 뒤에 깔리므로 반쯤 비친다. */
const PHOTO_OPACITY = 0.6;

/** 무늬 칸에 칠할 모양. 그 무늬 시안의 바탕색이고, 물결은 두 톤, 테두리는 브랜드색 테두리다. */
function patternStyle(pattern: BackgroundPattern, settings: CardSettings) {
  const tone = backgroundTone({ ...settings, background: { kind: 'pattern', pattern } });
  const base = tone?.background ?? '#F4F5F7';
  switch (pattern) {
    case 'wave':
      return {
        background: `linear-gradient(160deg, ${base} 55%, ${mix(base, '#FFFFFF', 0.3)} 55%)`,
      };
    case 'frame':
      return { background: '#FFFFFF', boxShadow: `inset 0 0 0 4px ${settings.brandColor}` };
    case 'thumbDark':
      return { background: '#1F2937' };
    default:
      return { background: base };
  }
}

function same(a: CardBackground | undefined, b: CardBackground): boolean {
  if (!a || a.kind !== b.kind) {
    return false;
  }
  if (a.kind === 'color' && b.kind === 'color') {
    return a.color.toUpperCase() === b.color.toUpperCase();
  }
  if (a.kind === 'pattern' && b.kind === 'pattern') {
    return a.pattern === b.pattern;
  }
  return a.kind === 'photo' && b.kind === 'photo' && a.imageId === b.imageId;
}

/**
 * 배경 서랍. 시안 배경 대신 단색·무늬(시안에서 떼어 낸 배경)·사진을 깐다. `모든 장에 같이 적용` 을 켜면 문서
 * 배경(모든 장, 장마다 덮어쓴 것은 지운다)을, 끄면 보고 있는 장의 배경만 바꾼다. 템플릿을 다시 골라도 덮어쓴
 * 배경은 남는다 — 그래서 덮어쓴 동안은 그렇다는 한 줄과 지우기 버튼을 둔다.
 */
export function BackgroundDrawer({
  settings,
  slideBackground,
  overridden,
  slideName,
  uploads,
  onUpload,
  onChange,
  onClear,
}: {
  settings: CardSettings;
  /** 보고 있는 장에만 덮어쓴 배경. */
  slideBackground: CardBackground | undefined;
  /** 문서나 어느 장이든 배경을 덮어썼는가. */
  overridden: boolean;
  /** 보고 있는 장 이름(`1. 공고 요약`). */
  slideName: string;
  /** 이 문서에 올린 이미지 id(IndexedDB 열쇠). */
  uploads: string[];
  onUpload: (files: File[]) => void;
  /** `all` 이면 모든 장, 아니면 보고 있는 장. `null` 이면 그 범위의 덮어쓰기를 지운다. `group` 이 같으면 한 단계. */
  onChange: (background: CardBackground | null, all: boolean, group?: string) => void;
  /** 모든 덮어쓰기를 지운다(시안 배경으로). */
  onClear: () => void;
}) {
  const [all, setAll] = useState(!slideBackground);
  const [images, setImages] = useState<Record<string, string | null>>({});
  const current = all ? settings.background : (slideBackground ?? settings.background);

  useEffect(() => {
    let cancelled = false;
    const missing = uploads.filter((id) => !(id in images));
    if (missing.length === 0) {
      return;
    }
    void Promise.all(missing.map(async (id) => [id, await getImage(id)] as const)).then((found) => {
      if (!cancelled) {
        setImages((value) => ({ ...value, ...Object.fromEntries(found) }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [uploads, images]);

  const pick = (background: CardBackground, group?: string) => onChange(background, all, group);
  const opacity = current?.kind === 'photo' ? current.opacity : PHOTO_OPACITY;
  // 진하기 슬라이더가 보이는 값. 단색·무늬는 처음이 100% 다.
  const strength = current ? (current.opacity ?? 1) : 1;
  const photo = (imageId?: string, src = ''): CardBackground =>
    imageId ? { kind: 'photo', imageId, src, opacity } : { kind: 'photo', src: '', opacity };

  const brand = settings.brandColor;
  const swatches = [
    { label: '브랜드색', color: brand },
    { label: '연회색', color: '#F4F5F7' },
    { label: '흰색', color: '#FFFFFF' },
    { label: '검정', color: '#111111' },
    { label: '연한 브랜드색', color: mix(brand, '#FFFFFF', 0.9) },
  ];
  const custom =
    current?.kind === 'color' &&
    !swatches.some((swatch) => same(current, { kind: 'color', color: swatch.color }))
      ? current.color
      : null;

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files ?? [])].filter((file) => file.type.startsWith('image/'));
    event.target.value = '';
    if (files.length > 0) {
      onUpload(files);
    }
  };

  const ring = (on: boolean) =>
    on ? 'ring-2 ring-blue-600 ring-offset-1' : 'ring-1 ring-gray-200 hover:ring-blue-300';
  const heading = 'text-xs font-bold text-gray-500';

  return (
    <Drawer title="배경">
      <label className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-sm font-bold">
        모든 장에 같이 적용
        <input
          type="checkbox"
          role="switch"
          checked={all}
          onChange={(event) => setAll(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={`relative h-5 w-9 rounded-full transition-colors ${all ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 size-4 rounded-full bg-white transition-all ${all ? 'right-0.5' : 'left-0.5'}`}
          />
        </span>
      </label>
      <p className="text-xs text-gray-500">
        {all ? '고른 배경을 모든 장에 깝니다.' : `${slideName} 장에만 깝니다.`}
      </p>

      {overridden ? (
        <div className="flex flex-col gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          <p>
            시안 배경 대신 고른 배경을 쓰는 중입니다. 템플릿을 다시 고르면 고른 배경은 지워지고 그
            템플릿 배경으로 바뀝니다.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClear}
              className="rounded-md bg-white px-2 py-1 font-bold ring-1 ring-amber-200 hover:bg-amber-100"
            >
              배경 덮어쓰기 지우기
            </button>
            {!all && slideBackground ? (
              <button
                type="button"
                onClick={() => onChange(null, false)}
                className="rounded-md bg-white px-2 py-1 ring-1 ring-amber-200 hover:bg-amber-100"
              >
                이 장만 지우기
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <h3 className={heading}>단색</h3>
      <div className="grid grid-cols-6 gap-1.5">
        {swatches.map((swatch) => (
          <button
            key={swatch.label}
            type="button"
            aria-label={swatch.label}
            title={swatch.label}
            aria-pressed={same(current, { kind: 'color', color: swatch.color })}
            onClick={() => pick({ kind: 'color', color: swatch.color })}
            style={{ background: swatch.color }}
            className={`aspect-square rounded-lg ${ring(same(current, { kind: 'color', color: swatch.color }))}`}
          />
        ))}
        <label
          title="색 고르기"
          className={`relative aspect-square cursor-pointer overflow-hidden rounded-lg ${ring(Boolean(custom))}`}
          style={{
            background: custom ?? 'conic-gradient(#EF4444,#F59E0B,#10B981,#3B82F6,#8B5CF6,#EF4444)',
          }}
        >
          <input
            type="color"
            aria-label="색 고르기"
            value={custom ?? brand}
            onChange={(event) =>
              pick({ kind: 'color', color: event.target.value.toUpperCase() }, 'background-color')
            }
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>

      <h3 className={heading}>무늬 · 기존 시안에서 가져옴</h3>
      <div className="grid grid-cols-3 gap-2">
        {BACKGROUND_PATTERNS.map((pattern) => {
          const on = same(current, { kind: 'pattern', pattern: pattern.id });
          return (
            <button
              key={pattern.id}
              type="button"
              aria-pressed={on}
              onClick={() => pick({ kind: 'pattern', pattern: pattern.id })}
              className={`flex flex-col gap-1 rounded-lg bg-white p-1 ${ring(on)}`}
            >
              <span
                className="block aspect-[4/5] w-full rounded"
                style={patternStyle(pattern.id, settings)}
              />
              <span className="text-[11px] text-gray-700">{pattern.label}</span>
            </button>
          );
        })}
      </div>

      <h3 className={heading}>사진</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!settings.photo}
          aria-pressed={same(current, photo())}
          onClick={() => pick(photo())}
          className={`flex h-16 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-[11px] text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 ${ring(same(current, photo()))}`}
          style={
            settings.photo
              ? {
                  backgroundImage: `url(${settings.photo.dataUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <span className="rounded bg-white/85 px-1.5 py-0.5">
            {settings.photo ? '공고 대표 이미지' : '대표 이미지 없음'}
          </span>
        </button>
        <label className="flex h-16 cursor-pointer items-center justify-center rounded-lg border-[1.5px] border-dashed border-gray-300 text-[11px] text-gray-700 hover:bg-gray-50">
          사진 올리기
          <input type="file" accept="image/*" multiple className="hidden" onChange={upload} />
        </label>
        {uploads.map((id) => {
          const src = images[id];
          const on = same(current, photo(id));
          return src ? (
            <button
              key={id}
              type="button"
              aria-label="올린 이미지를 배경으로"
              aria-pressed={on}
              onClick={() => pick(photo(id, src))}
              className={`flex h-16 items-center justify-center overflow-hidden rounded-lg bg-gray-100 ${ring(on)}`}
            >
              <img src={src} alt="" className="size-full object-cover" />
            </button>
          ) : null;
        })}
      </div>
      <label className="flex items-center gap-2 text-xs">
        <span className="w-11 text-gray-600">진하기</span>
        <input
          type="range"
          aria-label="배경 진하기"
          min={0.1}
          max={1}
          step={0.05}
          value={strength}
          disabled={!current}
          onChange={(event) =>
            current &&
            pick({ ...current, opacity: Number(event.target.value) }, 'background-opacity')
          }
          className="flex-1 disabled:opacity-40"
        />
        <span className="w-9 text-right text-gray-600">{Math.round(strength * 100)}%</span>
      </label>
    </Drawer>
  );
}
