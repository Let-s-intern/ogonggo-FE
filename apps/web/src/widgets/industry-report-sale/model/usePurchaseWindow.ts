'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** 팝업이 닫혔는지 보는 간격. 닫은 뒤 안내가 뜨기까지의 지연이라 짧게 두고, 확인 자체는 값 하나를 읽는 일이다. */
const POLL_MS = 500;
const WINDOW_NAME = 'ogonggo-industry-report-purchase';
const WINDOW_WIDTH = 480;
const WINDOW_HEIGHT = 760;

/** 화면 가운데에 놓는 팝업 옵션. `noopener` 를 주지 않는다 — 닫힘을 읽으려면 열린 창의 참조가 필요하다. */
function windowFeatures(): string {
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - WINDOW_WIDTH) / 2));
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - WINDOW_HEIGHT) / 2));
  return `popup=yes,width=${WINDOW_WIDTH},height=${WINDOW_HEIGHT},left=${left},top=${top},scrollbars=yes,resizable=yes`;
}

export interface PurchaseWindow {
  /** 구매 창을 연다. 구매 버튼의 클릭 처리 안에서 바로 불러야 팝업으로 인정된다. */
  open: (url: string) => void;
  /** 열기가 막혔을 때 같은 주소를 새 탭으로 여는 링크가 쓸 주소. 막히지 않았으면 `null`. */
  blockedUrl: string | null;
  /** 새 탭 링크를 눌렀을 때 부른다. 그 탭을 다녀오면 안내가 뜨게 한다. */
  markOpened: () => void;
  /** 구매 후 안내를 보일 때다. */
  settled: boolean;
}

/**
 * 렛츠커리어 구매 팝업을 열고, 사용자가 그 창에서 돌아왔다고 볼 수 있는 때를 알려 준다(PRD 7.1).
 *
 * 돌아온 때는 셋이다. 팝업이 닫혔을 때(주기적으로 `closed` 를 읽는다), 오공고 탭이 다시 보일 때
 * (`visibilitychange`), 오공고 창이 다시 포커스를 받을 때. 결제 도중 팝업이 다른 사이트를 지나면 `closed` 가
 * 잘못 읽힐 수 있어 뒤의 둘이 같은 안내를 맡는다. 구매 창을 연 적이 없으면 어느 쪽도 반응하지 않는다.
 *
 * 화면을 떠나면 주기 확인과 이벤트 구독을 모두 멈춘다.
 */
export function usePurchaseWindow(): PurchaseWindow {
  const popupRef = useRef<Window | null>(null);
  const timerRef = useRef<number | null>(null);
  const openedRef = useRef(false);
  const [blockedUrl, setBlockedUrl] = useState<string | null>(null);
  const [settled, setSettled] = useState(false);

  const stopPolling = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const onReturn = () => {
      if (openedRef.current) {
        setSettled(true);
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        onReturn();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onReturn);
      stopPolling();
    };
  }, [stopPolling]);

  const open = useCallback(
    (url: string) => {
      const popup = window.open(url, WINDOW_NAME, windowFeatures());
      if (!popup) {
        setBlockedUrl(url);
        return;
      }
      setBlockedUrl(null);
      setSettled(false);
      openedRef.current = true;
      popupRef.current = popup;
      stopPolling();
      timerRef.current = window.setInterval(() => {
        if (popupRef.current?.closed) {
          popupRef.current = null;
          stopPolling();
          setSettled(true);
        }
      }, POLL_MS);
    },
    [stopPolling],
  );

  const markOpened = useCallback(() => {
    openedRef.current = true;
  }, []);

  return { open, blockedUrl, markOpened, settled };
}
