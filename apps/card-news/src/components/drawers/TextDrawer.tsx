'use client';

import type { TextLayer } from '@/lib/card/types';
import { Drawer } from '../LeftRail';

/** 텍스트 서랍이 넣는 글 하나. */
export interface TextPreset {
  text: string;
  style: Partial<TextLayer>;
}

/** 공고 값 넣기 칩 하나. `value` 는 보고 있는 장의 공고 값이다. */
export interface JobValueChip {
  label: string;
  value: string;
  style: Partial<TextLayer>;
}

const ADD: { label: string; preset: TextPreset }[] = [
  { label: '제목 추가', preset: { text: '제목', style: { fontSize: 96, fontWeight: 900 } } },
  { label: '소제목 추가', preset: { text: '소제목', style: { fontSize: 64, fontWeight: 800 } } },
  {
    label: '본문 추가',
    preset: { text: '본문', style: { fontSize: 40, fontWeight: 500, lineHeight: 1.5 } },
  },
];

/**
 * 텍스트 서랍. 제목·소제목·본문 글자 요소, 오공고 글 스타일(강조 제목, 칩, 점 목록, 항목명 표), 공고 값
 * 넣기. 모두 보고 있는 장 가운데에 자유 글자 요소로 넣는다. 강조 제목과 칩은 지금 강조 상자·칩 색으로
 * 채운다.
 */
export function TextDrawer({
  onAdd,
  styles,
  values,
}: {
  onAdd: (preset: TextPreset) => void;
  /** 오공고 글 스타일. 강조 상자·칩 색이 들어 있어 부르는 쪽이 만든다. */
  styles: { label: string; preset: TextPreset }[];
  /** 공고가 없는 문서면 빈 배열. */
  values: JobValueChip[];
}) {
  const block =
    'rounded-lg bg-gray-100 px-3 py-2.5 text-left hover:bg-gray-200 disabled:text-gray-300';
  return (
    <Drawer title="텍스트">
      <button
        type="button"
        className={`${block} text-lg font-black`}
        onClick={() => onAdd(ADD[0]!.preset)}
      >
        {ADD[0]!.label}
      </button>
      <button
        type="button"
        className={`${block} text-base font-bold`}
        onClick={() => onAdd(ADD[1]!.preset)}
      >
        {ADD[1]!.label}
      </button>
      <button type="button" className={`${block} text-sm`} onClick={() => onAdd(ADD[2]!.preset)}>
        {ADD[2]!.label}
      </button>

      <p className="pt-2 text-xs font-bold text-gray-500">오공고 글 스타일</p>
      <div className="grid grid-cols-2 gap-2">
        {styles.map(({ label, preset }) => (
          <button
            key={label}
            type="button"
            className={`${block} flex min-h-16 items-center justify-center text-sm`}
            onClick={() => onAdd(preset)}
          >
            {preset.style.background ? (
              <span
                className="px-2 font-bold"
                style={{
                  background: preset.style.background,
                  color: preset.style.color,
                  borderRadius: preset.style.radius ? 999 : 2,
                }}
              >
                {label}
              </span>
            ) : (
              <span className="whitespace-pre-line text-xs">{label}</span>
            )}
          </button>
        ))}
      </div>

      {values.length > 0 ? (
        <>
          <p className="pt-2 text-xs font-bold text-gray-500">공고 값 넣기</p>
          <p className="text-xs text-gray-500">
            넣은 글은 공고 값과 이어져 있어 다른 공고 장에 붙이면 그 공고 값으로 바뀝니다. 글자를
            직접 고치면 연결이 끊깁니다.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {values.map((chip) => (
              <button
                key={chip.label}
                type="button"
                disabled={!chip.value}
                title={chip.value || '이 장의 공고에 값이 없습니다'}
                onClick={() => onAdd({ text: chip.value, style: chip.style })}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:text-gray-300"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </Drawer>
  );
}
