'use client';

import { useEffect, useRef, useState } from 'react';
import { promptInstall } from '../model/install';

/**
 * 모바일 헤더의 `앱 다운로드`. 누르면 브라우저가 넘겨준 설치 창을 띄우고, 띄울 수 없는 브라우저
 * (iOS 사파리, 삼성 인터넷 등)에서는 홈 화면에 추가하는 방법을 아래에서 올라오는 창으로 알린다.
 */
export function InstallAppButton() {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      {/* 버튼 틀(배경·테두리) 없이 파란 글자와 아이콘만 둔다 — 알약 버튼은 헤더에서 너무 무거웠다.
          아이콘은 휴대폰에 화살표가 내려오는 모양이라 "앱 설치" 가 바로 읽힌다. 한 덩어리 그림이라
          화살표만 따로 움직일 수 없어, 몇 초마다 아이콘 전체가 아래로 톡 튕긴다
          (`ogonggo-download-bounce`, `app/globals.css`). */}
      <button
        type="button"
        onClick={() => {
          void promptInstall().then((prompted) => {
            if (!prompted) setGuideOpen(true);
          });
        }}
        className="flex items-center gap-1 py-1 text-sm font-semibold text-blue-500 active:opacity-70"
      >
        <span
          aria-hidden="true"
          className="ogonggo-download-bounce block icon-[material-symbols--install-mobile-rounded] h-[18px] w-[18px]"
        />
        앱 다운로드
      </button>
      {guideOpen ? <InstallGuideSheet onClose={() => setGuideOpen(false)} /> : null}
    </>
  );
}

/** iPhone·iPad. iPadOS 는 데스크톱 사파리처럼 `Macintosh` 로 오므로 터치로 가린다. */
function isIos(): boolean {
  const { userAgent, maxTouchPoints } = navigator;
  return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}

function InstallGuideSheet({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const ios = isIos();

  useEffect(() => {
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const steps = ios
    ? [
        {
          icon: 'icon-[lucide--share]',
          text: '화면 아래(아이패드는 위)의 공유 버튼을 눌러 주세요',
        },
        { icon: 'icon-[lucide--square-plus]', text: "목록에서 '홈 화면에 추가'를 눌러 주세요" },
      ]
    : [
        {
          icon: 'icon-[lucide--ellipsis-vertical]',
          text: '브라우저 오른쪽 위의 메뉴를 눌러 주세요',
        },
        {
          icon: 'icon-[lucide--square-plus]',
          text: "'앱 설치' 또는 '홈 화면에 추가'를 눌러 주세요",
        },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-gray-950/50"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-guide-title"
        className="w-full rounded-t-3xl bg-white px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="install-guide-title" className="text-lg font-bold text-gray-900">
              오공고를 앱으로 쓰세요
            </h2>
            <p className="mt-1 text-sm break-keep text-gray-500">
              홈 화면에 추가하면 앱처럼 한 번에 열 수 있어요.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="설치 안내 닫기"
            onClick={onClose}
            className="-mt-1 -mr-1 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
          </button>
        </div>
        <ol className="mt-5 flex flex-col gap-3">
          {steps.map(({ icon, text }, index) => (
            <li key={text} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-500 shadow-sm">
                <span aria-hidden="true" className={`${icon} block h-5 w-5`} />
              </span>
              <span className="text-sm break-keep text-gray-800">
                <span className="mr-1 font-semibold text-blue-500">{index + 1}</span>
                {text}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
