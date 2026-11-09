'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const DURATION_MS = 1600;
/** `월 10만명+`, `6.7만+`, `20,000+` 처럼 앞뒤 글자 사이의 첫 숫자만 센다. */
const NUMBER = /\d[\d,]*(?:\.\d+)?/;

function format(n: number, decimals: number, grouped: boolean) {
  const fixed = n.toFixed(decimals);
  if (!grouped) return fixed;
  const [int = '0', frac] = fixed.split('.');
  return `${Number(int).toLocaleString('ko-KR')}${frac ? `.${frac}` : ''}`;
}

/**
 * 수치가 화면에 들어오면 0부터 올라간다(2026-11-09 사용자). 서버 HTML 은 최종 값이라 스크립트가 없으면 그대로
 * 보이고, `prefers-reduced-motion` 이면 세지 않는다. 읽기 도구에는 최종 값만 읽힌다.
 */
export function CountUp({ value, delay = 0 }: { value: string; delay?: number }) {
  const match = NUMBER.exec(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [current, setCurrent] = useState<string | null>(null);

  const raw = match?.[0] ?? '';
  const target = Number(raw.replaceAll(',', ''));
  const decimals = raw.split('.')[1]?.length ?? 0;
  const grouped = raw.includes(',');

  useLayoutEffect(() => {
    if (!raw || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setCurrent(format(0, decimals, grouped));
  }, [raw, decimals, grouped]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !raw || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        timer = window.setTimeout(() => {
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min((now - start) / DURATION_MS, 1);
            const eased = 1 - (1 - t) ** 3;
            setCurrent(format(target * eased, decimals, grouped));
            if (t < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        }, delay);
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [raw, target, decimals, grouped, delay]);

  if (!match) return <>{value}</>;
  const before = value.slice(0, match.index);
  const after = value.slice(match.index + raw.length);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {before}
        {current ?? raw}
        {after}
      </span>
    </>
  );
}
