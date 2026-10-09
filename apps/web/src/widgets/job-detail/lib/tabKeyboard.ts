import type { KeyboardEvent } from 'react';

/**
 * `role="tablist"` 의 키보드 이동(WAI-ARIA 탭 패턴). 누른 키가 가리키는 탭의 번호를 돌려주고, 탭 이동 키가
 * 아니면 `null` 이다. 왼쪽·오른쪽 화살표는 처음과 끝이 이어지고, Home·End 는 첫 탭과 마지막 탭이다.
 * Alt·Ctrl·Meta 와 함께 누른 화살표는 브라우저의 뒤로 가기 같은 단축키라 건드리지 않는다.
 */
export function nextTabIndex(
  event: Pick<KeyboardEvent, 'key' | 'altKey' | 'ctrlKey' | 'metaKey'>,
  current: number,
  count: number,
): number | null {
  if (event.altKey || event.ctrlKey || event.metaKey) {
    return null;
  }
  switch (event.key) {
    case 'ArrowRight':
      return (current + 1) % count;
    case 'ArrowLeft':
      return (current - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}
