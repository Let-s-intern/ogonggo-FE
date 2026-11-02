'use client';

import { useState } from 'react';
import { DECORATIONS, decorationDataUrl } from '@/lib/card/decorations';
import { CARD_ICONS, iconDataUrl } from '@/lib/card/iconSet';
import { Drawer } from '../LeftRail';

/** 요소 서랍의 로고 하나. `src` 가 없으면 넣을 수 없다(공고 로고가 없을 때). */
export interface LogoItem {
  label: string;
  src: string | undefined;
}

/**
 * 요소 서랍. 로고, 손그림 꾸미기(밑줄·동그라미·별표 등), 아이콘이다. 누르면 보고 있는 장 가운데에 이미지
 * 요소로 넣는다 — 템플릿의 로고 자리와 따로 옮기고 키운다. 위에서 고른 색으로 꾸미기·아이콘을 칠한다.
 */
export function ElementsDrawer({
  logos,
  brandColor,
  onAdd,
}: {
  logos: LogoItem[];
  brandColor: string;
  onAdd: (src: string) => void;
}) {
  const [color, setColor] = useState('#111111');
  const [query, setQuery] = useState('');
  const swatches = [
    { label: '검정', value: '#111111' },
    { label: '흰색', value: '#FFFFFF' },
    { label: '브랜드색', value: brandColor },
  ];
  const words = query.trim();
  const match = (label: string) => !words || label.includes(words);
  const icons = CARD_ICONS.filter((icon) => match(icon.label));
  const decorations = DECORATIONS.filter((item) => match(item.label));
  // 흰색으로 칠한 것은 흰 칸에서 보이지 않으므로 어두운 칸에 그린다.
  const light = color.toUpperCase() === '#FFFFFF';
  const cell = `flex items-center justify-center rounded-lg p-2 ${
    light ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
  }`;

  return (
    <Drawer title="요소">
      <p className="text-xs font-bold text-gray-500">로고</p>
      <div className="grid grid-cols-3 gap-2">
        {logos.map((logo) => (
          <button
            key={logo.label}
            type="button"
            disabled={!logo.src}
            title={logo.src ? undefined : '공고 로고가 없습니다'}
            onClick={() => logo.src && onAdd(logo.src)}
            className="flex flex-col items-center gap-1.5 rounded-lg bg-gray-100 p-2 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-40"
          >
            <span className="flex h-10 w-full items-center justify-center">
              {logo.src ? (
                <img src={logo.src} alt="" className="max-h-10 max-w-full object-contain" />
              ) : null}
            </span>
            {logo.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-lg bg-gray-50 p-2">
        <p className="text-xs font-bold text-gray-500">색 (꾸미기·아이콘)</p>
        <div className="flex items-center gap-2">
          {swatches.map((swatch) => (
            <button
              key={swatch.label}
              type="button"
              aria-label={`색 ${swatch.label}`}
              aria-pressed={color === swatch.value}
              title={swatch.label}
              onClick={() => setColor(swatch.value)}
              className={`size-7 rounded-full border border-gray-300 ${
                color === swatch.value ? 'ring-2 ring-blue-500 ring-offset-1' : ''
              }`}
              style={{ background: swatch.value }}
            />
          ))}
          <label className="flex items-center gap-1 text-xs text-gray-600">
            직접
            <input
              type="color"
              aria-label="색 직접 고르기"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="size-7 cursor-pointer rounded border border-gray-300 bg-white p-0"
            />
          </label>
        </div>
        <input
          aria-label="요소 찾기"
          placeholder="찾기 (예: 밑줄, 별표, 동그라미, 일정)"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm"
        />
      </div>

      {decorations.length > 0 ? (
        <>
          <p className="text-xs font-bold text-gray-500">꾸미기</p>
          <div className="grid grid-cols-4 gap-1.5">
            {decorations.map((item) => {
              const src = decorationDataUrl(item, color);
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  aria-label={`꾸미기 ${item.label}`}
                  onClick={() => onAdd(src)}
                  className={`${cell} aspect-square`}
                >
                  <img src={src} alt="" className="max-h-8 max-w-full object-contain" />
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {icons.length > 0 ? (
        <>
          <p className="text-xs font-bold text-gray-500">아이콘</p>
          <div className="grid grid-cols-5 gap-1.5">
            {icons.map((icon) => {
              const src = iconDataUrl(icon, color);
              return (
                <button
                  key={icon.id}
                  type="button"
                  title={icon.label}
                  aria-label={`아이콘 ${icon.label}${icon.kind === 'filled' ? ' 채움' : ''}`}
                  onClick={() => onAdd(src)}
                  className={`${cell} aspect-square`}
                >
                  <img src={src} alt="" className="size-6" />
                </button>
              );
            })}
          </div>
        </>
      ) : null}

      {decorations.length + icons.length === 0 ? (
        <p className="text-xs text-gray-500">찾는 요소가 없어요.</p>
      ) : null}
      <p className="text-xs text-gray-400">아이콘: Tabler Icons (MIT)</p>
    </Drawer>
  );
}
