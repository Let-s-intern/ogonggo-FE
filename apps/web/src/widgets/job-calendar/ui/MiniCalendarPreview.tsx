'use client';

import { useState } from 'react';
import { MiniCalendarPopover } from './MiniCalendarPopover';

/** 미니 달력이 목업대로 나오는지 눈으로 보기 위한 임시 껍데기. 헤더 줄이 생기면 사라진다. */
export function MiniCalendarPreview() {
  const [selected, setSelected] = useState(new Date());

  return (
    <div className="flex items-center gap-3">
      <span className="text-2xl font-bold text-gray-900">
        {selected.getFullYear()}.{String(selected.getMonth() + 1).padStart(2, '0')}
      </span>
      <MiniCalendarPopover selected={selected} onSelect={setSelected} />
    </div>
  );
}
