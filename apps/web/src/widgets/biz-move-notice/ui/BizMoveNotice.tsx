'use client';

import { useEffect, useRef, useState } from 'react';
import { bizUrl, goToBiz, onBizLinkClick } from '@/shared/api/bizHandoff';

/** 이 탭에서 팝업을 이미 띄웠는지. 탭을 닫으면 지워진다. */
const SHOWN_IN_TAB_KEY = 'ogonggo.bizMovePopup.shown';
/** `하루 동안 보지 않기` 를 누른 때부터 24시간 뒤의 시각(ms). */
const HIDDEN_UNTIL_KEY = 'ogonggo.bizMovePopup.hiddenUntil';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 저장소를 막아 둔 브라우저(사생활 보호 모드 등)에서는 읽기·쓰기가 예외를 던진다. 그때는 팝업을 띄우지 않는다 —
 * 기억할 수 없으면 화면을 옮길 때마다 다시 뜬다. 배너는 그대로 보인다.
 */
function shouldShowPopup(): boolean {
  try {
    if (sessionStorage.getItem(SHOWN_IN_TAB_KEY)) return false;
    if (Number(localStorage.getItem(HIDDEN_UNTIL_KEY)) > Date.now()) return false;
    sessionStorage.setItem(SHOWN_IN_TAB_KEY, '1');
    return true;
  } catch {
    return false;
  }
}

function hideForOneDay() {
  try {
    localStorage.setItem(HIDDEN_UNTIL_KEY, String(Date.now() + ONE_DAY_MS));
  } catch {
    // 기억하지 못해도 이 탭에서는 다시 뜨지 않는다.
  }
}

/**
 * 웹 기업 마이페이지 맨 위의 비즈 오공고 안내(이슈 #649). 기업 회원 기능을 biz 로 옮기는 동안 웹의 기업
 * 마이페이지는 그대로 두고, 여기서 biz 로 넘긴다. 나중에 웹에서 기업 화면을 지울 때 함께 지운다.
 *
 * - 배너: 늘 보인다.
 * - 팝업: 탭마다 한 번 뜬다. `하루 동안 보지 않기` 를 누르면 24시간 동안 어느 탭에서도 뜨지 않는다.
 *
 * 이동 버튼은 지금 보는 화면과 같은 biz 경로로 간다. 기업 마이페이지 경로(`/mypage/company/...`)는 웹과 biz 가
 * 같다. 웹 로그인을 들고 가서 biz 에서 다시 로그인하지 않는다(`goToBiz`).
 */
export function BizMoveNotice({ pathname }: { pathname: string }) {
  const [popupOpen, setPopupOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // 저장소는 브라우저에만 있어 첫 렌더 뒤에 본다.
  useEffect(() => {
    if (shouldShowPopup()) setPopupOpen(true);
  }, []);

  useEffect(() => {
    if (!popupOpen) return;
    closeRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPopupOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [popupOpen]);

  return (
    <>
      <div className="mt-4 flex flex-col gap-3 rounded-xl bg-blue-50 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="font-semibold break-keep text-gray-900">
            기업 서비스는 비즈 오공고로 옮겼어요
          </p>
          <p className="mt-0.5 text-sm break-keep text-gray-600">
            공고 등록·관리와 광고 신청 내역을 비즈 오공고에서 한 번에 볼 수 있어요.
          </p>
        </div>
        {/* 다른 도메인이라 `Link` 가 아니라 `a` 다. */}
        <a
          href={bizUrl(pathname)}
          onClick={onBizLinkClick(pathname)}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md bg-blue-500 px-4 text-sm font-semibold whitespace-nowrap text-white hover:bg-blue-600"
        >
          비즈 오공고로 이동
        </a>
      </div>

      {popupOpen ? (
        // `<dialog>` 가 아닌 고정 층이다. `ContactEmailDialog` 와 같은 이유(토스트를 가리지 않게)다.
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/50 px-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) setPopupOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="biz-move-title"
            className="w-full max-w-[420px] rounded-3xl bg-white px-6 pt-6 pb-5"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="biz-move-title" className="text-lg font-bold break-keep text-gray-900">
                비즈 오공고가 열렸어요
              </h2>
              <button
                ref={closeRef}
                type="button"
                aria-label="닫기"
                onClick={() => setPopupOpen(false)}
                className="-mt-1 -mr-1 rounded-sm p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed break-keep text-gray-700">
              기업 회원 서비스는 이제 비즈 오공고에서 이용해 주세요. 공고 등록·관리와 광고 신청
              내역을 한 곳에서 볼 수 있어요. 지금 로그인한 계정 그대로 이동합니다.
            </p>
            <button
              type="button"
              onClick={() => void goToBiz(pathname)}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-md bg-blue-500 text-sm font-semibold text-white hover:bg-blue-600"
            >
              비즈 오공고로 이동
            </button>
            <button
              type="button"
              onClick={() => {
                hideForOneDay();
                setPopupOpen(false);
              }}
              className="mt-3 w-full py-1 text-center text-sm text-gray-500 hover:text-gray-700"
            >
              하루 동안 보지 않기
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
