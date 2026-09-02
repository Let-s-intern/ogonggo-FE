import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { ERROR_ACTION_CLASS, ErrorState } from '@/shared/ui/ErrorState';
import { HomeIcon } from '@/shared/ui/icons';

/**
 * 없는 주소이거나 `notFound()`가 불린 자리를 대신한다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md).
 * 지금은 `/jobs/{없는 id}`, `/bootcamps/{없는 id}`, `/side-studies/{없는 id}`가 여기로 온다.
 *
 * 오류 화면(`error.tsx`)과 같은 뼈대를 쓰되 문구가 다르다 — 이쪽은 다시 시도해도 소용이
 * 없으므로 `다시 시도` 버튼을 두지 않는다.
 *
 * 버튼은 하나다. `/`가 곧 채용공고 목록이라 `공고 목록`과 `홈으로`를 나란히 두면 같은 곳을
 * 가리키는 버튼이 둘이 된다.
 */
export default function NotFound() {
  return (
    <ErrorState
      title="찾는 페이지가 없어요"
      description="주소가 바뀌었거나 사라진 것 같아요."
      actions={
        <Button asChild className={ERROR_ACTION_CLASS}>
          <Link href="/">
            <HomeIcon className="h-5 w-5" />
            홈으로
          </Link>
        </Button>
      }
    />
  );
}
