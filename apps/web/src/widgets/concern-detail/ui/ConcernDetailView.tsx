import { notFound } from 'next/navigation';
import { HttpError, type ConcernDetailResponse } from '@ogonggo/api';
import { readConcernDetail } from '../api/concernDetail';
import { ConcernDetailBreadcrumb } from './ConcernDetailBreadcrumb';
import { ConcernDetailCard } from './ConcernDetailCard';

export interface ConcernDetailViewProps {
  concernId: number;
}

/**
 * 서버에서 읽는 고민글 상세. 늘 비로그인으로 읽는다 — 서버의 요청에는 토큰이 실리지 않아서 `mine` 은
 * `false` 이고, 내 글인지는 브라우저가 한 번 더 읽어 채운다(PRD 결정 8).
 *
 * 백엔드는 1 미만 id 에 400 을 준다. 경로의 id 가 양의 정수가 아니면 부르지 않고 바로 `notFound()` 로
 * 보낸다 — 없는 글과 같은 화면이 맞고, 400 이 오류 화면으로 새지 않는다. 404(없는 글, 삭제된 글) 는
 * `HttpError.status` 로 가려 `notFound()` 로 바꾸고 그 외 오류는 다시 던진다.
 *
 * `generateMetadata`(`app/(site)/concerns/[concernId]/page.tsx`) 도 이 함수를 쓴다. 조회수를 올리는
 * 요청이라 두 번 나가면 안 되는데, 같은 렌더 안의 같은 주소 `fetch` 는 Next 가 하나로 합친다.
 */
export async function fetchConcernDetail(concernId: number): Promise<ConcernDetailResponse> {
  if (!Number.isSafeInteger(concernId) || concernId < 1) {
    notFound();
  }

  let concern: ConcernDetailResponse | null;
  try {
    concern = await readConcernDetail(concernId);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  if (!concern) {
    notFound();
  }

  return concern;
}

/**
 * 고민글 상세 — 시안 순서(브레드크럼 → 본문 카드 → 답변)로 조합한다. 폭은 다른 상세 화면과 같은
 * `max-w-6xl` 이고, 시안은 카드가 브레드크럼보다 안쪽에서 시작해서 `md` 부터 양옆을 들인다.
 */
export async function ConcernDetailView({ concernId }: ConcernDetailViewProps) {
  const concern = await fetchConcernDetail(concernId);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4 md:gap-12">
      <ConcernDetailBreadcrumb />
      <div className="flex flex-col gap-10 md:px-10">
        <ConcernDetailCard concern={concern} />
      </div>
    </div>
  );
}
