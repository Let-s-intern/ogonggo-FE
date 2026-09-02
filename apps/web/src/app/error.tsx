'use client';

import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { ErrorState } from '@/shared/ui/ErrorState';

/**
 * 화면 렌더 중 오류가 났을 때 그 자리를 대신한다. 헤더와 푸터(`app/layout.tsx`)는 그대로
 * 남고 본문만 바뀐다 — `error.tsx`는 같은 세그먼트의 `layout.tsx`를 감싸지 않는다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md).
 * 레이아웃 자체가 깨진 경우는 `app/global-error.tsx`가 받는다.
 *
 * 에러 경계는 클라이언트 컴포넌트여야 한다(같은 문서).
 *
 * `reset()`이 아니라 `retry()`를 쓴다 — 이 Next 버전은 `retry()`가 데이터를 다시 받아
 * 다시 그리고, `reset()`은 다시 받지 않고 상태만 지운다. 대부분의 원인이 일시적인 조회
 * 실패라 다시 받는 쪽이 맞다.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <ErrorState
      title="일시적인 오류가 발생했어요"
      description={'잠시 후 다시 시도해 주세요.\n같은 화면에서 반복되면 저희가 확인해야 하는 문제입니다.'}
      hint={error.digest ? `오류 번호 ${error.digest}` : undefined}
      actions={
        <>
          <Button onClick={() => retry()}>다시 시도</Button>
          <Button variant="secondary" asChild>
            <Link href="/">홈으로</Link>
          </Button>
        </>
      }
    />
  );
}
