import type { ReactNode } from 'react';

/** 푸터에 적힌 것과 같은 연락처다(`widgets/site-footer/ui/SiteFooter.tsx`). */
export const SUPPORT_EMAIL = 'official@letscareer.co.kr';
export const SUPPORT_PHONE = '0507-0178-8541';

export interface ErrorStateProps {
  title: string;
  description: string;
  /** 오류 코드나 요청 식별자처럼 문의할 때 같이 알려주면 좋은 값. */
  hint?: string;
  /** `다시 시도`·`홈으로` 같은 버튼들. */
  actions?: ReactNode;
}

/**
 * 오류 화면의 공통 뼈대. `app/error.tsx`, `app/global-error.tsx`, `app/not-found.tsx` 셋이
 * 같은 모양을 쓴다 — 세 화면이 서로 다르게 생기면 사용자는 다른 고장이라고 읽는다.
 *
 * 서버 컴포넌트다. `global-error.tsx`는 자기 `<html>`을 직접 그려야 해서 클라이언트
 * 컴포넌트지만, 그 안에서 이걸 렌더하는 것은 문제가 없다.
 */
export function ErrorState({ title, description, hint, actions }: ErrorStateProps) {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-white px-6 py-20 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="whitespace-pre-line text-sm text-gray-500">{description}</p>
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}

      <div className="flex flex-col gap-1 text-xs text-gray-400">
        <p>
          문제가 계속되면 운영진에게 알려주세요 —{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-500 hover:underline">
            {SUPPORT_EMAIL}
          </a>
          {' · '}
          {SUPPORT_PHONE}
        </p>
        {hint ? <p className="font-mono text-gray-300">{hint}</p> : null}
      </div>
    </main>
  );
}
