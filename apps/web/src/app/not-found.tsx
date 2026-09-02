import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { ErrorState } from '@/shared/ui/ErrorState';

/**
 * 없는 주소이거나 `notFound()`가 불린 자리를 대신한다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md).
 * 지금은 `/jobs/{없는 id}`, `/bootcamps/{없는 id}`, `/side-studies/{없는 id}`가 여기로 온다.
 *
 * 오류 화면(`error.tsx`)과 같은 뼈대를 쓰되 문구가 다르다 — 이쪽은 다시 시도해도 소용이
 * 없으므로 `다시 시도` 버튼을 두지 않는다.
 */
export default function NotFound() {
  return (
    <ErrorState
      title="찾는 페이지가 없어요"
      description="주소가 바뀌었거나 사라진 것 같아요."
      actions={
        <>
          <Button asChild className="h-12 px-6">
            <Link href="/">채용공고 목록</Link>
          </Button>
          <Button variant="secondary" asChild className="h-12 px-6">
            <Link href="/bootcamps">교육·부트캠프</Link>
          </Button>
        </>
      }
    />
  );
}
