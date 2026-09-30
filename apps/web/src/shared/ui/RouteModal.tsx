'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';
import { useScrollLock } from '@/shared/lib/useScrollLock';

export interface RouteModalProps {
  /** 닫기 버튼과 대화상자의 이름. 보조기술이 읽는다. */
  label: string;
  children: ReactNode;
}

/**
 * 가로채기 라우트(`app/(site)/calendar/@modal`)의 내용을 띄우는 모달. 열린 상태가 URL 이라 닫기는
 * `router.back()` 이다 — 뒤로가기로 닫히고 앞으로가기로 다시 열린다.
 *
 * `@ogonggo/ui` 의 `Modal` 을 쓰지 않는 이유는 그쪽이 `open` 상태와 제목 줄을 받는 모달이기
 * 때문이다. 여기는 마운트되면 열리고, 제목 없이 오른쪽 위 닫기 버튼 하나다
 * (`docs/asset/v6 공고달력/공고 상세 모달.png`). 네이티브 `<dialog>` 를 쓰는 이유는 같다 — 초점
 * 가둠과 Esc 닫기를 브라우저가 준다.
 *
 * 바깥(어두운 배경)을 눌러도 닫힌다. 클릭 대상이 `<dialog>` 자신이면 안쪽 판이 아니라 배경을
 * 누른 것이다.
 *
 * 모바일(`md` 미만)은 화면 전체를 덮는다. 폭 360px 에서 가장자리 여백을 남기면 폼과 상세의
 * 폭이 그만큼 더 줄고, 배경을 눌러 닫을 자리도 거의 남지 않는다.
 */
export function RouteModal({ label, children }: RouteModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);
  useScrollLock(true);

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onClose={() => router.back()}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          dialogRef.current?.close();
        }
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-white p-0 backdrop:bg-gray-950/50 md:m-auto md:h-auto md:max-h-[calc(100dvh-4rem)] md:w-[min(1000px,calc(100vw-2rem))] md:rounded-3xl md:py-3"
    >
      {/*
        스크롤은 안쪽 이 상자가 한다. 전에는 둥근 `dialog` 자신이 스크롤해서 스크롤바가 모서리 끝까지
        그려져 오른쪽 위·아래 모서리가 깨졌다. 바깥은 둥글게 자르기만 하고(`overflow-hidden`), 데스크톱은
        위아래를 `py-3` 만큼 띄워 스크롤바가 둥근 자리에 닿지 않게 한다. `max-h` 는 바깥 높이에서 그
        여백을 뺀 값이다.
      */}
      <div className="h-full overflow-y-auto overscroll-contain p-4 md:h-auto md:max-h-[calc(100dvh-5.5rem)] md:px-5 md:py-2">
        {/* 닫기 줄은 스크롤해도 위에 붙어 있다. 긴 상세·폼을 내려 읽다가 닫으려고 다시 맨 위까지
            올라가지 않게 한다. 배경을 칠해 아래로 지나가는 내용을 가린다. 붙는 자리는 스크롤 상자의
            안쪽 여백만큼 위(`-top-4`·`md:-top-2`)다 — `top-0` 이면 그 여백 틈으로 글이 비친다. */}
        <div className="sticky -top-4 z-20 -mx-4 -mt-4 flex justify-end bg-white px-4 pt-4 md:-top-2 md:-mx-5 md:-mt-2 md:px-5 md:pt-2">
          <button
            type="button"
            aria-label={`${label} 닫기`}
            onClick={() => dialogRef.current?.close()}
            className="rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
          </button>
        </div>
        <div className="pt-1">{children}</div>
      </div>
    </dialog>
  );
}
