'use client';

import {
  type DragEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
  type Ref,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@ogonggo/ui';
import { buildSlide } from '@/lib/card/render/slides';
import {
  CARD_SIZES,
  type CardSize,
  type CardContent,
  type CardSizeId,
  type CardSpec,
  elementLabel,
  type ElementEdit,
  type ElementId,
  type Layer,
  SLIDE_COUNT,
  SLIDE_LABELS,
  type Selection,
  type TextLayer,
  type VariantId,
  isElementId,
  isLayerRef,
  layerLabel,
  layerRef,
} from '@/lib/card/types';
import { blobToLayerImage } from '@/lib/client/image';
import { putImage } from '@/lib/client/imageStore';
import { TextPopover, templateTextField } from './TextPopover';
import type { MeasuredBox } from '@/lib/ai/tools';
import type { RenderKit } from '@/lib/client/useRenderKit';

/**
 * 편집 캔버스. 서버 렌더와 같은 `buildSlide()` JSX 를 브라우저 DOM 에 1080 폭으로 그리고 화면 폭에
 * 맞게 줄인다. 끄는 동안 서버를 부르지 않는다 — 받기만 서버 PNG 다.
 *
 * 요소 상자는 렌더가 단 `data-el` 로 찾아 잰다. 그 위에 투명한 상자를 얹어 고르기·끌기·크기 핸들을
 * 받는다. 요소 안에 요소가 있으면(흰 판 안 섹션, 섹션 안 칩) 처음 누르면 바깥 요소를 고르고, 같은
 * 자리를 다시 누르면 한 겹 안쪽을 고른다. Esc 는 한 겹 바깥으로, 맨 바깥에서는 선택을 푼다. 이동값은
 * 요소가 놓인 부모 좌표(1080 폭 기준)로 바꿔 저장한다 — 3장 정사각처럼 묶음째 줄인 장도 손을 따라
 * 움직이게.
 *
 * 자유 요소(`Layer`)는 템플릿 위에 얹혀 늘 맨 위에서 골라진다. 피그마처럼 Ctrl+V 로 이미지·글자를
 * 붙이고, 파일을 끌어 놓고, T 키나 `텍스트 추가` 로 글자를 넣고, 글자 요소는 두 번 눌러 바로 고친다.
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

/** 1080 폭 장 하나를 `width` 폭으로 줄여 그린다. `slideIndex` 를 주면 `measureSlideBoxes` 가 찾는다. */
function SlideStage({
  element,
  size,
  width,
  stageRef,
  slideIndex,
}: {
  element: ReactElement;
  size: CardSize;
  width: number;
  stageRef?: Ref<HTMLDivElement>;
  slideIndex?: number;
}) {
  const scale = width / size.width;
  return (
    <div className="relative overflow-hidden" style={{ width, height: size.height * scale }}>
      <div
        ref={stageRef}
        data-card-canvas=""
        data-slide={slideIndex}
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
  id: Selection;
  /** 이 요소를 감싼 요소. 없으면 맨 바깥이다. 자유 요소는 늘 맨 바깥이다. */
  parent: ElementId | null;
  /** 감싼 요소 수. 깊을수록 위에 깐다. 자유 요소는 템플릿 요소보다 위다. */
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 캔버스 아래 썸네일에서 장 하나의 요소 상자를 잰다(1080 폭 좌표, 편집값이 걸린 자리). 썸네일은 세 장이
 * 늘 그려져 있어 지금 보고 있지 않은 장도 잰다. 썸네일이 없으면 `null`. 자유 요소는 `layer:<id>` 로
 * 뒤에 붙는다.
 */
export function measureSlideBoxes(slide: number, cardWidth: number): MeasuredBox[] | null {
  const stage = document.querySelector(`[data-card-canvas][data-slide="${slide}"]`);
  if (!stage) {
    return null;
  }
  const origin = stage.getBoundingClientRect();
  const stageScale = origin.width / cardWidth;
  if (!stageScale) {
    return null;
  }
  const layers: MeasuredBox[] = [...stage.querySelectorAll<HTMLElement>('[data-layer]')].map(
    (element) => {
      const rect = element.getBoundingClientRect();
      return {
        id: layerRef(element.dataset.layer ?? ''),
        parent: null,
        x: (rect.left - origin.left) / stageScale,
        y: (rect.top - origin.top) / stageScale,
        width: rect.width / stageScale,
        height: rect.height / stageScale,
        factor: 1,
      };
    },
  );
  const elements = [...stage.querySelectorAll<HTMLElement>('[data-el]')].flatMap((element) => {
    const id = element.dataset.el;
    if (!isElementId(id)) {
      return [];
    }
    const rect = element.getBoundingClientRect();
    const parent = element.parentElement;
    const factor =
      parent && parent.offsetWidth > 0
        ? parent.getBoundingClientRect().width / parent.offsetWidth / stageScale
        : 1;
    return [
      {
        id,
        parent: ancestorsOf(element, stage as HTMLElement)[0] ?? null,
        x: (rect.left - origin.left) / stageScale,
        y: (rect.top - origin.top) / stageScale,
        width: rect.width / stageScale,
        height: rect.height / stageScale,
        factor: factor || 1,
      },
    ];
  });
  return [...elements, ...layers];
}

const NO_EDIT: ElementEdit = { dx: 0, dy: 0, scale: 1 };
/** 이만큼 움직이기 전에는 끌기가 아니라 누르기다(화면 px). */
const DRAG_THRESHOLD = 3;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

/** `rgb(…)` 색을 `#RRGGBB` 로. */
function toHex(color: string): string {
  const [r = 0, g = 0, b = 0] = (color.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** 템플릿 글자 요소가 지금 큰 캔버스에 그려진 모양(1080 폭 좌표). 자유 텍스트로 풀 때 쓴다. */
export interface TextLook {
  x: number;
  y: number;
  width: number;
  fontSize: number;
  fontWeight: number;
  color: string;
  lineHeight: number;
  align: TextLayer['align'];
}

/**
 * 큰 캔버스에서 템플릿 글자 요소의 자리와 글자 모양을 잰다. 글자 크기는 편집값 배율까지 곱한 값이다.
 * 색은 바탕을 칠하지 않은 글자(강조 상자·칩 바탕 밖)를 먼저 본다 — 풀면 상자 모양이 사라지므로.
 */
export function readTextLook(id: ElementId, cardWidth: number): TextLook | null {
  const stage = document.querySelector<HTMLElement>('[data-card-canvas]:not([data-slide])');
  const element = stage?.querySelector<HTMLElement>(`[data-el="${id}"]`);
  if (!stage || !element) {
    return null;
  }
  const origin = stage.getBoundingClientRect();
  const stageScale = origin.width / cardWidth;
  const rect = element.getBoundingClientRect();
  const texts = [element, ...element.querySelectorAll<HTMLElement>('*')].filter((node) =>
    [...node.childNodes].some((child) => child.nodeType === 3 && child.textContent?.trim()),
  );
  const first = texts[0];
  if (!stageScale || !first) {
    return null;
  }
  const plain =
    texts.find((node) => getComputedStyle(node).backgroundColor === 'rgba(0, 0, 0, 0)') ?? first;
  const style = getComputedStyle(first);
  // 편집값으로 키운 만큼(요소 배율)을 글자 크기에 곱한다.
  const factor = element.offsetWidth ? rect.width / (element.offsetWidth * stageScale) : 1;
  const fontSize = Number.parseFloat(style.fontSize) * factor;
  // 줄 간격은 줄 상자 둘의 위쪽 차이로 잰다(제목은 줄마다 상자이고 줄 사이가 따로 있다).
  const lines = texts.map((node) => node.getBoundingClientRect().top);
  const pitch = lines.find((top) => top - (lines[0] ?? 0) > 1);
  const lineHeight =
    pitch !== undefined && lines[0] !== undefined
      ? (pitch - lines[0]) / stageScale / fontSize
      : Number.parseFloat(style.lineHeight) / Number.parseFloat(style.fontSize) || 1.2;
  return {
    x: (rect.left - origin.left) / stageScale,
    y: (rect.top - origin.top) / stageScale,
    width: rect.width / stageScale,
    fontSize: Math.round(fontSize),
    fontWeight: Math.min(900, Math.max(500, Math.round(Number(style.fontWeight) / 100) * 100)),
    color: toHex(getComputedStyle(plain).color),
    lineHeight: Math.round(Math.min(3, Math.max(0.8, lineHeight)) * 100) / 100,
    align: style.textAlign === 'center' ? 'center' : 'left',
  };
}

/** 요소를 감싼 요소들(가까운 것부터). */
function ancestorsOf(element: HTMLElement, stage: HTMLElement): ElementId[] {
  const found: ElementId[] = [];
  let current = element.parentElement;
  while (current && current !== stage) {
    const id = current.dataset.el;
    if (isElementId(id)) {
      found.push(id);
    }
    current = current.parentElement;
  }
  return found;
}

/** 복사한 자유 요소를 클립보드에 싣는 형식. 같은 브라우저 안에서만 읽힌다. */
const LAYER_MIME = 'application/x-ogonggo-layer';
/** 붙여 넣은 이미지의 처음 크기 상한(1080 폭 기준). */
const IMAGE_MAX_WIDTH = 600;
const IMAGE_MAX_HEIGHT = 800;
/** 복사·복제한 요소를 원래 자리에서 비켜 놓는 거리. */
const PASTE_OFFSET = 24;
const MIN_LAYER_WIDTH = 20;

function newLayerId(): string {
  return crypto.randomUUID().slice(0, 8);
}

/** 입력 칸에 포커스가 있으면 붙여넣기·복사는 그 칸의 몫이다. */
function editingText(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}

type Gesture = {
  kind: 'move' | 'resize';
  id: Selection;
  /** 끌지 않고 떼면 고를 한 겹 안쪽 요소. */
  drill: ElementId | null;
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
  /** 자유 요소를 끌 때 처음 값. */
  layer: Layer | null;
  moved: boolean;
};

export function EditorCanvas({
  slides,
  size,
  slide,
  edits,
  layers,
  selected,
  onSelect,
  onSlideChange,
  onEdit,
  onLayers,
  content,
  variant,
  onContentChange,
  sectionLabels,
  textColor,
  checkLayers,
  onLogo,
  onBrand,
}: {
  slides: BuiltSlide[];
  size: CardSizeId;
  slide: number;
  /** 이 장의 편집값. */
  edits: Partial<Record<ElementId, ElementEdit>> | undefined;
  /** 이 장의 자유 요소. 배열 순서가 칠하는 순서다. */
  layers: Layer[];
  selected: Selection | null;
  onSelect: (id: Selection | null) => void;
  onSlideChange: (slide: number) => void;
  onEdit: (id: ElementId, edit: ElementEdit | null, group?: string) => void;
  onLayers: (layers: Layer[], group?: string) => void;
  /** 문구와 템플릿. 템플릿 글자를 두 번 눌러 고칠 때 쓴다. */
  content: CardContent;
  variant: VariantId;
  onContentChange: (content: CardContent) => void;
  /** 이 장에 보이는 섹션의 칩 제목. 섹션 요소 이름에 쓴다. */
  sectionLabels: string[];
  /** 새 글자 요소의 색(템플릿 제목 색). */
  textColor: string;
  /** 자유 요소를 바꾼 장을 받을 수 있는지. 안 되면 알릴 말. */
  checkLayers: (layers: Layer[]) => string | null;
  /** 회사 로고 자리에 붙이거나 놓은 이미지. 회사 로고를 바꾼다. */
  onLogo: (image: Blob) => void;
  /** 브랜드 로고 자리에 붙이거나 놓은 이미지. 브랜드 로고를 올린 로고로 바꾼다. */
  onBrand: (image: Blob) => void;
}) {
  const cardSize = CARD_SIZES[size];
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  /** 두 번 눌러 연 템플릿 글자 입력 창. */
  const [textEdit, setTextEdit] = useState<{ id: ElementId; sectionIndex?: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const gestureCount = useRef(0);
  // 붙여넣기·이미지 줄이기는 기다린 뒤 바꾼다. 그 사이 바뀐 목록 위에 더하도록 최신 값을 본다.
  const layersRef = useRef(layers);
  layersRef.current = layers;

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
    const measure = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      return {
        x: (rect.left - origin.left) / scale,
        y: (rect.top - origin.top) / scale,
        width: rect.width / scale,
        height: rect.height / scale,
      };
    };
    const found: Box[] = [];
    for (const element of stage.querySelectorAll<HTMLElement>('[data-el]')) {
      const id = element.dataset.el;
      if (!isElementId(id)) {
        continue;
      }
      const ancestors = ancestorsOf(element, stage);
      found.push({
        id,
        parent: ancestors[0] ?? null,
        depth: ancestors.length,
        ...measure(element),
      });
    }
    // 안에 든 요소(흰 판 안 섹션, 섹션 안 칩)가 위에 오도록 바깥 것부터, 같은 깊이는 큰 것부터 깐다.
    found.sort((a, b) => a.depth - b.depth || b.width * b.height - a.width * a.height);
    // 자유 요소는 템플릿 위에, 칠하는 순서대로 깐다.
    stage.querySelectorAll<HTMLElement>('[data-layer]').forEach((element, index) => {
      found.push({
        id: layerRef(element.dataset.layer ?? ''),
        parent: null,
        depth: 1000 + index,
        ...measure(element),
      });
    });
    setBoxes(found);
  }, [current, width, scale]);

  const editOf = (id: ElementId) => edits?.[id] ?? NO_EDIT;
  const layerOf = (id: Selection | null) =>
    isLayerRef(id) ? (layers.find((layer) => layerRef(layer.id) === id) ?? null) : null;
  const parentOf = (id: Selection) => boxes.find((box) => box.id === id)?.parent ?? null;
  const label = (id: Selection) => {
    if (isLayerRef(id)) {
      const layer = layerOf(id);
      return layer ? layerLabel(layer) : '자유 요소';
    }
    return elementLabel(id, sectionLabels);
  };

  /** 장 하나의 자유 요소를 바꾼다. 받기 요청이 너무 커지면 바꾸지 않고 알린다. */
  const commitLayers = (next: Layer[], group?: string, select?: Layer): boolean => {
    const problem = checkLayers(next);
    if (problem) {
      setMessage(problem);
      return false;
    }
    setMessage(null);
    layersRef.current = next;
    onLayers(next, group);
    if (select) {
      onSelect(layerRef(select.id));
    }
    return true;
  };
  const replaceLayer = (layer: Layer, group?: string) =>
    commitLayers(
      layersRef.current.map((item) => (item.id === layer.id ? layer : item)),
      group,
    );

  /** 글자 요소를 넣는다. `text` 가 없으면 `텍스트` 를 넣고 바로 고치기를 연다. */
  const addText = (text?: string, at?: { x: number; y: number }) => {
    const layerWidth = text ? 840 : 600;
    const layer: TextLayer = {
      id: newLayerId(),
      kind: 'text',
      text: text ?? '텍스트',
      fontSize: 64,
      fontWeight: 700,
      color: textColor,
      align: 'left',
      lineHeight: 1.3,
      width: layerWidth,
      x: Math.round((at?.x ?? cardSize.width / 2) - layerWidth / 2),
      y: Math.round((at?.y ?? cardSize.height / 2) - 42),
    };
    if (commitLayers([...layersRef.current, layer], undefined, layer) && !text) {
      setEditing(layer.id);
    }
  };

  /** 이미지 파일을 줄여 이미지 요소로 넣는다. `at` 은 놓을 가운데(1080 폭 좌표)다. */
  const addImages = async (files: Blob[], at?: { x: number; y: number }) => {
    let offset = 0;
    for (const file of files) {
      let image: Awaited<ReturnType<typeof blobToLayerImage>>;
      try {
        image = await blobToLayerImage(file);
      } catch {
        setMessage('이미지를 읽지 못했습니다.');
        continue;
      }
      const fit = Math.min(1, IMAGE_MAX_WIDTH / image.width, IMAGE_MAX_HEIGHT / image.height);
      const layerWidth = Math.round(image.width * fit);
      const layerHeight = Math.round(image.height * fit);
      const id = newLayerId();
      const layer: Layer = {
        id,
        kind: 'image',
        imageId: id,
        src: image.dataUrl,
        width: layerWidth,
        height: layerHeight,
        x: Math.round((at?.x ?? cardSize.width / 2) - layerWidth / 2 + offset),
        y: Math.round((at?.y ?? cardSize.height / 2) - layerHeight / 2 + offset),
        opacity: 1,
        radius: 0,
      };
      if (commitLayers([...layersRef.current, layer], undefined, layer)) {
        void putImage(id, image.dataUrl);
        offset += PASTE_OFFSET;
      }
    }
  };

  /** 자유 요소 복사본을 비켜 놓고 고른다. 이미지는 같은 저장 이미지를 쓴다. */
  const addCopy = (source: Layer) => {
    const copy = {
      ...source,
      id: newLayerId(),
      x: source.x + PASTE_OFFSET,
      y: source.y + PASTE_OFFSET,
    };
    commitLayers([...layersRef.current, copy], undefined, copy);
  };

  const removeLayer = (id: string) => {
    commitLayers(layersRef.current.filter((layer) => layer.id !== id));
    onSelect(null);
  };

  // 붙여넣기·복사는 캔버스 칸이 아니라 창에서 받는다 — 캔버스 밖 빈 곳을 누른 뒤에도 붙는다. 입력 칸이
  // 받는 것은 건드리지 않는다.
  const clipboardRef = useRef({ selected, layerOf, addText, addImages, addCopy, onLogo, onBrand });
  clipboardRef.current = { selected, layerOf, addText, addImages, addCopy, onLogo, onBrand };
  useEffect(() => {
    const onCopy = (event: ClipboardEvent) => {
      const { selected: now, layerOf: find } = clipboardRef.current;
      const layer = find(now);
      if (!layer || editingText(event.target) || !event.clipboardData) {
        return;
      }
      event.preventDefault();
      event.clipboardData.setData(LAYER_MIME, JSON.stringify(layer));
      event.clipboardData.setData('text/plain', layer.kind === 'text' ? layer.text : '');
    };
    const onPaste = (event: ClipboardEvent) => {
      const data = event.clipboardData;
      if (!data || editingText(event.target)) {
        return;
      }
      const copied = data.getData(LAYER_MIME);
      const files = [...data.files].filter((file) => file.type.startsWith('image/'));
      const text = data.getData('text/plain').trim();
      if (!copied && files.length === 0 && !text) {
        return;
      }
      event.preventDefault();
      const actions = clipboardRef.current;
      if (copied) {
        try {
          actions.addCopy(JSON.parse(copied) as Layer);
          return;
        } catch {
          // 모양이 틀리면 아래에서 글자로 붙인다.
        }
      }
      // 회사 로고를 고른 채 붙인 이미지는 로고가 된다(로고가 없어 회사명 글자로 그린 자리도 같다).
      // 브랜드 로고를 고른 채 붙이면 브랜드 로고가 된다.
      if (files[0] && actions.selected === 'companyLogo') {
        actions.onLogo(files[0]);
      } else if (files[0] && actions.selected === 'brandMark') {
        actions.onBrand(files[0]);
      } else if (files.length > 0) {
        void actions.addImages(files);
      } else if (text) {
        actions.addText(text);
      }
    };
    window.addEventListener('copy', onCopy);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('copy', onCopy);
      window.removeEventListener('paste', onPaste);
    };
  }, []);

  /** 화면 좌표를 1080 폭 좌표로. */
  const toCard = (clientX: number, clientY: number) => {
    const origin = stageRef.current?.getBoundingClientRect();
    return {
      x: origin ? (clientX - origin.left) / scale : 0,
      y: origin ? (clientY - origin.top) / scale : 0,
    };
  };

  /**
   * 누른 자리에서 고를 요소. `hit` 은 누른 상자(가장 안쪽)다. 그 상자와 감싼 요소 가운데 누른 자리를
   * 덮는 것을 바깥부터 늘어놓고, 고른 요소가 그 안에 있으면 그것을 끈다(떼면 한 겹 안쪽). 고른 요소의
   * 바깥 요소가 있으면 그 바로 안쪽(고른 요소와 같은 깊이)을, 아니면 맨 바깥을 고른다.
   */
  const pick = (
    event: PointerEvent,
    hit: ElementId,
  ): { id: ElementId; drill: ElementId | null } => {
    const { x, y } = toCard(event.clientX, event.clientY);
    const covers = (id: ElementId) => {
      const box = boxes.find((item) => item.id === id);
      return Boolean(
        box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height,
      );
    };
    const chain: ElementId[] = [];
    for (let id: ElementId | null = hit; id; id = parentOf(id)) {
      if (id === hit || covers(id)) {
        chain.unshift(id);
      }
    }
    const lineage: Selection[] = [];
    for (let id: Selection | null = selected; id; id = parentOf(id)) {
      lineage.push(id);
    }
    const shared = [...chain].reverse().find((id) => lineage.includes(id));
    if (shared && shared === selected) {
      return { id: shared, drill: chain[chain.indexOf(shared) + 1] ?? null };
    }
    return {
      id: shared ? (chain[chain.indexOf(shared) + 1] ?? shared) : (chain[0] ?? hit),
      drill: null,
    };
  };

  const start = (event: PointerEvent, hit: Selection, kind: Gesture['kind']) => {
    event.preventDefault();
    event.stopPropagation();
    frameRef.current?.focus({ preventScroll: true });
    const { id, drill }: { id: Selection; drill: ElementId | null } =
      kind === 'move' && !isLayerRef(hit) ? pick(event, hit) : { id: hit, drill: null };
    onSelect(id);
    const layer = layerOf(id);
    const element = stageRef.current?.querySelector(
      layer ? `[data-layer="${layer.id}"]` : `[data-el="${id}"]`,
    );
    const parent = element?.parentElement;
    const factor =
      !layer && parent && parent.offsetWidth > 0
        ? parent.getBoundingClientRect().width / parent.offsetWidth
        : scale;
    const rect = element?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : event.clientX;
    const centerY = rect ? rect.top + rect.height / 2 : event.clientY;
    gestureCount.current += 1;
    gesture.current = {
      kind,
      id,
      drill,
      group: `${kind}:${gestureCount.current}`,
      startX: event.clientX,
      startY: event.clientY,
      factor: factor || 1,
      centerX,
      centerY,
      startDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
      edit: layer || isLayerRef(id) ? NO_EDIT : editOf(id),
      layer,
      moved: false,
    };
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  };

  /** 자유 요소 끌기·크기. 크기는 가운데를 두고 바꾼다 — 글자는 폭만(줄이 다시 나뉜다), 이미지는 비율째. */
  const moveLayer = (g: Gesture, layer: Layer, event: PointerEvent) => {
    if (g.kind === 'move') {
      replaceLayer(
        {
          ...layer,
          x: Math.round(layer.x + (event.clientX - g.startX) / g.factor),
          y: Math.round(layer.y + (event.clientY - g.startY) / g.factor),
        },
        g.group,
      );
      return;
    }
    const ratio =
      Math.hypot(event.clientX - g.centerX, event.clientY - g.centerY) / g.startDistance;
    const nextWidth = Math.max(MIN_LAYER_WIDTH, Math.round(layer.width * ratio));
    const x = Math.round(layer.x + (layer.width - nextWidth) / 2);
    if (layer.kind === 'text') {
      replaceLayer({ ...layer, x, width: nextWidth }, g.group);
      return;
    }
    const nextHeight = Math.max(1, Math.round((layer.height * nextWidth) / layer.width));
    replaceLayer(
      {
        ...layer,
        x,
        y: Math.round(layer.y + (layer.height - nextHeight) / 2),
        width: nextWidth,
        height: nextHeight,
      },
      g.group,
    );
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
    if (g.layer) {
      moveLayer(g, g.layer, event);
      return;
    }
    if (isLayerRef(g.id)) {
      return;
    }
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
    if (!g || g.moved || g.kind !== 'move' || isLayerRef(g.id)) {
      return;
    }
    // 고른 요소를 다시 누르면 한 겹 안쪽으로 들어간다. 포커스는 캔버스에 남는다(방향키·Delete 가 먹게).
    if (g.drill) {
      onSelect(g.drill);
    }
  };

  /** 두 번 누른 요소. 글자 요소는 바로 고치기, 템플릿 글자는 요소 아래 입력 창을 연다. */
  const openText = (id: Selection) => {
    const layer = layerOf(id);
    if (layer?.kind === 'text') {
      setEditing(layer.id);
      return;
    }
    if (isLayerRef(id)) {
      return;
    }
    const field = templateTextField(id, content, variant, slide);
    if (field) {
      onSelect(id);
      setTextEdit({ id, sectionIndex: field.sectionIndex });
    }
  };
  const textField = textEdit
    ? templateTextField(textEdit.id, content, variant, slide, textEdit.sectionIndex)
    : null;
  const textBox = textEdit ? boxes.find((box) => box.id === textEdit.id) : undefined;

  const onKeyDown = (event: KeyboardEvent) => {
    const command = event.ctrlKey || event.metaKey;
    if (event.key === 'Escape') {
      onSelect(selected ? parentOf(selected) : null);
      return;
    }
    if (!command && !event.altKey && event.key.toLowerCase() === 't') {
      event.preventDefault();
      addText();
      return;
    }
    if (!selected) {
      return;
    }
    const layer = layerOf(selected);
    const step = event.shiftKey ? 10 : 1;
    const arrows: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const arrow = arrows[event.key];
    if (command && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      if (layer) {
        addCopy(layer);
      }
    } else if (arrow) {
      event.preventDefault();
      if (layer) {
        replaceLayer(
          { ...layer, x: layer.x + arrow[0], y: layer.y + arrow[1] },
          `nudge:${selected}`,
        );
      } else if (!isLayerRef(selected)) {
        const edit = editOf(selected);
        onEdit(
          selected,
          { ...edit, dx: edit.dx + arrow[0], dy: edit.dy + arrow[1] },
          `nudge:${selected}`,
        );
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      // 자유 요소는 지우고, 템플릿 요소는 숨긴다(자리를 지킨다).
      if (layer) {
        removeLayer(layer.id);
      } else if (!isLayerRef(selected)) {
        onEdit(selected, { ...editOf(selected), hidden: true });
      }
    } else if (event.key === 'Enter' && layer?.kind === 'text') {
      event.preventDefault();
      setEditing(layer.id);
    }
  };

  const onDragOver = (event: DragEvent) => {
    if (event.dataTransfer.types.includes('Files')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  };
  const onDrop = (event: DragEvent) => {
    const files = [...event.dataTransfer.files].filter((file) => file.type.startsWith('image/'));
    if (files.length === 0) {
      return;
    }
    event.preventDefault();
    frameRef.current?.focus({ preventScroll: true });
    const at = toCard(event.clientX, event.clientY);
    // 회사 로고나 브랜드 로고 위에 놓으면 그 로고를 바꾼다.
    const target = boxes.find(
      (box) =>
        (box.id === 'companyLogo' || box.id === 'brandMark') &&
        at.x >= box.x &&
        at.x <= box.x + box.width &&
        at.y >= box.y &&
        at.y <= box.y + box.height,
    );
    if (files[0] && target) {
      onSelect(target.id);
      (target.id === 'brandMark' ? onBrand : onLogo)(files[0]);
      return;
    }
    void addImages(files, at);
  };

  const editingLayer = layers.find(
    (layer): layer is TextLayer => layer.id === editing && layer.kind === 'text',
  );
  const editingBox = editingLayer
    ? boxes.find((box) => box.id === layerRef(editingLayer.id))
    : undefined;
  /** 바로 고치기를 닫는다. 비운 글자 요소는 지운다(피그마와 같다). */
  const stopEditing = () => {
    const layer = layersRef.current.find((item) => item.id === editing);
    setEditing(null);
    if (layer?.kind === 'text' && !layer.text.trim()) {
      removeLayer(layer.id);
    }
    frameRef.current?.focus({ preventScroll: true });
  };

  const selectedBox = boxes.find((box) => box.id === selected);
  const handle = 'absolute size-3 rounded-sm border-2 border-blue-500 bg-white';

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={frameRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onDragOver={onDragOver}
        onDrop={onDrop}
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
              className="absolute inset-0 overflow-hidden"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                  frameRef.current?.focus({ preventScroll: true });
                  onSelect(null);
                }
              }}
            >
              {boxes.map((box) => {
                const hidden = !isLayerRef(box.id) && edits?.[box.id]?.hidden;
                const on = box.id === selected;
                return (
                  <div
                    key={box.id}
                    role="button"
                    aria-label={label(box.id)}
                    aria-pressed={on}
                    title={label(box.id)}
                    data-box={box.id}
                    onPointerDown={(event) => start(event, box.id, 'move')}
                    onPointerMove={move}
                    onPointerUp={end}
                    onPointerCancel={end}
                    onDoubleClick={() => openText(box.id)}
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
              {selectedBox && !editingLayer
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
                        aria-label={`${label(selectedBox.id)} 크기`}
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
              {textEdit && textField && textBox ? (
                <TextPopover
                  key={`${textEdit.id}:${slide}`}
                  field={textField}
                  content={content}
                  onChange={onContentChange}
                  onClose={() => {
                    setTextEdit(null);
                    frameRef.current?.focus({ preventScroll: true });
                  }}
                  style={{
                    width: Math.min(320, width - 16),
                    left: Math.max(8, Math.min(textBox.x * scale, width - 328)),
                    top: Math.min(
                      (textBox.y + textBox.height) * scale + 6,
                      cardSize.height * scale - 150,
                    ),
                  }}
                />
              ) : null}
              {editingLayer && editingBox ? (
                // 글자는 캔버스가 바로 다시 그린다. 입력 칸은 글자를 투명하게 두고 커서와 선택만 보인다.
                <textarea
                  aria-label="글자 고치기"
                  autoFocus
                  onFocus={(event) => event.currentTarget.select()}
                  value={editingLayer.text}
                  onChange={(event) =>
                    replaceLayer(
                      { ...editingLayer, text: event.target.value },
                      `text:${editingLayer.id}`,
                    )
                  }
                  onBlur={stopEditing}
                  onKeyDown={(event) => {
                    event.stopPropagation();
                    if (event.key === 'Escape' || (event.key === 'Enter' && event.ctrlKey)) {
                      event.preventDefault();
                      stopEditing();
                    }
                  }}
                  spellCheck={false}
                  className="absolute resize-none overflow-hidden border-0 bg-transparent p-0 outline outline-2 outline-blue-500"
                  style={{
                    left: editingLayer.x * scale,
                    top: editingLayer.y * scale,
                    width: editingLayer.width * scale,
                    height: Math.max(editingBox.height, editingLayer.fontSize) * scale,
                    fontFamily: 'Pretendard',
                    fontSize: editingLayer.fontSize * scale,
                    fontWeight: editingLayer.fontWeight,
                    lineHeight: editingLayer.lineHeight,
                    textAlign: editingLayer.align,
                    wordBreak: 'keep-all',
                    whiteSpace: 'pre-wrap',
                    color: 'transparent',
                    caretColor: '#3B82F6',
                  }}
                />
              ) : null}
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

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button type="button" size="sm" variant="secondary" onClick={() => addText()}>
          텍스트 추가
        </Button>
        <span className="text-xs text-gray-500">
          T 키로 글자, Ctrl+V 나 파일 끌어 놓기로 이미지를 넣습니다. 회사 로고를 고르고 붙이거나
          로고 자리에 놓으면 로고가 바뀝니다. 템플릿 글자도 두 번 눌러 고칩니다.
        </span>
      </div>
      {message ? <p className="text-center text-sm text-error">{message}</p> : null}

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
              <SlideStage element={built.element} size={cardSize} width={96} slideIndex={index} />
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
