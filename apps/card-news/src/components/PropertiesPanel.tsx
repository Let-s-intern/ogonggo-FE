'use client';

import { type ChangeEvent, useId } from 'react';
import { Button, Input, Toggle } from '@ogonggo/ui';
import {
  type BrandMarkId,
  type CardSettings,
  ELEMENT_LABELS,
  type ElementEdit,
  type ElementId,
  type HighlightPreset,
  type LogoStyle,
} from '@/lib/card/types';
import { textScale } from '@/lib/card/layout';
import { fileToDataUrl } from '@/lib/client/image';
import { PHOTO_OPACITY } from '@/lib/client/useCardEditor';
import type { ImageCandidates } from '@/lib/server/images';
import { ColorField, Segmented } from './fields';
import { ImagePicker } from './ImagePicker';

interface PropertiesPanelProps {
  settings: CardSettings;
  onSettingsChange: (patch: Partial<CardSettings>) => void;
  /** 로고에서 뽑은 대표 색. 없으면 로고가 흑백이었거나 로고가 없다. */
  brandColor: string | null;
  onResetBrandColor: () => void;
  logo?: string;
  onLogoChange: (logo: string | undefined) => void;
  candidates: ImageCandidates | null;
  /** 캔버스에서 고른 요소. 없으면 공통 설정을 보여 준다. */
  selected: ElementId | null;
  edit: ElementEdit | undefined;
  /** `null` 이면 템플릿 원래 배치로 돌린다. */
  onEdit: (edit: ElementEdit | null, group?: string) => void;
  onDeselect: () => void;
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

const BRAND_MARKS: { value: BrandMarkId; label: string }[] = [
  { value: 'ogonggo', label: '오공고' },
  { value: 'letscareer', label: '렛츠커리어' },
];

/** 제목 배율이 걸리는 요소와 본문 배율이 걸리는 요소. 고르면 그 글자 크기 슬라이더가 보인다. */
const HEADLINE_ELEMENTS: ElementId[] = ['headline', 'roleTitle', 'ctaHeadline', 'ctaSub'];
const BODY_ELEMENTS: ElementId[] = ['sections'];

const NO_EDIT: ElementEdit = { dx: 0, dy: 0, scale: 1 };

/** % 슬라이더. 값은 배율(1 = 100%)로 주고받는다. */
function PercentSlider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const percent = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm text-gray-700">
          {label}
        </label>
        <span className="text-sm font-semibold tabular-nums text-gray-900">{percent}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={percent}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="w-full accent-blue-500"
      />
    </div>
  );
}

function TextScaleSliders({
  settings,
  onSettingsChange,
  show = ['headline', 'body'],
}: {
  settings: CardSettings;
  onSettingsChange: (patch: Partial<CardSettings>) => void;
  show?: ('headline' | 'body')[];
}) {
  return (
    <>
      {show.includes('headline') ? (
        <PercentSlider
          label="제목 글자 크기"
          value={textScale(settings.headlineScale)}
          min={70}
          max={150}
          onChange={(headlineScale) => onSettingsChange({ headlineScale })}
        />
      ) : null}
      {show.includes('body') ? (
        <PercentSlider
          label="본문 글자 크기"
          value={textScale(settings.bodyScale)}
          min={70}
          max={150}
          onChange={(bodyScale) => onSettingsChange({ bodyScale })}
        />
      ) : null}
    </>
  );
}

/** 이동값 칸. 숫자가 아니면 무시한다. */
function OffsetField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm text-gray-700">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        className="h-9 text-sm"
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (event.target.value !== '' && Number.isFinite(next)) {
            onChange(Math.round(next));
          }
        }}
      />
    </div>
  );
}

/** 고른 요소의 값. 크기, 이동, 숨기기, 처음으로. 제목·목록이면 그 글자 크기도. */
function ElementProperties({
  id,
  edit,
  onEdit,
  onDeselect,
  settings,
  onSettingsChange,
}: {
  id: ElementId;
  edit: ElementEdit;
  onEdit: (edit: ElementEdit | null, group?: string) => void;
  onDeselect: () => void;
  settings: CardSettings;
  onSettingsChange: (patch: Partial<CardSettings>) => void;
}) {
  const text = HEADLINE_ELEMENTS.includes(id)
    ? (['headline'] as const)
    : BODY_ELEMENTS.includes(id)
      ? (['body'] as const)
      : null;
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{ELEMENT_LABELS[id]}</h2>
        <Button type="button" size="sm" variant="ghost" onClick={onDeselect}>
          선택 해제
        </Button>
      </div>
      <p className="-mt-2 text-xs text-gray-500">
        캔버스에서 끌어 옮기고 모서리로 크기를 바꿉니다. 방향키로 1px, Shift 와 함께 10px 씩
        옮깁니다.
      </p>

      {text ? (
        <div className="flex flex-col gap-3">
          <TextScaleSliders
            settings={settings}
            onSettingsChange={onSettingsChange}
            show={[...text]}
          />
          <p className="-mt-2 text-xs text-gray-500">글자 크기는 모든 장에 같이 걸립니다.</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
        <PercentSlider
          label="크기"
          value={edit.scale}
          min={20}
          max={300}
          onChange={(scale) => onEdit({ ...edit, scale }, `scale:${id}`)}
        />
        <div className="grid grid-cols-2 gap-2">
          <OffsetField
            label="X 이동(px)"
            value={edit.dx}
            onChange={(dx) => onEdit({ ...edit, dx }, `offset:${id}`)}
          />
          <OffsetField
            label="Y 이동(px)"
            value={edit.dy}
            onChange={(dy) => onEdit({ ...edit, dy }, `offset:${id}`)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <Toggle
          checked={Boolean(edit.hidden)}
          onChange={(hidden) => onEdit({ ...edit, hidden: hidden || undefined })}
          label="숨기기"
        />
        <Button type="button" size="sm" variant="secondary" onClick={() => onEdit(null)}>
          처음으로
        </Button>
      </div>
    </section>
  );
}

/**
 * 오른쪽 속성 패널. 캔버스에서 아무것도 고르지 않으면 모든 템플릿에 같이 걸리는 공통 설정을, 요소를
 * 고르면 그 요소의 값을 보여 준다.
 */
export function PropertiesPanel({
  settings,
  onSettingsChange,
  brandColor,
  onResetBrandColor,
  logo,
  onLogoChange,
  candidates,
  selected,
  edit,
  onEdit,
  onDeselect,
}: PropertiesPanelProps) {
  if (selected) {
    return (
      <ElementProperties
        id={selected}
        edit={edit ?? NO_EDIT}
        onEdit={onEdit}
        onDeselect={onDeselect}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    );
  }

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
        onChange={(brand) => onSettingsChange({ brandColor: brand })}
      />

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-700">강조 상자·칩 색</span>
        <Segmented
          label="강조 상자·칩 색"
          options={HIGHLIGHTS}
          value={settings.highlight}
          onChange={(highlight) => onSettingsChange({ highlight })}
        />
        {settings.highlight === 'custom' ? (
          <ColorField
            label="강조 색"
            value={settings.highlightColor}
            onChange={(highlightColor) => onSettingsChange({ highlightColor })}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 pt-3">
        <TextScaleSliders settings={settings} onSettingsChange={onSettingsChange} />
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-700">브랜드 로고</span>
        <Segmented
          label="브랜드 로고"
          options={BRAND_MARKS}
          value={settings.brandMark ?? 'ogonggo'}
          onChange={(brandMark) => onSettingsChange({ brandMark })}
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-700">회사 로고</span>
        <Segmented
          label="로고 표시"
          options={LOGO_STYLES}
          value={settings.logoStyle}
          onChange={(logoStyle) => onSettingsChange({ logoStyle })}
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
      <div className="border-t border-gray-100 pt-3">
        <ImagePicker
          label="썸네일 (썸네일 시안)"
          image={settings.photo}
          candidates={candidates?.photo ?? null}
          defaultOpacity={PHOTO_OPACITY}
          onChange={(photo) => onSettingsChange({ photo })}
        />
      </div>
    </section>
  );
}
