import { notFound } from 'next/navigation';
import { getBootcamp1 } from '@ogonggo/api';
import type { SuccessResponseUserBootcampDetailResponse } from '@ogonggo/api';
import type { BootcampDetail } from '@/entities/bootcamp/model/types';
import { ApplyCta } from '@/shared/ui/ApplyCta';
import { CrossSellWidget } from '@/widgets/cross-sell';
import { BootcampCurriculum } from './BootcampCurriculum';
import { BootcampDetailBreadcrumb } from './BootcampDetailBreadcrumb';
import { BootcampDetailHeaderCard } from './BootcampDetailHeaderCard';
import { BootcampInfoGrid } from './BootcampInfoGrid';
import { SimilarBootcamps } from './SimilarBootcamps';

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
 * `신청하러 가기` 링크 — `applicationMethod`가 `EXTERNAL_PAGE`면 `applicationUrl`,
 * `EMAIL`이면 `mailto:managerEmail`이다(PRD 4.2 표). 해당 값이 비어 있으면 `undefined`를
 * 돌려주고, 그때는 버튼 없이 북마크 칸만 남는다(`shared/ui/ApplyCta.tsx`).
 */
function buildApplicationHref(bootcamp: BootcampDetail): string | undefined {
  if (bootcamp.applicationMethod === 'EMAIL') {
    return bootcamp.managerEmail ? `mailto:${bootcamp.managerEmail}` : undefined;
  }
  return bootcamp.applicationUrl;
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
          <BootcampCurriculum curriculums={bootcamp.curriculums} />
          {/* `지원 자격 · 전형`도 값이 없으면 제목째 사라진다 — 커리큘럼과 같은 규칙이다.
              본문 섹션이 하나뿐이라 `job-detail`처럼 목록으로 만들지 않는다. */}
          {bootcamp.eligibilityAndSelectionProcess ? (
            <section>
              <h2 className="text-lg font-bold text-gray-900">지원 자격 · 전형</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                {bootcamp.eligibilityAndSelectionProcess}
              </p>
            </section>
          ) : null}
        </div>
        <aside className="flex flex-col gap-6">
          <ApplyCta
            href={buildApplicationHref(bootcamp)}
            label="신청하러 가기"
            /* API 없음: 부트캠프 응답에는 북마크 여부 필드가 없다(`bookmarkCount`만 있다).
               목록 카드와 같은 이유로 항상 빈 아이콘이다 — `entities/bootcamp/ui/BootcampCard.tsx`
               참고. */
            bookmarked={false}
            bookmarkCount={bootcamp.bookmarkCount}
          />
          <SimilarBootcamps excludeBootcampId={bootcamp.id} />
          <CrossSellWidget />
        </aside>
      </div>
    </div>
  );
}
