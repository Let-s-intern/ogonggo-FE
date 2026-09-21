'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, type ReactNode } from 'react';

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
 */
export function RouteModal({ label, children }: RouteModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

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
      className="m-auto max-h-[calc(100dvh-4rem)] w-[min(1000px,calc(100vw-2rem))] overflow-y-auto rounded-3xl bg-white p-5 backdrop:bg-gray-950/50"
    >
      <div className="flex justify-end">
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
    </dialog>
  );
}
