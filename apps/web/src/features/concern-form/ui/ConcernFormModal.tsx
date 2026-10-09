'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { ToastProvider, useToast } from '@ogonggo/ui';
import { useScrollLock } from '@/shared/lib/useScrollLock';
import { createConcernPost, saveFailureMessage, updateConcernPost } from '../api/concernFormApi';
import type { ConcernFormInitial, ConcernFormValues } from '../model/values';
import { ConcernForm } from './ConcernForm';

export interface ConcernFormModalProps {
  open: boolean;
  /** 닫기 버튼·취소·Esc, 그리고 저장에 성공한 뒤에 불린다. 열림 상태는 부르는 쪽이 들고 있다. */
  onClose: () => void;
  /** 있으면 수정 모드로 이 글의 값으로 시작한다. 없으면 새 글이다. */
  initial?: ConcernFormInitial;
  /**
   * 저장에 성공한 뒤(`onClose` 다음) 불린다. 작성은 새 글의 id, 수정은 고친 글의 id 다. 주면 기본 동작을
   * 대신한다 — 기본은 작성이면 `/concerns/<새 id>` 로 이동, 수정이면 `router.refresh()` 로 보던 상세를
   * 다시 읽는 것이다.
   */
  onSuccess?: (id: number) => void;
}

/**
 * 고민 작성·수정 모달(시안 `고민 올리기 모달.png`). 데스크톱은 화면 가운데, 모바일은 화면 전체를 덮는다
 * (`shared/ui/RouteModal.tsx` 와 같다).
 *
 * `RouteModal` 은 주소가 열림 상태인 가로채기 라우트용이라 쓰지 않는다. 이 모달은 목록의 `고민 올리기`,
 * 하단 배너, 상세의 `수정` 이 각자 `open` 을 들고 연다. 닫혀 있는 동안은 아무것도 그리지 않아 열 때마다
 * 폼이 새로 마운트되고, 앞서 쓰다 만 글이나 다른 글의 수정 값이 남지 않는다.
 */
export function ConcernFormModal({ open, onClose, initial, onSuccess }: ConcernFormModalProps) {
  if (!open) {
    return null;
  }
  return <ConcernFormDialog onClose={onClose} initial={initial} onSuccess={onSuccess} />;
}

type DialogProps = Omit<ConcernFormModalProps, 'open'>;

/**
 * 네이티브 `<dialog>` 를 `showModal()` 로 연다. 초점 가둠과 Esc 닫기를 브라우저가 준다.
 *
 * 데스크톱 높이는 `md:h-fit` 이다. `<dialog>` 의 기본이 `fit-content` 인데 `h-auto` 로 덮으면 고정 배치(`inset: 0`) 의
 * 위아래가 모두 잡혀 내용이 짧아도 화면 높이까지 늘어난다.
 *
 * 바깥(어두운 배경) 을 눌러도 닫지 않는다. `RouteModal` 은 닫지만 이쪽은 쓰던 글이 있는 폼이라, 스크롤바나
 * 가장자리를 잘못 눌러 2000 자가 사라지면 되돌릴 수 없다. 닫기는 버튼·취소·Esc 로 한다.
 *
 * 저장하는 동안은 오른쪽 위 X 와 Esc 로도 닫지 못한다(취소 버튼처럼). 닫으면 모달이 사라지면서 안쪽 토스트 영역도
 * 같이 사라져, 이어서 저장이 실패해도 알릴 곳이 없고 쓰던 글만 잃는다. 성공하면 닫은 뒤에 새 글로 이동하는 것도
 * 어색하다. 저장 중인지는 저장을 들고 있는 `ConcernFormBody` 가 알려 준다.
 *
 * 토스트 영역(`ToastProvider`)을 안에 하나 더 둔다. `showModal()` 은 브라우저 최상위 층에 그려져서 앱
 * 바깥의 토스트(`z-50`)가 모달 뒤에 가려진다(`features/share-posting` 이 같은 이유로 `<dialog>` 를 피했다).
 * 안쪽 영역은 모달과 같은 층에 있어 실패 토스트가 모달 위에 보인다.
 */
function ConcernFormDialog({ onClose, initial, onSuccess }: DialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  useScrollLock(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    // 열자마자 제목 칸에 커서를 둔다. 열기 전에는 `<dialog>` 안이 그려지지 않아 초점이 가지 않는다.
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  }, []);

  // Esc 를 두 번 이상 누르면 브라우저는 `cancel` 을 막을 수 없게 두고 그대로 닫는다(열린 창에 가두지 않으려는
  // 규칙). 저장 중에는 키 입력 자체를 막는다. 저장하는 동안 버튼이 꺼져 초점이 문서로 떨어지므로 창이 아니라
  // 문서에서 받는다.
  useEffect(() => {
    if (!pending) {
      return;
    }
    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', blockEscape, true);
    return () => document.removeEventListener('keydown', blockEscape, true);
  }, [pending]);

  const editing = initial !== undefined;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Esc. 저장 중에는 닫지 않는다.
        if (pending) {
          event.preventDefault();
        }
      }}
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-white p-0 backdrop:bg-gray-950/50 md:m-auto md:h-fit md:max-h-[calc(100dvh-4rem)] md:w-[min(720px,calc(100vw-2rem))] md:rounded-3xl md:py-3"
    >
      <div className="h-full overflow-y-auto overscroll-contain px-5 py-5 md:h-auto md:max-h-[calc(100dvh-5.5rem)] md:px-7 md:py-4">
        <div className="flex items-start justify-between gap-4 pb-6">
          <h2 id={titleId} className="text-lg font-bold text-gray-950">
            {editing ? '취준 고민 수정하기' : '취준 고민 올리기'}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            disabled={pending}
            onClick={() => dialogRef.current?.close()}
            className="-m-1 rounded-sm p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400"
          >
            <span aria-hidden="true" className="icon-[lucide--x] block h-6 w-6" />
          </button>
        </div>
        <ToastProvider>
          <ConcernFormBody
            initial={initial}
            onCancel={() => dialogRef.current?.close()}
            onClose={onClose}
            onSuccess={onSuccess}
            onPendingChange={setPending}
          />
        </ToastProvider>
      </div>
    </dialog>
  );
}

interface BodyProps {
  initial?: ConcernFormInitial;
  onCancel: () => void;
  onClose: () => void;
  onSuccess?: (id: number) => void;
  /** 저장을 보내기 시작하면 `true`, 성공이든 실패든 끝나면 `false`. 바깥의 X·Esc 를 막는 데 쓴다. */
  onPendingChange: (pending: boolean) => void;
}

/** 폼과 저장. 안쪽 `ToastProvider` 아래라야 `useToast` 가 모달 안의 토스트 영역을 쓴다. */
function ConcernFormBody({ initial, onCancel, onClose, onSuccess, onPendingChange }: BodyProps) {
  const router = useRouter();
  const toast = useToast();
  const editing = initial !== undefined;

  const save = useMutation({
    mutationFn: async (values: ConcernFormValues): Promise<number> => {
      if (initial) {
        await updateConcernPost(initial.id, values);
        return initial.id;
      }
      return createConcernPost(values);
    },
    onMutate: () => onPendingChange(true),
    onSettled: () => onPendingChange(false),
    onSuccess: (id) => {
      onClose();
      if (onSuccess) {
        onSuccess(id);
      } else if (editing) {
        router.refresh();
      } else {
        router.push(`/concerns/${id}`);
      }
    },
    onError: (error) => toast.show({ message: saveFailureMessage(error, editing), tone: 'error' }),
  });

  return (
    <ConcernForm
      initial={initial}
      submitLabel={editing ? '수정하기' : '등록하기'}
      pendingLabel={editing ? '수정 중' : '등록 중'}
      pending={save.isPending}
      onSubmit={(values) => save.mutate(values)}
      onCancel={onCancel}
    />
  );
}
