'use client';

import { useState } from 'react';
import { Field, Input, cn } from '@ogonggo/ui';
import type { AdPlacement, AdPlacementKey } from '@/entities/advertisement';
import { uploadImage } from '@/shared/lib/uploadImage';
import type { AdApplicationFormValues } from '../model/form';
import { BANNED_HEADLINE, HEADLINE_MAX, HEADLINE_PLACEMENTS, TAG_MAX } from '../model/creative';
import { TagInput } from './TagInput';

export interface StepCreativeProps {
  values: AdApplicationFormValues;
  patch: (next: Partial<AdApplicationFormValues>) => void;
  placements: Map<AdPlacementKey, AdPlacement>;
}

/**
 * 4단계 소재 · 역량 태그(시안 B-04). 소재는 오공고 제작 요청(48시간)이 기본이고, 직접 업로드는 배너 지면이 있을 때만
 * 고를 수 있다. 해석 한 줄은 추천 카드·비슷한 공고 자리가 있을 때만 받는다. 금지 표현이 들어가면 경고하되 저장은 막지
 * 않는다(PRD `광고 신청`).
 */
export function StepCreative({ values, patch, placements }: StepCreativeProps) {
  const { creative } = values;
  const [uploading, setUploading] = useState<'pc' | 'mo' | null>(null);
  const setCreative = (next: Partial<AdApplicationFormValues['creative']>) =>
    patch({ creative: { ...creative, ...next } });
  const hasBanner = values.items.some(
    (item) => placements.get(item.placementKey)?.format === 'BANNER',
  );
  const hasHeadline = values.items.some((item) => HEADLINE_PLACEMENTS.includes(item.placementKey));
  const banned = BANNED_HEADLINE.test(creative.headline);

  const upload = async (which: 'pc' | 'mo', file: File | undefined) => {
    if (!file) return;
    setUploading(which);
    try {
      const url = await uploadImage(file);
      if (url) setCreative(which === 'pc' ? { bannerImageUrlPc: url } : { bannerImageUrlMo: url });
    } finally {
      setUploading(null);
    }
  };

  const options = [
    {
      value: 'OGONGGO_MADE' as const,
      label: '오공고 제작 요청',
      description: '48시간 안에 공고 링크만으로 제작 · 게재 전 확인 요청을 드려요',
      disabled: false,
    },
    {
      value: 'UPLOADED' as const,
      label: '직접 업로드',
      description: hasBanner
        ? '지면별 규격에 맞춰 이미지를 올려 주세요 (배너 지면)'
        : '배너 지면을 추가하면 고를 수 있어요',
      disabled: !hasBanner,
    },
  ];

  return (
    <>
      <fieldset className="flex flex-col gap-2">
        <legend className="pb-2 text-sm font-semibold text-gray-900">
          소재 준비<span className="pl-0.5 text-error">*</span>
        </legend>
        <div className="grid gap-2 md:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-2 rounded-md border border-gray-200 px-4 py-3 has-checked:border-blue-500 has-checked:bg-blue-00',
                option.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
              )}
            >
              <input
                type="radio"
                name="creative-source"
                disabled={option.disabled}
                checked={creative.source === option.value}
                onChange={() => setCreative({ source: option.value })}
                className="mt-1 accent-blue-500"
              />
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                <span className="text-xs text-gray-500">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500">
          카드·리스트·달력 지면은 로고와 공고 정보로 자동 구성돼서 업로드가 필요 없어요.
        </p>
      </fieldset>

      {creative.source === 'UPLOADED' && hasBanner ? (
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ['pc', 'PC 배너 (1200×120)', creative.bannerImageUrlPc],
              ['mo', 'MO 배너 (750×200)', creative.bannerImageUrlMo],
            ] as const
          ).map(([which, label, url]) => (
            <Field
              key={which}
              label={label}
              htmlFor={`ad-banner-${which}`}
              required={which === 'pc'}
              hint="JPG · PNG"
            >
              <div className="flex flex-col gap-2">
                <input
                  id={`ad-banner-${which}`}
                  type="file"
                  accept="image/jpeg,image/png"
                  disabled={uploading !== null}
                  onChange={(event) => void upload(which, event.target.files?.[0])}
                  className="text-sm"
                />
                {url ? (
                  <img
                    src={url}
                    alt={`${label} 미리보기`}
                    className="h-16 w-full rounded-xs border border-gray-200 object-cover"
                  />
                ) : null}
                {uploading === which ? (
                  <span className="text-xs text-gray-500">올리는 중...</span>
                ) : null}
              </div>
            </Field>
          ))}
        </div>
      ) : null}

      {hasHeadline ? (
        <Field
          label={`해석 한 줄 (${HEADLINE_MAX}자, 선택 — 비우면 오공고가 작성해요)`}
          htmlFor="ad-headline"
          hint={`${creative.headline.length}/${HEADLINE_MAX} · 추천 카드·비슷한 공고 자리에 공고와 함께 보여요`}
          error={
            banned
              ? "'취업추천·취업지원' 표현이나 연락처는 쓸 수 없어요 (저장은 가능, 검수에서 반려될 수 있어요)"
              : undefined
          }
        >
          <Input
            id="ad-headline"
            value={creative.headline}
            maxLength={HEADLINE_MAX}
            aria-invalid={banned || undefined}
            onChange={(event) => setCreative({ headline: event.target.value })}
            placeholder="예) 첫 PO 커리어를 시작하고 싶다면"
          />
        </Field>
      ) : null}

      <Field label={`필수 역량 키워드 (최대 ${TAG_MAX})`} htmlFor="ad-skill-tags" required>
        <TagInput
          id="ad-skill-tags"
          tags={creative.skillTags}
          onChange={(skillTags) => setCreative({ skillTags })}
          max={TAG_MAX}
          placeholder="입력 후 Enter · 예: 문제 정의"
        />
      </Field>
      <Field label={`상세 수행 Task (최대 ${TAG_MAX})`} htmlFor="ad-task-tags" required>
        <TagInput
          id="ad-task-tags"
          tags={creative.taskTags}
          onChange={(taskTags) => setCreative({ taskTags })}
          max={TAG_MAX}
          placeholder="입력 후 Enter · 예: MVP 기획"
        />
      </Field>
    </>
  );
}
