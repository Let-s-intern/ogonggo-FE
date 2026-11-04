import { useEffect } from 'react';

export interface NewJobReviewShortcutHandlers {
  scrollUp: () => void;
  scrollDown: () => void;
  previous: () => void;
  next: () => void;
  inspect: () => void;
  toggleHidden: () => void;
  edit: () => void;
}

/**
 * 오늘 올라온 공고 검수의 키보드 흐름.
 *
 *   W / S   마우스가 마지막에 올라간 칸(기본은 왼쪽) 위·아래 스크롤
 *   A / D   이전·다음 건
 *   Space   검수 완료 체크 후 다음 건(이미 체크했으면 다음 건만)
 *   H       비노출 / 다시 노출
 *   E       내용 수정
 *
 * 검수 대기의 `useReviewShortcuts` 와 같은 규칙이다. 핸들러 이름이 승인·반려에 묶여 있어 그대로 쓰지 않는다.
 * `document` 에 걸고, 입력 요소에 포커스가 있으면 아무것도 하지 않고, Space 의 기본 동작(한 화면 스크롤)을 막는다.
 */
export function useNewJobReviewShortcuts({
  enabled,
  handlers,
}: {
  enabled: boolean;
  handlers: NewJobReviewShortcutHandlers;
}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      // 버튼에 포커스가 있으면 Space 는 그 버튼을 누른다. 가로채면 버튼과 단축키가 함께 돈다.
      if (event.code === 'Space' && event.target instanceof HTMLButtonElement) {
        return;
      }
      const action = {
        KeyW: handlers.scrollUp,
        KeyS: handlers.scrollDown,
        KeyA: handlers.previous,
        KeyD: handlers.next,
        Space: handlers.inspect,
        KeyH: handlers.toggleHidden,
        KeyE: handlers.edit,
      }[event.code];
      if (action) {
        event.preventDefault();
        action();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handlers]);
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
