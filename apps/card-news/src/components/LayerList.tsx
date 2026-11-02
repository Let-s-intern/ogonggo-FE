'use client';

import { type DragEvent, type ReactElement, useLayoutEffect, useState } from 'react';
import {
  elementLabel,
  type ElementEdit,
  type ElementId,
  type Layer,
  type Selection,
  isElementId,
  layerLabel,
  layerRef,
} from '@/lib/card/types';

/** 템플릿 요소 하나와 그것을 감싼 요소. 목록에서 들여 쓴다. */
interface TemplateItem {
  id: ElementId;
  depth: number;
}

/** 목록 한 줄. 위에서부터 앞에 칠하는 순서다. `template` 은 템플릿 요소 묶음 자리다. */
type Entry = { kind: 'layer'; layer: Layer } | { kind: 'template' };

const NO_EDIT: ElementEdit = { dx: 0, dy: 0, scale: 1 };

/**
 * 큰 캔버스에 그려진 템플릿 요소를 앞에 칠하는 것부터 늘어놓는다. 감싼 요소 바로 아래에 안쪽 요소를 들여 쓴다.
 * 렌더가 단 `data-el` 을 적힌 순서(칠하는 순서)로 읽어 뒤집는다.
 */
function readTemplate(): TemplateItem[] {
  const stage = document.querySelector<HTMLElement>('[data-main-canvas]');
  if (!stage) {
    return [];
  }
  const children = new Map<ElementId | null, ElementId[]>();
  for (const element of stage.querySelectorAll<HTMLElement>('[data-el]')) {
    const id = element.dataset.el;
    if (!isElementId(id)) {
      continue;
    }
    let parent: ElementId | null = null;
    for (let node = element.parentElement; node && node !== stage; node = node.parentElement) {
      if (isElementId(node.dataset.el)) {
        parent = node.dataset.el;
        break;
      }
    }
    children.set(parent, [...(children.get(parent) ?? []), id]);
  }
  const items: TemplateItem[] = [];
  const walk = (parent: ElementId | null, depth: number) => {
    for (const id of [...(children.get(parent) ?? [])].reverse()) {
      items.push({ id, depth });
      walk(id, depth + 1);
    }
  };
  walk(null, 0);
  return items;
}

/** 위에서부터의 목록을 칠하는 순서(배열 순서)로 되돌린다. 템플릿 묶음보다 아래 줄은 템플릿 뒤에 깐다. */
function layersFrom(entries: Entry[]): Layer[] {
  const divider = entries.findIndex((entry) => entry.kind === 'template');
  return entries
    .flatMap((entry, index) => {
      if (entry.kind !== 'layer') {
        return [];
      }
      const { behind: _behind, ...layer } = entry.layer;
      return [index > divider ? { ...layer, behind: true } : layer];
    })
    .reverse();
}

/**
 * 레이어 목록. 지금 장의 자유 요소와 템플릿 요소를 앞에 칠하는 것부터 보인다 — 템플릿 위에 얹은 자유 요소,
 * 템플릿 요소, 템플릿 뒤에 깐 자유 요소 순이다. 자유 요소는 끌어서 순서를 바꾸고(템플릿 묶음을 넘기면 템플릿
 * 뒤·위가 바뀐다), 템플릿 요소는 칠하는 순서가 정해져 있어 숨김·잠금만 바꾼다. 줄을 누르면 캔버스에서 고른다.
 */
export function LayerList({
  element,
  layers,
  edits,
  sectionLabels,
  selected,
  onSelect,
  onLayers,
  onEdit,
}: {
  /** 지금 장의 그림. 바뀔 때마다 캔버스에서 템플릿 요소를 다시 읽는다. */
  element: ReactElement | undefined;
  /** 지금 장의 자유 요소(칠하는 순서). */
  layers: Layer[];
  edits: Partial<Record<ElementId, ElementEdit>> | undefined;
  sectionLabels: string[];
  selected: Selection | null;
  onSelect: (id: Selection) => void;
  onLayers: (layers: Layer[], group?: string) => void;
  onEdit: (id: ElementId, edit: ElementEdit) => void;
}) {
  const [template, setTemplate] = useState<TemplateItem[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);

  // 그림이 바뀌면(장·템플릿·편집값) 캔버스의 템플릿 요소를 다시 읽는다.
  useLayoutEffect(() => {
    const next = readTemplate();
    setTemplate((current) =>
      current.length === next.length &&
      current.every(
        (item, index) => item.id === next[index]?.id && item.depth === next[index]?.depth,
      )
        ? current
        : next,
    );
  }, [element]);

  const entries: Entry[] = [
    ...layers
      .filter((layer) => !layer.behind)
      .reverse()
      .map((layer) => ({ kind: 'layer' as const, layer })),
    { kind: 'template' },
    ...layers
      .filter((layer) => layer.behind)
      .reverse()
      .map((layer) => ({ kind: 'layer' as const, layer })),
  ];
  const divider = entries.findIndex((entry) => entry.kind === 'template');

  /** 끈 자유 요소를 `index` 줄 자리로 옮긴다. 템플릿 줄에 놓으면 템플릿 묶음 자리다. */
  const drop = (event: DragEvent, index: number) => {
    event.preventDefault();
    const from = entries.findIndex(
      (entry) => entry.kind === 'layer' && entry.layer.id === dragging,
    );
    setDragging(null);
    setOver(null);
    if (from < 0 || from === index) {
      return;
    }
    const next = [...entries];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved!);
    onLayers(layersFrom(next));
  };
  const dropTarget = (index: number) => ({
    onDragOver: (event: DragEvent) => {
      if (dragging) {
        event.preventDefault();
        setOver(index);
      }
    },
    onDragLeave: () => setOver((value) => (value === index ? null : value)),
    onDrop: (event: DragEvent) => drop(event, index),
  });

  const toggle = (on: boolean) =>
    `h-6 shrink-0 rounded px-1.5 text-[11px] ${
      on ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
    }`;
  const row = (on: boolean, target: boolean) =>
    `flex items-center gap-1 rounded-md pr-1 ${
      target
        ? 'bg-blue-50 outline outline-2 outline-blue-300'
        : on
          ? 'bg-blue-50'
          : 'hover:bg-gray-50'
    }`;
  const setLayer = (layer: Layer, patch: Partial<Pick<Layer, 'hidden' | 'locked'>>) =>
    onLayers(layers.map((item) => (item.id === layer.id ? { ...layer, ...patch } : item)));

  return (
    <section aria-label="레이어" className="flex flex-col gap-2 p-4">
      <h2 className="text-base font-bold">레이어</h2>
      <p className="-mt-1 text-xs text-gray-500">
        위에 있을수록 앞에 칠합니다. 자유 요소는 끌어서 순서를 바꾸고, 템플릿 요소 묶음 아래로 끌면
        템플릿 뒤에 깝니다.
      </p>
      <ul className="flex flex-col gap-0.5">
        {entries.map((entry, index) => {
          if (entry.kind === 'template') {
            return (
              <li key="template" className="flex flex-col gap-0.5">
                <div
                  {...dropTarget(index)}
                  className={`mt-1 rounded-md px-2 py-1 text-xs font-bold text-gray-500 ${
                    over === index ? 'bg-blue-50 outline outline-2 outline-blue-300' : ''
                  }`}
                >
                  템플릿 요소
                </div>
                {template.map((item) => {
                  const edit = edits?.[item.id] ?? NO_EDIT;
                  const name = elementLabel(item.id, sectionLabels);
                  return (
                    <div
                      key={item.id}
                      data-layer-row={item.id}
                      {...dropTarget(index)}
                      className={row(selected === item.id, over === index)}
                    >
                      <button
                        type="button"
                        aria-pressed={selected === item.id}
                        onClick={() => onSelect(item.id)}
                        className={`min-w-0 flex-1 truncate py-1.5 text-left text-sm ${
                          edit.hidden ? 'text-gray-400' : 'text-gray-800'
                        }`}
                        style={{ paddingLeft: 8 + item.depth * 14 }}
                      >
                        {name}
                      </button>
                      <button
                        type="button"
                        aria-label={`${name} 숨기기`}
                        aria-pressed={Boolean(edit.hidden)}
                        onClick={() =>
                          onEdit(item.id, { ...edit, hidden: edit.hidden ? undefined : true })
                        }
                        className={toggle(Boolean(edit.hidden))}
                      >
                        숨김
                      </button>
                      <button
                        type="button"
                        aria-label={`${name} 잠그기`}
                        aria-pressed={Boolean(edit.locked)}
                        onClick={() =>
                          onEdit(item.id, { ...edit, locked: edit.locked ? undefined : true })
                        }
                        className={toggle(Boolean(edit.locked))}
                      >
                        잠금
                      </button>
                    </div>
                  );
                })}
              </li>
            );
          }
          const { layer } = entry;
          const id = layerRef(layer.id);
          const name = layerLabel(layer);
          return (
            <li
              key={layer.id}
              data-layer-row={id}
              draggable={!layer.locked}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', layer.id);
                setDragging(layer.id);
              }}
              onDragEnd={() => {
                setDragging(null);
                setOver(null);
              }}
              {...dropTarget(index)}
              className={`${row(selected === id, over === index && dragging !== layer.id)} ${
                dragging === layer.id ? 'opacity-40' : ''
              } ${layer.locked ? '' : 'cursor-grab'}`}
            >
              <button
                type="button"
                aria-pressed={selected === id}
                onClick={() => onSelect(id)}
                className={`min-w-0 flex-1 truncate py-1.5 pl-2 text-left text-sm ${
                  layer.hidden ? 'text-gray-400' : 'text-gray-800'
                }`}
              >
                {name}
                {index > divider ? (
                  <span className="ml-1 text-xs text-gray-400">템플릿 뒤</span>
                ) : null}
              </button>
              <button
                type="button"
                aria-label={`${name} 숨기기`}
                aria-pressed={Boolean(layer.hidden)}
                onClick={() => setLayer(layer, { hidden: layer.hidden ? undefined : true })}
                className={toggle(Boolean(layer.hidden))}
              >
                숨김
              </button>
              <button
                type="button"
                aria-label={`${name} 잠그기`}
                aria-pressed={Boolean(layer.locked)}
                onClick={() => setLayer(layer, { locked: layer.locked ? undefined : true })}
                className={toggle(Boolean(layer.locked))}
              >
                잠금
              </button>
            </li>
          );
        })}
      </ul>
      {layers.length === 0 ? (
        <p className="text-xs text-gray-400">
          얹은 자유 요소가 없습니다. 텍스트·요소·업로드 서랍에서 넣으면 여기 보입니다.
        </p>
      ) : null}
    </section>
  );
}
