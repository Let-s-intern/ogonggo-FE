'use client';

import { useEffect } from 'react';

/** 드롭다운으로 쓰는 `<details>` 에 붙이는 표시. `keep-on-select` 면 안쪽을 눌러도 닫지 않는다. */
export const DROPDOWN_ATTR = 'data-dropdown';

/**
 * `<details data-dropdown>` 드롭다운들을 한 번에 하나만 열리게 하고, 바깥을 누르거나 Esc 를 누르면 닫는다.
 *
 * 필터·정렬·점 세 개 메뉴가 자바스크립트 없이 여닫히도록 `<details>` 로 되어 있다(`SortToggle` 등). 그 방식은
 * 서버 컴포넌트로 남을 수 있는 대신, 각자 따로 열리고 바깥을 눌러도 닫히지 않는다 — 채용 공고 목록에서
 * `채용 형태`·`경력`·`최신순` 이 한꺼번에 열려 겹쳤다. 드롭다운마다 클라이언트 상태를 두는 대신 문서에
 * 리스너 하나를 둔다. 앱 전체에 한 번 걸린다(`app/providers.tsx`).
 *
 * - 누른 곳을 품지 않은 열린 드롭다운은 닫는다. 다른 드롭다운의 트리거를 누르면 앞의 것이 닫힌다.
 * - 드롭다운 안의 링크·버튼을 누르면 그 드롭다운도 닫는다. 옵션이 `<Link>` 라 화면을 옮겨도 목록은 그대로
 *   남아 있어서, 닫지 않으면 고른 뒤에도 열려 있다. 여러 개를 고르는 드롭다운은
 *   `data-dropdown="keep-on-select"` 로 이 동작에서 뺀다(`PositionSelect`).
 */
export function DropdownDismiss() {
  useEffect(() => {
    const openDropdowns = () =>
      Array.from(document.querySelectorAll<HTMLDetailsElement>(`details[${DROPDOWN_ATTR}][open]`));

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      for (const details of openDropdowns()) {
        if (!target || !details.contains(target)) {
          details.open = false;
        }
      }
    };
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const item = target?.closest('a, button');
      const details = item?.closest<HTMLDetailsElement>(`details[${DROPDOWN_ATTR}]`);
      // 트리거(`summary`) 안의 버튼은 여닫기 자체라 건드리지 않는다.
      if (
        details?.open &&
        !item?.closest('summary') &&
        details.getAttribute(DROPDOWN_ATTR) !== 'keep-on-select'
      ) {
        details.open = false;
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        for (const details of openDropdowns()) {
          details.open = false;
        }
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return null;
}
