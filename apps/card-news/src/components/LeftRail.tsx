'use client';

import type { ReactNode } from 'react';

/** 레일 한 칸과 그 서랍. */
export interface RailItem<K extends string> {
  key: K;
  label: string;
  drawer: ReactNode;
}

/**
 * 레일 칸 아이콘. Tabler Icons 3.34.0(MIT, `assets/icons/LICENSE-Tabler-Icons.txt`)의 외곽선 아이콘
 * `<svg>` 안쪽이다. 열쇠는 편집 화면(`CardEditor`)이 레일에 넘기는 `key` 다. 없는 열쇠는 글자만 그린다.
 */
const RAIL_ICONS: Record<string, string[]> = {
  template: [
    'M4 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
    'M14 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
    'M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
    'M14 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
  ],
  text: ['M4 20l3 0', 'M14 20l7 0', 'M6.9 15l6.9 0', 'M10.2 6.3l5.8 13.7', 'M5 20l6 -16l2 0l7 16'],
  elements: [
    'M12 3l-4 7h8z',
    'M17 17m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0',
    'M4 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z',
  ],
  upload: [
    'M15 8h.01',
    'M12.5 21h-6.5a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v6.5',
    'M3 16l5 -5c.928 -.893 2.072 -.893 3 0l3.5 3.5',
    'M14 14l1 -1c.679 -.653 1.473 -.829 2.214 -.526',
    'M19 22v-6',
    'M22 19l-3 -3l-3 3',
  ],
  jobs: [
    'M3 7m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z',
    'M8 7v-2a2 2 0 0 1 2 -2h4a2 2 0 0 1 2 2v2',
    'M12 12l0 .01',
    'M3 13a20 20 0 0 0 18 0',
  ],
};

function RailIcon({ name }: { name: string }) {
  const paths = RAIL_ICONS[name];
  if (!paths) {
    return null;
  }
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/**
 * 왼쪽 레일(72px)과 서랍(300px). 레일을 누르면 그 서랍을 열고, 같은 레일을 다시 누르면 서랍을 닫는다.
 * 닫힌 서랍은 그리지 않는다 — 서랍 안 입력값은 편집 상태에 있어 다시 열어도 그대로다.
 */
export function LeftRail<K extends string>({
  items,
  open,
  onOpenChange,
}: {
  items: RailItem<K>[];
  /** 열린 서랍. `null` 이면 닫혀 있다. */
  open: K | null;
  onOpenChange: (open: K | null) => void;
}) {
  const current = items.find((item) => item.key === open);
  return (
    <>
      <nav
        aria-label="왼쪽 메뉴"
        className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-r border-gray-200 bg-white py-2"
      >
        {items.map((item) => {
          const on = item.key === open;
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={on}
              onClick={() => onOpenChange(on ? null : item.key)}
              className={`flex h-14 w-[60px] flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold ${
                on ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <RailIcon name={item.key} />
              {item.label}
            </button>
          );
        })}
      </nav>
      {current ? (
        <aside
          aria-label={`${current.label} 서랍`}
          className="flex w-[300px] shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white"
        >
          {current.drawer}
        </aside>
      ) : null}
    </>
  );
}

/** 서랍 머리(제목)와 내용 틀. */
export function Drawer({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {children}
    </div>
  );
}
