'use client';

import { type DragEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@ogonggo/ui';
import { MAX_SLIDES, slideLabel } from '@/lib/card/document';
import { CARD_SIZES, type CardSizeId } from '@/lib/card/types';
import { type BuiltSlide, SlideStage } from './EditorCanvas';

/** `장 추가` 메뉴 한 줄. */
export interface AddSlideOption {
  key: string;
  label: string;
  onAdd: () => void;
}

/** 썸네일 폭(px). */
const THUMB_WIDTH = 72;

/**
 * 캔버스 아래 장 목록(필름 띠). 캔버스와 같은 `buildSlide()` 결과를 작게 그린다. 눌러 고르고, 끌어 놓아
 * 순서를 바꾸고, 우클릭으로 복제·삭제한다. 끝의 `장 추가` 는 장 상한(`MAX_SLIDES`)에서 막힌다.
 *
 * 썸네일 상자의 `data-slide` 는 비서 도구가 보고 있지 않은 장의 요소를 잴 때 찾는다(`measureSlideBoxes`)
 * — 모든 장이 늘 그려져 있어야 한다.
 */
export function SlideStrip({
  slides,
  names,
  size,
  current,
  onSelect,
  onMove,
  onDuplicate,
  onRemove,
  addOptions,
}: {
  slides: BuiltSlide[];
  /** 장 이름(`slideName()`). `slides` 와 같은 순서다. */
  names: string[];
  size: CardSizeId;
  /** 보고 있는 장의 id. */
  current: string;
  onSelect: (slideId: string) => void;
  /** 장 하나를 `to` 자리(0부터)로 옮긴다. */
  onMove: (slideId: string, to: number) => void;
  onDuplicate: (slideId: string) => void;
  onRemove: (slideId: string) => void;
  addOptions: AddSlideOption[];
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ slideId: string; x: number; y: number } | null>(null);
  const [adding, setAdding] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const full = slides.length >= MAX_SLIDES;

  // 메뉴 밖을 누르거나 Esc 를 누르면 메뉴를 닫는다.
  useEffect(() => {
    if (!menu && !adding) {
      return;
    }
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !(event.target instanceof Node && rootRef.current?.contains(event.target))
      ) {
        setMenu(null);
        setAdding(false);
      }
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [menu, adding]);

  const drop = (event: DragEvent, index: number) => {
    event.preventDefault();
    if (dragging) {
      onMove(dragging, index);
    }
    setDragging(null);
    setOver(null);
  };

  const menuItem =
    'block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 disabled:text-gray-300';

  return (
    <div ref={rootRef} className="relative flex items-center gap-3">
      <div className="flex min-w-0 items-start gap-2 overflow-x-auto">
        {slides.map((built, index) => {
          const on = built.id === current;
          return (
            <button
              key={built.id}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', built.id);
                setDragging(built.id);
              }}
              onDragOver={(event) => {
                if (dragging) {
                  event.preventDefault();
                  setOver(index);
                }
              }}
              onDragLeave={() => setOver((value) => (value === index ? null : value))}
              onDrop={(event) => drop(event, index)}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              onClick={() => onSelect(built.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                const root = rootRef.current?.getBoundingClientRect();
                setAdding(false);
                setMenu({
                  slideId: built.id,
                  x: event.clientX - (root?.left ?? 0),
                  y: event.clientY - (root?.top ?? 0),
                });
              }}
              aria-pressed={on}
              aria-label={`${slideLabel(names[index] ?? '', index)}. 끌어서 순서를 바꾸고 우클릭으로 복제·삭제합니다.`}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-md p-1 ${
                over === index && dragging !== built.id
                  ? 'bg-blue-50 outline outline-2 outline-blue-300'
                  : ''
              } ${dragging === built.id ? 'opacity-40' : ''}`}
            >
              <span
                className={`pointer-events-none block overflow-hidden outline-offset-2 ${
                  on ? 'outline outline-2 outline-blue-500' : ''
                }`}
              >
                <SlideStage
                  element={built.element}
                  size={CARD_SIZES[size]}
                  width={THUMB_WIDTH}
                  slideId={built.id}
                />
              </span>
              <span
                className={`max-w-18 truncate text-xs ${on ? 'font-bold text-gray-900' : 'text-gray-500'}`}
              >
                {slideLabel(names[index] ?? '', index)}
              </span>
              {built.overflow ? (
                <span className="text-xs font-semibold text-error">넘침</span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="relative flex shrink-0 flex-col items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={full}
          onClick={() => {
            setMenu(null);
            setAdding((value) => !value);
          }}
        >
          장 추가
        </Button>
        {full ? <span className="text-xs text-gray-500">최대 {MAX_SLIDES}장</span> : null}
        {adding && !full ? (
          <div
            role="menu"
            aria-label="장 추가"
            className="absolute bottom-full right-0 z-20 mb-2 w-56 overflow-hidden rounded-lg bg-white py-1 shadow-lg"
          >
            {addOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                role="menuitem"
                className={menuItem}
                onClick={() => {
                  option.onAdd();
                  setAdding(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {menu ? (
        <div
          role="menu"
          aria-label="장 메뉴"
          className="absolute z-20 w-32 overflow-hidden rounded-lg bg-white py-1 shadow-lg"
          // 장 목록은 화면 맨 아래에 있어 메뉴를 누른 자리 위로 연다.
          style={{ left: menu.x, top: menu.y, transform: 'translateY(-100%)' }}
        >
          <button
            type="button"
            role="menuitem"
            className={menuItem}
            disabled={full}
            onClick={() => {
              onDuplicate(menu.slideId);
              setMenu(null);
            }}
          >
            복제
          </button>
          <button
            type="button"
            role="menuitem"
            className={menuItem}
            disabled={slides.length <= 1}
            onClick={() => {
              onRemove(menu.slideId);
              setMenu(null);
            }}
          >
            삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}
