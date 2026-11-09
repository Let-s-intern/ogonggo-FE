'use client';

import { useEffect } from 'react';

/**
 * `data-reveal` 이 붙은 요소를 화면에 들어올 때 떠오르게 한다(규칙은 `app/globals.css`). 처음 열었을 때 이미
 * 화면 안에 있는 요소는 바로 보이게 둔다 — 서버 HTML 로 보이던 것이 숨었다 다시 나오면 깜빡여 보인다.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    const pending = targets.filter((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.dataset.shown = '';
        return false;
      }
      return true;
    });
    root.classList.add('biz-reveal-ready');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = '';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    pending.forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      root.classList.remove('biz-reveal-ready');
    };
  }, []);

  return null;
}
