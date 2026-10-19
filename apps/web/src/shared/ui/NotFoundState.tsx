import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { ERROR_ACTION_CLASS, ErrorState } from './ErrorState';
import { HomeIcon } from './icons';

/**
 * 없는 주소 화면의 본문. `app/not-found.tsx`(그룹 밖 전부)와 `app/(site)/not-found.tsx`(그룹 안에서
 * `notFound()`가 불린 자리)가 같이 쓴다 — 두 화면이 서로 다르게 생기면 같은 고장이 다른 고장으로 읽힌다.
 *
 * 헤더와 푸터는 여기 없다. 껍데기를 누가 다는지가 두 파일이 갈리는 유일한 점이라서, 각 파일이 정한다.
 *
 * 버튼은 하나다. `/`가 곧 채용공고 목록이라 `공고 목록`과 `홈으로`를 나란히 두면 같은 곳을
 * 가리키는 버튼이 둘이 된다. 다시 시도해도 소용이 없으므로 `다시 시도`도 두지 않는다.
 */
export function NotFoundState() {
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
