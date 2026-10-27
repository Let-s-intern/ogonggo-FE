'use client';

import { type KeyboardEvent, useRef } from 'react';
import { Input, Textarea } from '@ogonggo/ui';
import { visibleSectionIndices } from '@/lib/card/render/slides';
import type { CardContent, ElementId, VariantId } from '@/lib/card/types';

/** 템플릿 글자 요소가 고치는 문구 칸. */
export interface TemplateTextField {
  label: string;
  value: string;
  multiline: boolean;
  apply: (content: CardContent, value: string) => CardContent;
  /** 섹션 칸이면 문구의 몇 번째 섹션인지. 고치는 동안 섹션이 비어 번호가 밀려도 같은 섹션을 고친다. */
  sectionIndex?: number;
}

const SECTION_PART = /^section-(\d+)-(chip|list)$/;

/**
 * 캔버스의 템플릿 글자 요소가 고치는 문구 칸. 왼쪽 문구 칸과 같은 값이다. 섹션 칩은 섹션 제목, 섹션 목록은
 * 줄마다 한 항목이다. 글자가 아닌 요소(로고, 묶음)는 `null`. `sectionIndex` 를 주면 그 섹션을 고친다.
 */
export function templateTextField(
  id: ElementId,
  content: CardContent,
  variant: VariantId,
  slide: number,
  sectionIndex?: number,
): TemplateTextField | null {
  const plain = (
    key: 'badge' | 'roleTitle' | 'headline' | 'note' | 'ctaHeadline' | 'ctaSub',
    label: string,
    multiline: boolean,
  ): TemplateTextField => ({
    label,
    value: content[key],
    multiline,
    apply: (current, value) => ({ ...current, [key]: value }),
  });
  switch (id) {
    case 'badge':
      return plain('badge', '뱃지', false);
    case 'roleTitle':
      return plain('roleTitle', '직무명', false);
    case 'headline':
      return plain('headline', '제목 (1·2장)', true);
    case 'note':
      return plain('note', '1장 아래 안내', true);
    case 'ctaHeadline':
      return plain('ctaHeadline', '3장 큰 문구', true);
    case 'ctaSub':
      return plain('ctaSub', '3장 작은 문구', true);
  }
  const match = SECTION_PART.exec(id);
  const key = slide === 0 ? 'summarySections' : 'detailSections';
  const index = !match
    ? -1
    : (sectionIndex ?? visibleSectionIndices({ variant, content }, slide)[Number(match[1]) - 1]);
  const section = index === undefined || index < 0 ? undefined : content[key][index];
  if (!match || !section) {
    return null;
  }
  const replace = (current: CardContent, next: Partial<typeof section>) => ({
    ...current,
    [key]: current[key].map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...next } : item,
    ),
  });
  return match[2] === 'chip'
    ? {
        label: '섹션 제목',
        sectionIndex: index,
        value: section.label,
        multiline: false,
        apply: (current, value) => replace(current, { label: value }),
      }
    : {
        label: `${section.label} 항목 (한 줄에 하나)`,
        sectionIndex: index,
        value: section.items.join('\n'),
        multiline: true,
        apply: (current, value) => replace(current, { items: value.split('\n') }),
      };
}

/**
 * 캔버스에서 템플릿 글자 요소를 두 번 누르면 요소 아래에 뜨는 입력 창. 치는 대로 문구가 바뀐다. Enter 나
 * 바깥을 누르면 닫히고, Esc 는 연 때의 문구로 되돌리고 닫는다. 여러 줄 칸은 Shift+Enter 가 줄바꿈이다.
 */
export function TextPopover({
  field,
  content,
  onChange,
  onClose,
  style,
}: {
  field: TemplateTextField;
  content: CardContent;
  onChange: (content: CardContent) => void;
  onClose: () => void;
  style: { left: number; top: number; width: number };
}) {
  const original = useRef(content);
  const closed = useRef(false);
  const close = (cancel: boolean) => {
    if (closed.current) {
      return;
    }
    closed.current = true;
    if (cancel) {
      onChange(original.current);
    }
    onClose();
  };
  const common = {
    'aria-label': `${field.label} 고치기`,
    autoFocus: true,
    value: field.value,
    onBlur: () => close(false),
    onKeyDown: (event: KeyboardEvent) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        close(false);
      }
    },
  };
  return (
    <div
      className="absolute z-10 flex flex-col gap-1 rounded-xl bg-white p-2 shadow-lg"
      style={style}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="text-xs font-semibold text-gray-700">{field.label}</span>
      {field.multiline ? (
        <Textarea
          {...common}
          rows={Math.min(6, Math.max(2, field.value.split('\n').length))}
          className="text-sm"
          onChange={(event) => onChange(field.apply(content, event.target.value))}
        />
      ) : (
        <Input
          {...common}
          className="h-9 text-sm"
          onChange={(event) => onChange(field.apply(content, event.target.value))}
        />
      )}
      <span className="text-xs text-gray-500">
        {field.multiline
          ? 'Enter 로 닫고 Shift+Enter 로 줄을 바꿉니다. Esc 는 취소입니다.'
          : 'Enter 로 닫고 Esc 로 취소합니다.'}
      </span>
    </div>
  );
}
