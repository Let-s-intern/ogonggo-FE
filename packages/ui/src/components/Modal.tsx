'use client';

/*
 * 훅을 쓰므로 클라이언트 경계다.
 *
 * `apps/web` 은 Next 서버 컴포넌트가 기본이고, 서버 컴포넌트가 `@ogonggo/ui` 에서 무엇 하나만
 * 가져와도 배럴(`index.ts`)을 통해 이 파일까지 딸려 들어온다. 이 줄이 없으면 그 순간
 * "useEffect only works in Client Components" 로 빌드가 깨진다 — `apps/web` 의 `not-found.tsx`
 * 가 실제로 그렇게 깨졌다.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ModalProps {
  open: boolean;
  title: string;
  /** 제목 아래 회색 보조 문구. */
  description?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

/**
 * 네이티브 `<dialog>` 위에 올린 모달.
 *
 * 직접 만들지 않는 이유는 `showModal()` 이 공짜로 주는 것들 때문이다 — 뒤 화면으로 초점이
 * 새지 않는 초점 가둠, Esc 로 닫기, 그리고 페이지 위에 겹치는 최상위 레이어. 이 셋을 손으로
 * 만들면 대부분 초점 가둠에서 틀린다.
 *
 * `close` 이벤트로 닫힘을 알린다. Esc 는 브라우저가 직접 처리하므로 키 핸들러를 따로 걸면
 * 두 번 닫히거나 상태가 어긋난다.
 *
 * 열려 있는 동안 뒤 화면의 스크롤을 막는다. 막지 않으면 모달 안에서 스크롤이 끝났을 때 뒤
 * 페이지가 대신 움직인다.
 *
 * 어드민처럼 오른쪽에 AI 비서 패널이 붙은 화면(조상에 `--assistant-width` 가 있다)에서는 `showModal()` 을 쓰지
 * 않는다. 최상위 레이어와 어두운 막이 패널까지 덮고 뒤 화면을 모두 막아, 모달을 띄운 채 비서에게 묻지 못했다
 * (2026-11-05 사용자). 그때는 열린 `<dialog>`(`show`)를 패널 폭만큼 비켜 세우고 막도 그 폭만큼만 덮는다
 * (어드민 `JobReviewDialog` 와 같은 방식). 초점 가둠은 없어지고, Esc 는 직접 받는다.
 */
export function Modal({ open, title, description, onClose, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 비서 패널을 비켜 서는지. 열 때 조상의 `--assistant-width` 로 정한다.
  const [besideAssistant, setBesideAssistant] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      const beside = getComputedStyle(dialog).getPropertyValue('--assistant-width').trim() !== '';
      setBesideAssistant(beside);
      if (beside) {
        dialog.show();
      } else {
        dialog.showModal();
      }
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // 열린 `<dialog>`(`show`)는 Esc 로 닫히지 않아 직접 받는다. `showModal` 일 때는 브라우저가 닫는다.
  useEffect(() => {
    if (!open || !besideAssistant) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dialogRef.current?.close();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, besideAssistant]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {open && besideAssistant ? (
        <div
          aria-hidden="true"
          className="fixed inset-y-0 left-0 right-[var(--assistant-width)] z-40 bg-gray-950/40"
        />
      ) : null}
      <dialog
        ref={dialogRef}
        onClose={onClose}
        className={cn(
          'm-auto w-[min(36rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white p-6',
          'backdrop:bg-gray-950/40',
          besideAssistant &&
            'fixed inset-y-0 left-0 right-[var(--assistant-width)] z-50 h-fit max-h-[calc(100vh-2rem)] w-[min(36rem,calc(100vw-var(--assistant-width)-2rem))] overflow-y-auto',
          className,
        )}
      >
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {description ? <p className="pt-1 text-sm text-gray-500">{description}</p> : null}
        <div className="pt-4">{children}</div>
      </dialog>
    </>
  );
}
