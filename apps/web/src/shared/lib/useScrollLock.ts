import { useEffect } from 'react';

/**
 * 모달이 떠 있는 동안 뒤 페이지가 스크롤되지 않게 한다. `active` 가 꺼지거나 언마운트되면 원래
 * 값으로 되돌린다.
 *
 * `body` 와 `html` 을 함께 막는다. `body` 하나만 막으면 모바일 사파리처럼 문서 스크롤을 `html`
 * 이 맡는 브라우저에서 손가락으로 밀 때 뒤 화면이 따라 움직인다(모바일 공고 달력, 2026-09-30).
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }
    const { body, documentElement: html } = document;
    const previous = { body: body.style.overflow, html: html.style.overflow };
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    return () => {
      body.style.overflow = previous.body;
      html.style.overflow = previous.html;
    };
  }, [active]);
}
