import { notFound } from 'next/navigation';
import { getBootcamp1 } from '@ogonggo/api';
import type { SuccessResponseUserBootcampDetailResponse } from '@ogonggo/api';
import type { BootcampDetail } from '@/entities/bootcamp/model/types';
import { BootcampDetailBreadcrumb } from './BootcampDetailBreadcrumb';
import { BootcampDetailHeaderCard } from './BootcampDetailHeaderCard';
import { BootcampInfoGrid } from './BootcampInfoGrid';

export interface BootcampDetailViewProps {
  bootcampId: number;
}

/**
 * 공개 상세는 `getBootcamp1`(`GET /api/v1/bootcamps/{bootcampId}`)이다 — 이름이 비슷한
 * `getBootcamp`는 기업 회원용 `/api/v1/users/me/bootcamps/{id}`라 이 화면이 쓰지 않는다
 * (PRD 3절).
 *
 * 응답 언랩과 404 처리는 `widgets/job-detail/ui/JobDetailView.tsx`의 `fetchJobDetail`과 같다 —
 * 생성 타입은 `{ data, status, headers }`를 선언하지만 `httpClient`는 파싱된 body를 그대로
 * 주고, 404는 `Error("GET /api/v1/bootcamps/{id} failed: 404")`로 던져지므로 메시지 끝의 상태
 * 코드로 가려내 `notFound()`로 바꾼다. 그 외 오류는 다시 던진다.
 */
async function fetchBootcampDetail(bootcampId: number): Promise<BootcampDetail> {
  let response: SuccessResponseUserBootcampDetailResponse;
  try {
    response = (await getBootcamp1(
      bootcampId,
    )) as unknown as SuccessResponseUserBootcampDetailResponse;
  } catch (error) {
    if (error instanceof Error && error.message.endsWith(': 404')) {
      notFound();
    }
    throw error;
  }

  if (!response.data) {
    notFound();
  }

  return response.data;
}

/**
 * 교육·부트캠프 상세 — `docs/asset/교육부트캠프 상세페이지.png` 순서(브레드크럼 → 헤더 카드 →
 * 정보 그리드·본문 / 사이드바)로 조합한다. 2단 비율·여백(`lg:grid-cols-[739fr_323fr]`, `px-8`,
 * `lg:gap-15`)은 채용공고 상세와 같은 값이다 — 두 상세 화면의 글자 시작 x가 한 줄로 맞아야
 * 한다(PRD 7절).
 */
export async function BootcampDetailView({ bootcampId }: BootcampDetailViewProps) {
  const bootcamp = await fetchBootcampDetail(bootcampId);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      <BootcampDetailBreadcrumb />
      <BootcampDetailHeaderCard bootcamp={bootcamp} />
      <div className="grid grid-cols-1 gap-6 px-8 lg:grid-cols-[739fr_323fr] lg:gap-15">
        <div className="flex flex-col gap-8">
          <BootcampInfoGrid bootcamp={bootcamp} />
        </div>
        <aside className="flex flex-col gap-6" />
      </div>
    </div>
  );
}
