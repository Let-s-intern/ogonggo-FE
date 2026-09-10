import { useEffect, type RefObject } from 'react';

export interface ReviewShortcutHandlers {
  scrollUp: () => void;
  scrollDown: () => void;
  previous: () => void;
  next: () => void;
  approve: () => void;
  openReject: () => void;
}

export interface UseReviewShortcutsOptions {
  /** 반려 사유 입력 중에는 모든 단축키를 끈다. 글자가 명령이 되면 사유를 쓸 수 없다. */
  enabled: boolean;
  handlers: ReviewShortcutHandlers;
}

/**
 * 검수 화면의 키보드 흐름.
 *
 *   W / S   본문 위·아래 스크롤
 *   A / D   이전·다음 대기 건
 *   Space   허용
 *   Backspace 반려 (사유 입력이 열린다)
 *
 * `document` 에 건다. 특정 요소에 걸면 그 요소가 포커스를 잃는 순간 — 운영자가 원문 링크를
 * 한 번 누르기만 해도 — 단축키가 통째로 죽는다.
 *
 * **기본 동작을 반드시 막아야 하는 키가 둘 있다.** Space 는 페이지를 한 화면 내리고,
 * Backspace 는 브라우저에 따라 뒤로 가기다. 막지 않으면 허용을 누를 때마다 화면이 튀고,
 * 반려를 누르면 검수 화면에서 빠져나간다.
 *
 * 입력 요소에 포커스가 있으면 아무것도 하지 않는다. `enabled` 로도 끄지만, 그것과 별개로
 * 검사한다 — 나중에 이 화면에 검색 상자 하나만 늘어도 같은 사고가 난다.
 */
export function useReviewShortcuts({ enabled, handlers }: UseReviewShortcutsOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      switch (event.code) {
        case 'KeyW':
          event.preventDefault();
          handlers.scrollUp();
          return;
        case 'KeyS':
          event.preventDefault();
          handlers.scrollDown();
          return;
        case 'KeyA':
          event.preventDefault();
          handlers.previous();
          return;
        case 'KeyD':
          event.preventDefault();
          handlers.next();
          return;
        case 'Space':
          // 막지 않으면 한 화면 아래로 스크롤된다.
          event.preventDefault();
          handlers.approve();
          return;
        case 'Backspace':
          // 막지 않으면 브라우저에 따라 뒤로 간다.
          event.preventDefault();
          handlers.openReject();
          return;
        default:
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handlers]);
}

/**
 * 반려 사유 입력의 단축키. Ctrl+Enter 로 보내고 Esc 로 닫는다.
 *
 * textarea 에 직접 건다. 여기서는 글자가 명령이 아니라 내용이라, 문서 전체에 걸 이유가 없다.
 * macOS 를 위해 Cmd+Enter 도 함께 받는다.
 */
export function useRejectFormShortcuts(
  ref: RefObject<HTMLTextAreaElement | null>,
  { submit, cancel }: { submit: () => void; cancel: () => void },
) {
  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        submit();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    }

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [ref, submit, cancel]);
}

/** 입력 중인지. `contentEditable` 까지 본다. */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable === true
  );
}
