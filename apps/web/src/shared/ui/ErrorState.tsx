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
 * 흰 바탕에 아이콘·제목·설명·버튼만 세로로 세운다.
 */
export function ErrorState({ title, description, hint, actions }: ErrorStateProps) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-8 bg-white px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-5">
        <AlertIcon className="h-12 w-12 text-gray-300" />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="whitespace-pre-line text-sm leading-relaxed text-gray-500">
            {description}
          </p>
        </div>
      </div>

      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}

      <div className="flex flex-col items-center gap-1.5 text-xs text-gray-400">
        <p>
          도움이 필요하면 편하게 알려주세요{' '}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-semibold text-blue-500 hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>
        {hint ? <p className="font-mono text-[11px] text-gray-300">{hint}</p> : null}
      </div>
    </main>
  );
}
