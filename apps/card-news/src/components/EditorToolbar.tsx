'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Select } from '@ogonggo/ui';
import { type RenderSlide, slideLabel } from '@/lib/card/document';
import { CARD_SIZE_IDS, CARD_SIZES, type CardSizeId } from '@/lib/card/types';
import { downloadSlides } from '@/lib/client/render';

function toggled<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (!next.delete(value)) {
    next.add(value);
  }
  return next;
}

/** 크기 이름(`피드 4:5 · 1080×1350`). */
function sizeName(id: CardSizeId): string {
  const { label, width, height } = CARD_SIZES[id];
  return `${label} · ${width}×${height}`;
}

/** 고를 수 있는 배율. `fit` 은 캔버스 칸에 맞춘다. */
const ZOOMS = [0.5, 0.75, 1] as const;

/**
 * 위 막대의 `내보내기`. 누르면 받을 장·크기를 고르는 메뉴가 펼쳐진다. 받기는 서버 렌더(PNG)다 — 캔버스와
 * 같은 JSX 를 이미지 생성기가 그린다.
 */
function ExportMenu({
  slides,
  names,
  title,
  size,
}: {
  /** 지금 시안으로 편 문서의 장. */
  slides: RenderSlide[];
  /** 장 이름(`slideName()`). `slides` 와 같은 순서다. */
  names: string[];
  /** 문서 제목. 묶어 받는 zip 이름에 쓴다. */
  title: string;
  size: CardSizeId;
}) {
  const [open, setOpen] = useState(false);
  // 받지 않을 장을 둔다. 문서에 장이 늘면 새 장은 받을 장으로 시작한다.
  const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
  // 처음 받을 크기는 열 때의 캔버스 크기다(빈 캔버스에서 고른 크기).
  const [sizes, setSizes] = useState<Set<CardSizeId>>(() => new Set([size]));
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // 메뉴 밖을 누르거나 Esc 를 누르면 닫는다. 받는 동안은 닫지 않는다(진행이 보이게).
  useEffect(() => {
    if (!open) {
      return;
    }
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !(event.target instanceof Node && rootRef.current?.contains(event.target))
      ) {
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);

  const targets = slides.flatMap(({ id, spec, role }, index) =>
    skipped.has(id) ? [] : [{ spec, role, index }],
  );
  const count = targets.length * sizes.size;

  const download = async () => {
    setError(null);
    setProgress('준비 중');
    try {
      await downloadSlides(targets, [...sizes], title, (done, total) =>
        setProgress(`${done}/${total}`),
      );
    } catch {
      setError('다운로드에 실패했습니다. 다시 시도해 주세요.');
    } finally {
      setProgress(null);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <Button size="sm" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {progress ? `만드는 중 ${progress}` : '내보내기'}
      </Button>
      {open ? (
        <div
          role="dialog"
          aria-label="내보내기"
          className="absolute right-0 top-full z-30 mt-2 flex w-72 flex-col gap-3 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200"
        >
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-gray-500">받을 장</span>
            {slides.map((slide, index) => (
              <label key={slide.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={!skipped.has(slide.id)}
                  onChange={() => setSkipped((current) => toggled(current, slide.id))}
                />
                {slideLabel(names[index] ?? '', index)}
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-1.5 border-t border-gray-100 pt-3">
            <span className="text-xs font-bold text-gray-500">받을 크기</span>
            {CARD_SIZE_IDS.map((id) => (
              <label key={id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4"
                  checked={sizes.has(id)}
                  onChange={() => setSizes((current) => toggled(current, id))}
                />
                {sizeName(id)}
              </label>
            ))}
          </div>
          <Button
            size="sm"
            disabled={count === 0 || progress !== null}
            onClick={() => void download()}
          >
            {progress ? `만드는 중 ${progress}` : `고른 ${count}장 받기`}
          </Button>
          {error ? <p className="text-sm text-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * 편집 화면 위 막대. 로고(시작 화면으로), 문서 제목 고치기, 묶음 배지, 실행 취소·다시 실행, 크기, 배율,
 * `AI로 수정`, `내보내기`. 문서를 아직 열지 않았거나 템플릿을 고르는 동안은 로고와 `actions` 만 그린다.
 */
export function EditorToolbar({
  title,
  onTitleChange,
  bundleCount,
  editing,
  actions,
}: {
  title: string | null;
  /** 빈 글이면 회사 이름 제목으로 돌린다. */
  onTitleChange: (title: string) => void;
  /** 묶음 문서면 묶은 공고 수. */
  bundleCount: number | null;
  /** 편집 중일 때만 주는 것들. */
  editing: {
    onUndo: () => void;
    onRedo: () => void;
    size: CardSizeId;
    onSizeChange: (size: CardSizeId) => void;
    /** 고른 배율. `null` 이면 칸에 맞춘다. */
    zoom: number | null;
    onZoomChange: (zoom: number | null) => void;
    /** 지금 캔버스가 그려진 배율(맞춤일 때 보인다). */
    scale: number;
    onAi: () => void;
    slides: RenderSlide[];
    names: string[];
  } | null;
  /** 오른쪽 끝에 더 둘 버튼(처음부터 다시, 로그아웃). */
  actions: ReactNode;
}) {
  const ghost =
    'inline-flex h-9 items-center rounded-lg px-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:text-gray-300';
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4">
      <Link href="/" className="flex shrink-0 items-baseline gap-1.5" title="시작 화면으로">
        <span className="text-base font-black text-blue-500">오공고</span>
        <span className="text-sm text-gray-500">카드뉴스</span>
      </Link>
      <span className="h-5 w-px shrink-0 bg-gray-200" />
      {title !== null ? (
        <input
          // 제목이 밖에서 바뀌면(실행 취소, 다른 문서) 칸을 새로 그린다.
          key={title}
          aria-label="문서 제목"
          defaultValue={title}
          onBlur={(event) => {
            if (event.target.value.trim() !== title) {
              onTitleChange(event.target.value.trim());
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              event.currentTarget.blur();
            } else if (event.key === 'Escape') {
              event.currentTarget.value = title;
              event.currentTarget.blur();
            }
          }}
          className="h-9 w-56 min-w-0 rounded-md border border-transparent px-2 text-sm font-bold hover:border-gray-200 focus:border-blue-500 focus:outline-none"
        />
      ) : null}
      {bundleCount !== null ? (
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
          묶음 {bundleCount}개 공고
        </span>
      ) : null}
      <span className="flex-1" />
      {editing ? (
        <>
          <span className="flex shrink-0 gap-1">
            <button type="button" className={ghost} onClick={editing.onUndo} title="Ctrl+Z">
              실행 취소
            </button>
            <button type="button" className={ghost} onClick={editing.onRedo} title="Ctrl+Shift+Z">
              다시 실행
            </button>
          </span>
          <Select
            aria-label="캔버스 크기"
            className="w-48 shrink-0"
            value={editing.size}
            onChange={(event) => editing.onSizeChange(event.target.value as CardSizeId)}
            options={CARD_SIZE_IDS.map((id) => ({ value: id, label: sizeName(id) }))}
          />
          <Select
            aria-label="배율"
            className="w-28 shrink-0"
            value={editing.zoom === null ? 'fit' : String(editing.zoom)}
            onChange={(event) =>
              editing.onZoomChange(event.target.value === 'fit' ? null : Number(event.target.value))
            }
            options={[
              {
                value: 'fit',
                label:
                  editing.zoom === null ? `맞춤 ${Math.round(editing.scale * 100)}%` : '맞춤',
              },
              ...ZOOMS.map((zoom) => ({ value: String(zoom), label: `${zoom * 100}%` })),
            ]}
          />
          <Button size="sm" variant="secondary" className="shrink-0" onClick={editing.onAi}>
            AI로 수정
          </Button>
          <ExportMenu
            slides={editing.slides}
            names={editing.names}
            title={title ?? ''}
            size={editing.size}
          />
        </>
      ) : null}
      <span className="flex shrink-0 gap-1">{actions}</span>
    </header>
  );
}
