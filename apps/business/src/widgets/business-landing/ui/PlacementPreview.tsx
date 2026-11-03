import { cn } from '@ogonggo/ui';
import {
  AD_PAGE_LABELS,
  type AdPlacementKey,
  type AdPlacementPage,
} from '@/entities/advertisement';

/**
 * 페이지별 구좌 위치 미리보기. 시안의 `페이지를 고르면 구좌 위치가 그대로 보여요` 화면을 회색 블록으로 줄여 그린다.
 * 실제 화면 캡처가 아니라 자리만 보이는 도식이다 — 구좌 블록만 파란 테두리와 번호가 붙고, 고른 구좌는 채워진다.
 *
 * 블록 배치는 PRD `취준생 화면 광고 구좌 위치` 의 자리를 따른다. 구좌 키가 늘면 여기 배치에도 한 줄 더한다.
 */

type Block = { kind: 'slot'; key: AdPlacementKey; shape: Shape } | { kind: 'filler'; shape: Shape };

type Shape =
  | 'carousel'
  | 'cards'
  | 'banner'
  | 'row'
  | 'rows'
  | 'detail'
  | 'calendar'
  | 'strip'
  | 'card';

const LAYOUTS: Record<AdPlacementPage, Block[]> = {
  JOB_LIST: [
    { kind: 'slot', key: 'RECOMMEND_TOP_RECRUIT', shape: 'carousel' },
    { kind: 'slot', key: 'ACTIVE_RECRUIT', shape: 'cards' },
    { kind: 'slot', key: 'MAIN_TOP_BANNER_RECRUIT', shape: 'banner' },
    { kind: 'slot', key: 'LIST_TOP_RECRUIT', shape: 'row' },
    { kind: 'filler', shape: 'rows' },
    { kind: 'slot', key: 'MAIN_BOTTOM_BANNER_RECRUIT', shape: 'banner' },
  ],
  BOOTCAMP_LIST: [
    { kind: 'slot', key: 'ACTIVE_EDU', shape: 'cards' },
    { kind: 'slot', key: 'MAIN_TOP_BANNER_EDU', shape: 'banner' },
    { kind: 'filler', shape: 'rows' },
    { kind: 'slot', key: 'MAIN_BOTTOM_BANNER_EDU', shape: 'banner' },
  ],
  JOB_DETAIL: [
    { kind: 'filler', shape: 'detail' },
    { kind: 'slot', key: 'SIMILAR_TOP_RECRUIT', shape: 'row' },
    { kind: 'filler', shape: 'rows' },
  ],
  BOOTCAMP_DETAIL: [
    { kind: 'filler', shape: 'detail' },
    { kind: 'slot', key: 'SIMILAR_TOP_EDU', shape: 'row' },
    { kind: 'filler', shape: 'rows' },
  ],
  JOB_CALENDAR: [
    { kind: 'slot', key: 'CALENDAR_TOP', shape: 'strip' },
    { kind: 'filler', shape: 'calendar' },
  ],
  MY_SCHEDULE: [
    { kind: 'slot', key: 'MY_DASHBOARD_SCRAP', shape: 'card' },
    { kind: 'filler', shape: 'rows' },
  ],
};

export interface PlacementPreviewProps {
  page: AdPlacementPage;
  /** 화면에 있는 구좌 키 순서. 번호가 이 순서다(상품 카드와 같다). */
  keys: readonly AdPlacementKey[];
  selected: AdPlacementKey | undefined;
  onSelect: (key: AdPlacementKey) => void;
}

export function PlacementPreview({ page, keys, selected, onSelect }: PlacementPreviewProps) {
  const blocks = LAYOUTS[page].filter(
    (block) => block.kind === 'filler' || keys.includes(block.key),
  );
  return (
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
        <span aria-hidden="true" className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-gray-300" />
          <span className="h-2 w-2 rounded-full bg-gray-300" />
          <span className="h-2 w-2 rounded-full bg-gray-300" />
        </span>
        <span className="truncate rounded-xs bg-white px-3 py-0.5 text-xs text-gray-500">
          {AD_PAGE_LABELS[page].url}
        </span>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {blocks.map((block, index) =>
          block.kind === 'filler' ? (
            <Filler key={`filler-${index}`} shape={block.shape} />
          ) : (
            <button
              key={block.key}
              type="button"
              onClick={() => onSelect(block.key)}
              aria-pressed={selected === block.key}
              aria-label={`${keys.indexOf(block.key) + 1}번 구좌 위치`}
              className={cn(
                'relative rounded-sm border-2 border-dashed p-2 text-left transition-colors',
                selected === block.key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-blue-200 bg-white hover:border-blue-400',
              )}
            >
              <span className="absolute -top-2.5 -left-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[11px] font-bold text-white">
                {keys.indexOf(block.key) + 1}
              </span>
              <span className="absolute top-1.5 right-1.5 rounded-xs bg-gray-900/70 px-1 text-[10px] font-bold text-white">
                AD
              </span>
              <ShapeBody shape={block.shape} accent />
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function Filler({ shape }: { shape: Shape }) {
  return (
    <div aria-hidden="true" className="p-2">
      <ShapeBody shape={shape} />
    </div>
  );
}

const bar = (accent?: boolean) => (accent ? 'bg-blue-200' : 'bg-gray-100');

function ShapeBody({ shape, accent }: { shape: Shape; accent?: boolean }) {
  switch (shape) {
    case 'carousel':
      return (
        <span className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn('h-14 rounded-xs', i === 0 ? bar(accent) : 'bg-gray-100')}
            />
          ))}
        </span>
      );
    case 'cards':
      return (
        <span className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn('h-12 rounded-xs', bar(accent))} />
          ))}
        </span>
      );
    case 'banner':
      return <span className={cn('block h-8 rounded-xs', bar(accent))} />;
    case 'row':
      return (
        <span className="flex items-center gap-2">
          <span className={cn('h-8 w-8 shrink-0 rounded-xs', bar(accent))} />
          <span className={cn('h-3 flex-1 rounded-xs', bar(accent))} />
        </span>
      );
    case 'rows':
      return (
        <span className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="h-8 w-8 shrink-0 rounded-xs bg-gray-100" />
              <span className="h-3 flex-1 rounded-xs bg-gray-100" />
            </span>
          ))}
        </span>
      );
    case 'detail':
      return (
        <span className="flex flex-col gap-2">
          <span className="h-4 w-1/2 rounded-xs bg-gray-200" />
          <span className="h-3 w-1/3 rounded-xs bg-gray-100" />
          <span className="h-16 rounded-xs bg-gray-100" />
        </span>
      );
    case 'strip':
      return (
        <span className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={cn('h-6 flex-1 rounded-full', bar(accent))} />
          ))}
        </span>
      );
    case 'calendar':
      return (
        <span className="grid grid-cols-7 gap-1">
          {Array.from({ length: 21 }, (_, i) => (
            <span
              key={i}
              className={cn('h-7 rounded-xs bg-gray-100', i === 10 && 'ring-2 ring-blue-300')}
            />
          ))}
        </span>
      );
    case 'card':
      return (
        <span className="flex items-center gap-2">
          <span className={cn('h-12 w-12 shrink-0 rounded-xs', bar(accent))} />
          <span className="flex flex-1 flex-col gap-1.5">
            <span className={cn('h-3 w-2/3 rounded-xs', bar(accent))} />
            <span className={cn('h-3 w-1/3 rounded-xs', bar(accent))} />
          </span>
        </span>
      );
  }
}
