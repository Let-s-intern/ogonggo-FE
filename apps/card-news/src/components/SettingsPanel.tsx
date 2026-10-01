'use client';

import type { ChangeEvent } from 'react';
import { Button } from '@ogonggo/ui';
import type { CardSettings, HighlightPreset, LogoStyle } from '@/lib/card/types';
import { fileToDataUrl } from '@/lib/client/image';
import { ColorField, Segmented } from './fields';

interface SettingsPanelProps {
  settings: CardSettings;
  onChange: (patch: Partial<CardSettings>) => void;
  /** 로고에서 뽑은 대표 색. 없으면 로고가 흑백이었거나 로고가 없다. */
  brandColor: string | null;
  onResetBrandColor: () => void;
  logo?: string;
  onLogoChange: (logo: string | undefined) => void;
}

const HIGHLIGHTS: { value: HighlightPreset; label: string }[] = [
  { value: 'tint', label: '연한 브랜드' },
  { value: 'brand', label: '브랜드색' },
  { value: 'black', label: '검정' },
  { value: 'custom', label: '직접' },
];

const LOGO_STYLES: { value: LogoStyle; label: string }[] = [
  { value: 'auto', label: '자동' },
  { value: 'mono', label: '한 색' },
  { value: 'original', label: '원래 색' },
  { value: 'plate', label: '흰 판' },
];

/** 다섯 시안에 같이 걸리는 설정. 여기서 바꾸면 모든 시안이 같이 바뀐다. */
export function SettingsPanel({
  settings,
  onChange,
  brandColor,
  onResetBrandColor,
  logo,
  onLogoChange,
}: SettingsPanelProps) {
  const uploadLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      onLogoChange(await fileToDataUrl(file));
    }
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">공통 설정</h2>
        <Button type="button" size="sm" variant="ghost" onClick={onResetBrandColor}>
          로고 색으로 다시 맞추기
        </Button>
      </div>
      <p className="-mt-2 text-xs text-gray-500">
        {brandColor
          ? `로고에서 뽑은 색: ${brandColor}. 여기서 바꾸면 모든 시안에 같이 걸립니다.`
          : '로고에서 색을 뽑지 못해 기본 민트로 시작했어요.'}
      </p>

      <ColorField
        label="브랜드색"
        value={settings.brandColor}
        onChange={(brand) => onChange({ brandColor: brand })}
      />

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-700">강조 상자·칩 색</span>
        <Segmented
          label="강조 상자·칩 색"
          options={HIGHLIGHTS}
          value={settings.highlight}
          onChange={(highlight) => onChange({ highlight })}
        />
        {settings.highlight === 'custom' ? (
          <ColorField
            label="강조 색"
            value={settings.highlightColor}
            onChange={(highlightColor) => onChange({ highlightColor })}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-700">회사 로고</span>
        <Segmented
          label="로고 표시"
          options={LOGO_STYLES}
          value={settings.logoStyle}
          onChange={(logoStyle) => onChange({ logoStyle })}
        />
        <div className="flex items-center justify-between gap-2">
          {logo ? (
            <img src={logo} alt="" className="h-8 max-w-28 object-contain" />
          ) : (
            <span className="text-xs text-gray-400">없음 (회사명을 글자로)</span>
          )}
          <span className="flex items-center gap-2">
            <label className="cursor-pointer rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50">
              바꾸기
              <input type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            </label>
            {logo ? (
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
      </div>
    </section>
  );
}
