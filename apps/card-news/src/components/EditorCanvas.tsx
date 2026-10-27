'use client';

import {
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { buildSlide } from '@/lib/card/render/slides';
import {
  CARD_SIZES,
  type CardSize,
  type CardSizeId,
  type CardSpec,
  ELEMENT_IDS,
  ELEMENT_LABELS,
  type ElementEdit,
  type ElementId,
  SLIDE_COUNT,
  SLIDE_LABELS,
} from '@/lib/card/types';
import type { RenderKit } from '@/lib/client/useRenderKit';

/**
 * 편집 캔버스. 서버 렌더와 같은 `buildSlide()` JSX 를 브라우저 DOM 에 1080 폭으로 그리고 화면 폭에
 * 맞게 줄인다. 끄는 동안 서버를 부르지 않는다 — 받기만 서버 PNG 다.
 *
 * 요소 상자는 렌더가 단 `data-el` 로 찾아 잰다. 그 위에 투명한 상자를 얹어 고르기·끌기·크기 핸들을
 * 받는다. 이동값은 요소가 놓인 부모 좌표(1080 폭 기준)로 바꿔 저장한다 — 3장 정사각처럼 묶음째
 * 줄인 장도 손을 따라 움직이게.
 */

export interface BuiltSlide {
  element: ReactElement;
  overflow: boolean;
}

/** 세 장을 브라우저에서 만든다. 캔버스·썸네일·넘침 경고가 같이 쓴다. */
export function useBuiltSlides(
  spec: CardSpec | null,
  size: CardSizeId,
  kit: RenderKit | null,
): BuiltSlide[] | null {
  return useMemo(
    () =>
      spec && kit
        ? Array.from({ length: SLIDE_COUNT }, (_, slide) =>
            buildSlide(spec, slide, CARD_SIZES[size], kit.measure, kit.assets),
          )
        : null,
    [spec, size, kit],
  );
}

/** 1080 폭 장 하나를 `width` 폭으로 줄여 그린다. */
function SlideStage({
  element,
  size,
  width,
  stageRef,
}: {
  element: ReactElement;
  size: CardSize;
  width: number;
  stageRef?: Ref<HTMLDivElement>;
}) {
  const scale = width / size.width;
  return (
    <div className="relative overflow-hidden" style={{ width, height: size.height * scale }}>
      <div
        ref={stageRef}
        data-card-canvas=""
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size.width,
          height: size.height,
          boxSizing: 'border-box',
          // 이미지 생성기의 기본값에 맞춘다(화면 글자 규칙을 물려받지 않게).
          lineHeight: 'normal',
          color: '#000000',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {element}
      </div>
    </div>
  );
}

interface Box {
  id: ElementId;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 캔버스에서 누르면 왼쪽 문구 칸으로 가는 요소. */
export const TEXT_ELEMENTS: ElementId[] = [
  'badge',
  'headline',
  'roleTitle',
  'sections',
  'ctaHeadline',
  'ctaSub',
];

const NO_EDIT: ElementEdit = { dx: 0, dy: 0, scale: 1 };
/** 이만큼 움직이기 전에는 끌기가 아니라 누르기다(화면 px). */
const DRAG_THRESHOLD = 3;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

type Gesture = {
  kind: 'move' | 'resize';
  id: ElementId;
  group: string;
  startX: number;
  startY: number;
  /** 요소가 놓인 부모의 화면 배율. 화면 px 를 저장값(px)으로 바꾼다. */
  factor: number;
  /** 크기 핸들 기준점(요소 가운데, 화면 좌표)과 처음 거리. */
  centerX: number;
  centerY: number;
  startDistance: number;
  edit: ElementEdit;
  moved: boolean;
};

export function EditorCanvas({
  slides,
  size,
  slide,
  edits,
  selected,
  onSelect,
  onSlideChange,
  onEdit,
  onFocusText,
}: {
  slides: BuiltSlide[];
  size: CardSizeId;
  slide: number;
  /** 이 장의 편집값. */
  edits: Partial<Record<ElementId, ElementEdit>> | undefined;
  selected: ElementId | null;
  onSelect: (id: ElementId | null) => void;
  onSlideChange: (slide: number) => void;
  onEdit: (id: ElementId, edit: ElementEdit | null, group?: string) => void;
  onFocusText: (id: ElementId) => void;
}) {
  const cardSize = CARD_SIZES[size];
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const gesture = useRef<Gesture | null>(null);
  const gestureCount = useRef(0);

  // 캔버스 폭은 칸 폭에 맞추되, 세로가 화면을 넘지 않게 줄인다.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }
    const fit = () => {
      const maxHeight = Math.max(320, window.innerHeight - 260);
      setWidth(
        Math.floor(Math.min(frame.clientWidth, (maxHeight * cardSize.width) / cardSize.height)),
      );
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    window.addEventListener('resize', fit);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [cardSize]);

  const scale = width / cardSize.width;
  const current = slides[slide];

  // 그릴 때마다 요소 상자를 다시 잰다(1080 폭 좌표). 편집값이 바뀌면 상자도 따라 움직인다.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage || !width) {
      return;
    }
    const origin = stage.getBoundingClientRect();
    const found: Box[] = [];
    for (const id of ELEMENT_IDS) {
      const element = stage.querySelector(`[data-el="${id}"]`);
      if (!element) {
        continue;
      }
      const rect = element.getBoundingClientRect();
      found.push({
        id,
        x: (rect.left - origin.left) / scale,
        y: (rect.top - origin.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      });
    }
    // 안에 든 작은 요소(흰 카드 안 로고·목록)가 위에 오도록 큰 것부터 깐다.
    found.sort((a, b) => b.width * b.height - a.width * a.height);
    setBoxes(found);
  }, [current, width, scale]);

  const editOf = (id: ElementId) => edits?.[id] ?? NO_EDIT;

  const start = (event: PointerEvent, id: ElementId, kind: Gesture['kind']) => {
    event.preventDefault();
    event.stopPropagation();
    frameRef.current?.focus({ preventScroll: true });
    onSelect(id);
    const element = stageRef.current?.querySelector(`[data-el="${id}"]`);
    const parent = element?.parentElement;
    const factor =
      parent && parent.offsetWidth > 0
        ? parent.getBoundingClientRect().width / parent.offsetWidth
        : scale;
    const rect = element?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : event.clientX;
    const centerY = rect ? rect.top + rect.height / 2 : event.clientY;
    gestureCount.current += 1;
    gesture.current = {
      kind,
      id,
      group: `${kind}:${gestureCount.current}`,
      startX: event.clientX,
      startY: event.clientY,
      factor: factor || 1,
      centerX,
      centerY,
      startDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
      edit: editOf(id),
      moved: false,
    };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  };

  const move = (event: PointerEvent) => {
    const g = gesture.current;
    if (!g) {
      return;
    }
    const offsetX = event.clientX - g.startX;
    const offsetY = event.clientY - g.startY;
    if (!g.moved && Math.hypot(offsetX, offsetY) < DRAG_THRESHOLD) {
      return;
    }
    g.moved = true;
    if (g.kind === 'move') {
      onEdit(
        g.id,
        {
          ...g.edit,
          dx: Math.round(g.edit.dx + offsetX / g.factor),
          dy: Math.round(g.edit.dy + offsetY / g.factor),
        },
        g.group,
      );
    } else {
      const distance = Math.hypot(event.clientX - g.centerX, event.clientY - g.centerY);
      const next = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, Math.round((g.edit.scale * distance * 100) / g.startDistance) / 100),
      );
      onEdit(g.id, { ...g.edit, scale: next }, g.group);
    }
  };

  const end = () => {
    const g = gesture.current;
    gesture.current = null;
    // 끌지 않고 누른 글 요소는 왼쪽 문구 칸으로 간다.
    if (g && !g.moved && g.kind === 'move' && TEXT_ELEMENTS.includes(g.id)) {
      onFocusText(g.id);
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onSelect(null);
      return;
    }
    if (!selected) {
      return;
    }
    const edit = editOf(selected);
    const step = event.shiftKey ? 10 : 1;
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const arrow = arrows[event.key];
    if (arrow) {
      event.preventDefault();
      onEdit(
        selected,
        { ...edit, dx: edit.dx + arrow[0], dy: edit.dy + arrow[1] },
        `nudge:${selected}`,
      );
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onEdit(selected, { ...edit, hidden: true });
    }
  };

  const selectedBox = boxes.find((box) => box.id === selected);
  const handle = 'absolute size-3 rounded-sm border-2 border-blue-500 bg-white';

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={frameRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="카드 캔버스. 요소를 눌러 고르고 끌어 옮깁니다."
        className="flex w-full justify-center outline-none"
      >
        {width && current ? (
          <div
            className="relative bg-gray-100 shadow-sm"
            style={{ width, height: cardSize.height * scale }}
          >
            <SlideStage
              element={current.element}
              size={cardSize}
              width={width}
              stageRef={stageRef}
            />
            <div
              className="absolute inset-0"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                  frameRef.current?.focus({ preventScroll: true });
                  onSelect(null);
                }
              }}
            >
              {boxes.map((box) => {
                const hidden = edits?.[box.id]?.hidden;
                const on = box.id === selected;
                return (
                  <div
                    key={box.id}
                    role="button"
                    aria-label={ELEMENT_LABELS[box.id]}
                    aria-pressed={on}
                    title={ELEMENT_LABELS[box.id]}
                    onPointerDown={(event) => start(event, box.id, 'move')}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerCancel={end}
                    className={`absolute cursor-move touch-none ${
                      on
                        ? 'outline outline-2 outline-blue-500'
                        : hidden
                          ? 'outline outline-1 outline-dashed outline-gray-400'
                          : 'hover:outline hover:outline-1 hover:outline-blue-300'
                    }`}
                    style={{
                      left: box.x * scale,
                      top: box.y * scale,
                      width: box.width * scale,
                      height: box.height * scale,
                    }}
                  />
                );
              })}
              {selectedBox
                ? (
                    [
                      ['left-0 top-0 -translate-1/2 cursor-nwse-resize', 'tl'],
                      ['right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize', 'tr'],
                      ['bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize', 'bl'],
                      ['bottom-0 right-0 translate-1/2 cursor-nwse-resize', 'br'],
                    ] as const
                  ).map(([position, corner]) => (
                    <div
                      key={corner}
                      className="pointer-events-none absolute"
                      style={{
                        left: selectedBox.x * scale,
                        top: selectedBox.y * scale,
                        width: selectedBox.width * scale,
                        height: selectedBox.height * scale,
                      }}
                    >
                      <div
                        role="button"
                        aria-label={`${ELEMENT_LABELS[selectedBox.id]} 크기`}
                        data-handle={corner}
                        onPointerDown={(event) => start(event, selectedBox.id, 'resize')}
                        onPointerMove={move}
                        onPointerUp={end}
                        onPointerCancel={end}
                        className={`pointer-events-auto touch-none ${handle} ${position}`}
                      />
                    </div>
                  ))
                : null}
            </div>
          </div>
        ) : (
          <div
            className="flex w-full items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400"
            style={{ aspectRatio: `${cardSize.width} / ${cardSize.height}`, maxHeight: '70vh' }}
          >
            그리는 중
          </div>
        )}
      </div>

      <div className="flex justify-center gap-3">
        {slides.map((built, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSlideChange(index)}
            aria-pressed={index === slide}
            className="flex flex-col items-center gap-1"
          >
            <span
              className={`pointer-events-none block overflow-hidden outline-offset-2 ${
                index === slide ? 'outline outline-2 outline-blue-500' : 'hover:outline-gray-300'
              }`}
            >
              <SlideStage element={built.element} size={cardSize} width={96} />
            </span>
            <span
              className={`text-xs ${index === slide ? 'font-bold text-gray-900' : 'text-gray-500'}`}
            >
              {SLIDE_LABELS[index]}
            </span>
            {built.overflow ? <span className="text-xs font-semibold text-error">넘침</span> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
