'use client';

import { useEffect, useState } from 'react';
import { Logo } from '@/shared/ui/Logo';

const SEEN_KEY = 'ogonggo.web.webPromptSeen';
/** 저절로 닫히기까지. 읽을 시간은 주되 목록을 오래 가리지 않는다. */
const AUTO_CLOSE_MS = 6000;

/**
 * 모바일에서 "웹에서 보면 더 편하다" 고 알리는 하단 알림
 * (`docs/asset/v10 mobile/지원신청내역 알럿.png`). 시안에는 같은 뜻의 모달도 있지만 알림만
 * 쓰고, 이 브라우저에서 처음 들어왔을 때 한 번만 띄운다(2026-09-28, 사용자).
 *
 * 본 적이 있는지는 `localStorage` 에 남긴다. 저장소를 못 쓰는 브라우저(사생활 보호 모드 등)
 * 에서는 매번 뜨는 대신 조용히 넘어가지 않도록 읽기 실패를 "처음" 으로 본다 — 한 번 더 보이는
 * 것이 이 알림의 가장 나쁜 결과다.
 *
 * 데스크톱에서는 그리지 않고 본 것으로 치지도 않는다. 이미 웹 화면이다.
 */
export function WebPromptToast({ message }: { message: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 데스크톱에서 먼저 들렀다고 "본 것" 으로 치면 정작 모바일에서 한 번도 못 본다.
    if (window.matchMedia('(min-width: 768px)').matches) {
      return;
    }
    let seen = false;
    try {
      seen = localStorage.getItem(SEEN_KEY) === '1';
      localStorage.setItem(SEEN_KEY, '1');
    } catch {
      // 위 주석대로 처음으로 본다.
    }
    if (seen) {
      return;
    }
    setOpen(true);
    const timer = window.setTimeout(() => setOpen(false), AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 rounded-xl bg-gray-700/95 px-4 py-3 text-sm text-white shadow-lg md:hidden"
    >
      <span className="flex h-7 w-9 shrink-0 items-center justify-center rounded-md bg-blue-100">
        <Logo className="h-[9px] w-[19px] text-blue-500" />
      </span>
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        aria-label="알림 닫기"
        onClick={() => setOpen(false)}
        className="-mr-1 p-1 text-gray-300"
      >
        <span aria-hidden="true" className="icon-[lucide--x] block h-4 w-4" />
      </button>
    </div>
  );
}
