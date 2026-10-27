'use client';

import { type ChangeEvent, type ReactNode, useId, useState } from 'react';
import { Button, Input, Tabs, Toggle } from '@ogonggo/ui';
import {
  type BrandMarkId,
  type CardSettings,
  elementLabel,
  type ElementEdit,
  type ElementId,
  type HighlightPreset,
  type ImageLayer,
  LAYER_WEIGHTS,
  type Layer,
  type LogoStyle,
  type TextLayer,
  layerLabel,
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
  /** 지금 장에 보이는 섹션의 칩 제목. 섹션 요소 이름에 쓴다. */
  sectionLabels: string[];
  edit: ElementEdit | undefined;
  /** `null` 이면 템플릿 원래 배치로 돌린다. */
  onEdit: (edit: ElementEdit | null, group?: string) => void;
  onDeselect: () => void;
  /** 고른 템플릿 글자 요소를 자유 텍스트로 푼다. 글자 요소가 아니면 없다. */
  onUnfold?: () => void;
  /** 고른 자유 요소. 있으면 그 요소의 값을 보여 준다. */
  layer: Layer | undefined;
  onLayerChange: (layer: Layer, group?: string) => void;
  onLayerRemove: (layer: Layer) => void;
  /** 칠하는 순서를 옮긴다. 1 이면 앞으로(위로), -1 이면 뒤로. */
  onLayerOrder: (layer: Layer, step: number) => void;
  /** AI 탭 내용(`AssistantPanel`). */
  assistant: ReactNode;
}

type PanelTab = 'properties' | 'ai';

const PANEL_TABS: { value: PanelTab; label: string }[] = [
  { value: 'properties', label: '속성' },
  { value: 'ai', label: 'AI' },
];

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
const isBodyElement = (id: ElementId) =>
  id === 'sectionsPanel' || id === 'note' || id.startsWith('section-');

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
  label,
  edit,
  onEdit,
  onDeselect,
  onUnfold,
  settings,
  onSettingsChange,
}: {
  id: ElementId;
  label: string;
  edit: ElementEdit;
  onEdit: (edit: ElementEdit | null, group?: string) => void;
  onDeselect: () => void;
  onUnfold?: () => void;
  settings: CardSettings;
  onSettingsChange: (patch: Partial<CardSettings>) => void;
}) {
  const text = HEADLINE_ELEMENTS.includes(id)
    ? (['headline'] as const)
    : isBodyElement(id)
      ? (['body'] as const)
      : null;
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{label}</h2>
        <Button type="button" size="sm" variant="ghost" onClick={onDeselect}>
          선택 해제
        </Button>
      </div>
      <p className="-mt-2 text-xs text-gray-500">
        캔버스에서 끌어 옮기고 모서리로 크기를 바꿉니다. 방향키로 1px, Shift 와 함께 10px 씩
        옮깁니다. 같은 자리를 다시 누르면 안쪽 요소를, Esc 는 바깥 요소를 고릅니다.
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

      {onUnfold ? (
        <div className="flex flex-col gap-2 border-t border-gray-100 pt-3">
          <Button type="button" size="sm" variant="secondary" onClick={onUnfold}>
            자유 텍스트로 풀기
          </Button>
          <p className="text-xs text-gray-500">
            지금 보이는 글자·자리·크기·색으로 글자 요소를 만들고 이 요소는 숨깁니다. 푼 뒤로는 왼쪽
            문구 칸과 연결이 끊기고, 강조 상자 모양은 사라집니다.
          </p>
        </div>
      ) : null}
    </section>
  );
}

const ALIGNS: { value: TextLayer['align']; label: string }[] = [
  { value: 'left', label: '왼쪽' },
  { value: 'center', label: '가운데' },
  { value: 'right', label: '오른쪽' },
];

const WEIGHTS = LAYER_WEIGHTS.map((weight) => ({ value: String(weight), label: String(weight) }));

/** 고른 자유 요소의 값. 글자는 크기·굵기·색·정렬·줄 간격, 이미지는 투명도·모서리. 둘 다 자리와 크기, 순서. */
function LayerProperties({
  layer,
  onChange,
  onRemove,
  onOrder,
  onDeselect,
}: {
  layer: Layer;
  onChange: (layer: Layer, group?: string) => void;
  onRemove: (layer: Layer) => void;
  onOrder: (layer: Layer, step: number) => void;
  onDeselect: () => void;
}) {
  const setText = (patch: Partial<TextLayer>, group: string) =>
    layer.kind === 'text' && onChange({ ...layer, ...patch }, `${group}:${layer.id}`);
  const setImage = (patch: Partial<ImageLayer>, group: string) =>
    layer.kind === 'image' && onChange({ ...layer, ...patch }, `${group}:${layer.id}`);
  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">{layerLabel(layer)}</h2>
        <Button type="button" size="sm" variant="ghost" onClick={onDeselect}>
          선택 해제
        </Button>
      </div>
      <p className="-mt-2 text-xs text-gray-500">
        {layer.kind === 'text'
          ? '캔버스에서 두 번 누르면 글자를 바로 고칩니다. 모서리로 폭을 바꾸면 줄이 다시 나뉩니다.'
          : '모서리로 비율을 지키며 크기를 바꿉니다.'}{' '}
        Ctrl+C·Ctrl+V 로 복사, Ctrl+D 로 복제, Delete 로 지웁니다.
      </p>

      {layer.kind === 'text' ? (
        <div className="flex flex-col gap-3">
          <OffsetField
            label="글자 크기(px)"
            value={layer.fontSize}
            onChange={(fontSize) => setText({ fontSize: Math.max(8, fontSize) }, 'fontSize')}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">굵기</span>
            <Segmented
              label="굵기"
              options={WEIGHTS}
              value={String(layer.fontWeight)}
              onChange={(weight) => setText({ fontWeight: Number(weight) }, 'fontWeight')}
            />
          </div>
          <ColorField
            label="글자 색"
            value={layer.color}
            onChange={(color) => setText({ color }, 'color')}
          />
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-700">정렬</span>
            <Segmented
              label="정렬"
              options={ALIGNS}
              value={layer.align}
              onChange={(align) => setText({ align }, 'align')}
            />
          </div>
          <PercentSlider
            label="줄 간격"
            value={layer.lineHeight}
            min={80}
            max={250}
            onChange={(lineHeight) => setText({ lineHeight }, 'lineHeight')}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <PercentSlider
            label="투명도"
            value={layer.opacity}
            min={0}
            max={100}
            onChange={(opacity) => setImage({ opacity }, 'opacity')}
          />
          <OffsetField
            label="모서리 둥글기(px)"
            value={layer.radius}
            onChange={(radius) => setImage({ radius: Math.max(0, radius) }, 'radius')}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
        <OffsetField
          label="X(px)"
          value={layer.x}
          onChange={(x) => onChange({ ...layer, x }, `offset:${layer.id}`)}
        />
        <OffsetField
          label="Y(px)"
          value={layer.y}
          onChange={(y) => onChange({ ...layer, y }, `offset:${layer.id}`)}
        />
        <OffsetField
          label="폭(px)"
          value={layer.width}
          onChange={(width) =>
            onChange({ ...layer, width: Math.max(20, width) }, `size:${layer.id}`)
          }
        />
        {layer.kind === 'image' ? (
          <OffsetField
            label="높이(px)"
            value={layer.height}
            onChange={(height) => setImage({ height: Math.max(1, height) }, 'size')}
          />
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <span className="flex gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => onOrder(layer, 1)}>
            앞으로
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => onOrder(layer, -1)}>
            뒤로
          </Button>
        </span>
        <Button type="button" size="sm" variant="ghost" onClick={() => onRemove(layer)}>
          지우기
        </Button>
      </div>
    </section>
  );
}

/**
 * 오른쪽 패널. `속성 | AI` 탭이다. AI 탭은 숨겨도 계속 그려 대화와 진행 중인 요청이 남는다.
 */
export function PropertiesPanel({ assistant, ...props }: PropertiesPanelProps) {
  const [tab, setTab] = useState<PanelTab>('properties');
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl bg-white px-2 shadow-sm">
        <Tabs items={PANEL_TABS} value={tab} onValueChange={setTab} aria-label="오른쪽 패널" />
      </div>
      {tab === 'properties' ? <Properties {...props} /> : null}
      <section hidden={tab !== 'ai'} className="rounded-2xl bg-white p-4 shadow-sm">
        {assistant}
      </section>
    </div>
  );
}

/**
 * 속성 탭. 캔버스에서 아무것도 고르지 않으면 모든 템플릿에 같이 걸리는 공통 설정을, 요소를 고르면 그
 * 요소의 값을 보여 준다.
 */
function Properties({
  settings,
  onSettingsChange,
  brandColor,
  onResetBrandColor,
  logo,
  onLogoChange,
  candidates,
  selected,
  sectionLabels,
  edit,
  onEdit,
  onDeselect,
  onUnfold,
  layer,
  onLayerChange,
  onLayerRemove,
  onLayerOrder,
}: Omit<PropertiesPanelProps, 'assistant'>) {
  if (layer) {
    return (
      <LayerProperties
        layer={layer}
        onChange={onLayerChange}
        onRemove={onLayerRemove}
        onOrder={onLayerOrder}
        onDeselect={onDeselect}
      />
    );
  }
  if (selected) {
    return (
      <ElementProperties
        id={selected}
        label={elementLabel(selected, sectionLabels)}
        edit={edit ?? NO_EDIT}
        onEdit={onEdit}
        onDeselect={onDeselect}
        onUnfold={onUnfold}
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
