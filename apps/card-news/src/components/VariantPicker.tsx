'use client';

import { CARD_SIZES, type CardSpec, type VariantId } from '@/lib/card/types';
import { VARIANTS } from '@/lib/card/variants';
import { usePreviews } from '@/lib/client/usePreviews';

/**
 * 시안 고르기. 다섯 시안의 1장만 그려 나란히 보여 준다 — 다섯 장이라 설정을 바꿔도 금방 다시 그린다.
 * 하나를 누르면 그 시안만 세 장으로 편집한다.
 */
export function VariantPicker({
  specs,
  current,
  onPick,
}: {
  specs: Record<VariantId, CardSpec>;
  current: VariantId | null;
  onPick: (variant: VariantId) => void;
}) {
  const targets = VARIANTS.map((variant) => ({ spec: specs[variant.id], slide: 0 }));
  const { previews, error } = usePreviews(targets, 'post', specs);
  const { width, height } = CARD_SIZES.post;

  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-base font-bold">시안 고르기</h2>
        <p className="text-xs text-gray-500">
          마음에 드는 시안을 누르면 그 시안의 세 장을 편집하고 받습니다.
        </p>
      </div>
      {error ? (
        <p className="text-sm text-error">
          미리보기를 그리지 못했습니다. 잠시 뒤 다시 시도해 주세요.
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {VARIANTS.map((variant, index) => {
          const preview = previews[index];
          const on = current === variant.id;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onPick(variant.id)}
              aria-pressed={on}
              className="flex flex-col gap-1.5 text-left"
            >
              <span
                className={`flex w-full items-center justify-center overflow-hidden bg-gray-100 outline-offset-2 hover:outline hover:outline-2 hover:outline-blue-300 ${
                  on ? 'outline outline-3 outline-blue-500' : ''
                }`}
                style={{ aspectRatio: `${width} / ${height}` }}
              >
                {preview ? (
                  <img src={preview.url} alt="" className="size-full object-contain" />
                ) : (
                  <span className="text-xs text-gray-400">그리는 중</span>
                )}
              </span>
              <span className="text-sm font-bold">{variant.label}</span>
              <span className="text-xs text-gray-500">{variant.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
