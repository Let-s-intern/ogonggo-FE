'use client';

import { Drawer } from '../LeftRail';

/** 요소 서랍의 로고 하나. `src` 가 없으면 넣을 수 없다(공고 로고가 없을 때). */
export interface LogoItem {
  label: string;
  src: string | undefined;
}

/**
 * 요소 서랍. 1차는 로고(기업·렛츠커리어·오공고)만이다. 누르면 보고 있는 장 가운데에 이미지 요소로
 * 넣는다 — 템플릿의 로고 자리와 따로 옮기고 키운다.
 */
export function ElementsDrawer({
  logos,
  onAdd,
}: {
  logos: LogoItem[];
  onAdd: (src: string) => void;
}) {
  return (
    <Drawer title="요소">
      <p className="text-xs font-bold text-gray-500">로고</p>
      <div className="grid grid-cols-3 gap-2">
        {logos.map((logo) => (
          <button
            key={logo.label}
            type="button"
            disabled={!logo.src}
            title={logo.src ? undefined : '공고 로고가 없습니다'}
            onClick={() => logo.src && onAdd(logo.src)}
            className="flex flex-col items-center gap-1.5 rounded-lg bg-gray-100 p-2 text-xs text-gray-700 hover:bg-gray-200 disabled:opacity-40"
          >
            <span className="flex h-10 w-full items-center justify-center">
              {logo.src ? (
                <img src={logo.src} alt="" className="max-h-10 max-w-full object-contain" />
              ) : null}
            </span>
            {logo.label}
          </button>
        ))}
      </div>
    </Drawer>
  );
}
