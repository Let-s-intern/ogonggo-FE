import type { ReactNode } from 'react';
import { AlertIcon } from './icons';

/**
 * 푸터에 적힌 것과 같은 연락처다(`widgets/site-footer/ui/SiteFooter.tsx`).
 * 전화번호는 화면에 두지 않는다 — 이메일 하나로 받는다.
 */
export const SUPPORT_EMAIL = 'official@letscareer.co.kr';

export interface ErrorStateProps {
  title: string;
  description: string;
  /** 오류 코드처럼 문의할 때 같이 알려주면 좋은 값. */
  hint?: string;
  /** `다시 시도`·`홈으로` 같은 버튼들. */
  actions?: ReactNode;
}

/**
 * 오류 화면의 공통 뼈대. `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` 셋이
 * 같은 모양을 쓴다 — 세 화면이 서로 다르게 생기면 사용자는 다른 고장이라고 읽는다.
 *
 * 배경 박스를 두지 않는다. 한때 홈 히어로처럼 `bg-blue-50` 박스에 담아봤는데, 오류 화면은
 * 무언가를 보여주는 자리가 아니라 아무것도 못 보여준 자리라 큰 색 덩어리가 어울리지 않았다.
 *
 * 세로 간격은 묶음 안이 좁고 묶음 사이가 넓다 — 아이콘·제목·설명이 한 덩어리(24/8),
 * 버튼이 그 다음(32), 문의가 마지막(40)이다. `gap` 하나로 전부 같은 간격을 주면 세 덩어리가
 * 흩어져 보인다.
 */
export function ErrorState({ title, description, hint, actions }: ErrorStateProps) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-white px-6 py-24 text-center">
      <AlertIcon className="h-11 w-11 text-gray-300" />
      <h1 className="mt-6 text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-500">
        {description}
      </p>

      {actions ? (
        <div className="mt-8 flex items-center justify-center gap-3">{actions}</div>
      ) : null}

      <p className="mt-10 text-xs text-gray-400">
        도움이 필요하면 편하게 알려주세요{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-blue-500 hover:underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
      {hint ? <p className="mt-1.5 font-mono text-[11px] text-gray-300">{hint}</p> : null}
    </main>
  );
}

/**
 * 오류 화면 버튼의 공통 크기. 두 버튼의 글자 수가 달라도 너비가 같아야 한다 —
 * `다시 시도`(5자)와 `홈으로`(3자)를 그냥 두면 한쪽이 눈에 띄게 좁다.
 *
 * 아이콘을 함께 넣는다. 이 크기의 버튼에 글자만 있으면 가운데가 비어 보인다.
 */
export const ERROR_ACTION_CLASS = 'h-12 min-w-[140px] gap-2 px-6';
