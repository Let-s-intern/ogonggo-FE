'use client';

import { ErrorState } from '@/shared/ui/ErrorState';
import './globals.css';

/**
 * 루트 레이아웃 자체가 깨졌을 때 문서를 통째로 대신한다 — 헤더도 푸터도 없다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md
 * 의 "Global Error").
 *
 * `app/error.tsx`가 잡지 못하는 마지막 그물이라 세 가지를 직접 챙긴다.
 *
 * - `<html>`·`<body>`를 직접 그린다. 이 파일이 루트 레이아웃을 대체하기 때문이다
 * - 전역 스타일이 자동으로 따라오지 않아 `globals.css`를 여기서 임포트한다
 * - `metadata`를 못 쓴다(에러 경계는 클라이언트 컴포넌트다). 제목은 `<title>`로 넣는다
 *
 * 여기까지 왔다는 것은 레이아웃이 죽었다는 뜻이라 `다시 시도`가 통할 가능성이 낮다.
 * 그래도 버튼은 둔다 — 배포 직후 잠깐 깨지는 경우가 실제로 있고, 그때는 통한다.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <title>오류 | 오늘의 공고</title>
        <ErrorState
          title="화면을 불러오지 못했어요"
          description={'일시적인 문제일 수 있어요. 잠시 후 다시 시도해 주세요.\n반복되면 저희가 확인해야 하는 문제입니다.'}
          hint={error.digest ? `오류 번호 ${error.digest}` : undefined}
          actions={
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex h-12 items-center justify-center rounded-md bg-blue-500 px-6 text-base font-semibold text-white transition-colors hover:bg-blue-600"
            >
              다시 시도
            </button>
          }
        />
      </body>
    </html>
  );
}
