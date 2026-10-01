'use client';

import { type ChangeEvent, useId } from 'react';
import { Button } from '@ogonggo/ui';
import type { BackgroundKind, CardTheme } from '@/lib/card/types';
import { fileToDataUrl } from '@/lib/client/image';

interface ThemePanelProps {
  theme: CardTheme;
  onChange: (theme: CardTheme) => void;
  /** 로고에서 뽑은 대표 색. 없으면 로고가 흑백이었거나 로고가 없다. */
  brandColor: string | null;
  onResetToBrand: () => void;
  logoDataUrl?: string;
  onLogoChange: (dataUrl: string | undefined) => void;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-2">
      <label htmlFor={id} className="text-sm text-gray-700">
        {label}
      </label>
      <span className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="size-8 cursor-pointer rounded border border-gray-200 bg-transparent"
        />
        <input
          aria-label={`${label} 값`}
          value={value}
          onChange={(event) => {
            const next = event.target.value.trim();
            if (/^#[0-9a-fA-F]{6}$/.test(next)) {
              onChange(next.toUpperCase());
            }
          }}
          className="h-8 w-24 rounded border border-gray-200 px-2 font-mono text-xs"
        />
      </span>
    </div>
  );
}

const KINDS: { value: BackgroundKind; label: string }[] = [
  { value: 'solid', label: '단색' },
  { value: 'gradient', label: '그라데이션' },
  { value: 'image', label: '이미지' },
];

/** 배경과 색 편집. 처음 값은 로고 색에서 고르고, 전부 사람이 바꿀 수 있다. */
export function ThemePanel({
  theme,
  onChange,
  brandColor,
  onResetToBrand,
  logoDataUrl,
  onLogoChange,
}: ThemePanelProps) {
  const { background } = theme;
  const setBackground = (patch: Partial<CardTheme['background']>) =>
    onChange({ ...theme, background: { ...background, ...patch } });

  const upload =
    (apply: (dataUrl: string) => void) => async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file) {
        apply(await fileToDataUrl(file));
      }
    };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">배경·색</h2>
        <Button type="button" size="sm" variant="ghost" onClick={onResetToBrand}>
          로고 색으로 다시 맞추기
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        {brandColor
          ? `로고에서 뽑은 색: ${brandColor}`
          : '로고에서 색을 뽑지 못해 기본 민트로 시작했어요.'}
      </p>

      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {KINDS.map((kind) => (
          <button
            key={kind.value}
            type="button"
            onClick={() => setBackground({ kind: kind.value })}
            className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
              background.kind === kind.value ? 'bg-white shadow-sm' : 'text-gray-500'
            }`}
          >
            {kind.label}
          </button>
        ))}
      </div>

      <ColorField
        label={background.kind === 'gradient' ? '위쪽 색' : '바탕색'}
        value={background.color}
        onChange={(color) => setBackground({ color })}
      />
      {background.kind === 'gradient' ? (
        <ColorField
          label="아래쪽 색"
          value={background.color2}
          onChange={(color2) => setBackground({ color2 })}
        />
      ) : null}
      {background.kind === 'image' ? (
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-gray-300 py-3 text-sm text-gray-600 hover:bg-gray-50">
            {background.imageDataUrl ? '배경 이미지 바꾸기' : '배경 이미지 올리기'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={upload((imageDataUrl) => setBackground({ imageDataUrl }))}
            />
          </label>
          <label className="flex items-center justify-between gap-2 text-sm text-gray-700">
            이미지 진하기
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.05}
              value={background.imageOpacity}
              onChange={(event) => setBackground({ imageOpacity: Number(event.target.value) })}
            />
          </label>
          <p className="text-xs text-gray-500">
            이미지는 바탕색 위에 얹습니다. 흐리게 두면 워터마크처럼 보입니다.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        <ColorField
          label="글자색"
          value={theme.textColor}
          onChange={(textColor) => onChange({ ...theme, textColor })}
        />
        <ColorField
          label="상자·칩 바탕"
          value={theme.boxColor}
          onChange={(boxColor) => onChange({ ...theme, boxColor })}
        />
        <ColorField
          label="상자·칩 글자"
          value={theme.boxTextColor}
          onChange={(boxTextColor) => onChange({ ...theme, boxTextColor })}
        />
        <ColorField
          label="강조색 (~단어~)"
          value={theme.accentColor}
          onChange={(accentColor) => onChange({ ...theme, accentColor })}
        />
      </div>

      <label className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-sm text-gray-700">
        로고 뒤에 흰 판 깔기
        <input
          type="checkbox"
          checked={theme.logoPlate}
          onChange={(event) => onChange({ ...theme, logoPlate: event.target.checked })}
          className="size-4"
        />
      </label>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-gray-700">기업 로고</span>
        <span className="flex items-center gap-2">
          {logoDataUrl ? (
            <img src={logoDataUrl} alt="" className="h-8 max-w-24 object-contain" />
          ) : (
            <span className="text-xs text-gray-400">없음 (회사명을 글자로)</span>
          )}
          <label className="cursor-pointer rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
            바꾸기
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={upload((dataUrl) => onLogoChange(dataUrl))}
            />
          </label>
          {logoDataUrl ? (
            <button
              type="button"
              className="text-xs text-gray-500 underline"
              onClick={() => onLogoChange(undefined)}
            >
              빼기
            </button>
          ) : null}
        </span>
      </div>
    </section>
  );
}
