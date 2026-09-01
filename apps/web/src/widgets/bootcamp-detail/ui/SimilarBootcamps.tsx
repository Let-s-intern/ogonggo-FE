import Link from 'next/link';
import { getBootcamps1 } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserBootcampSummaryResponse } from '@ogonggo/api';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { TUITION_TYPE_LABELS } from '@/entities/bootcamp/model/labels';
import type { BootcampSummary } from '@/entities/bootcamp/model/types';
import { BootcampBadge } from '@/entities/bootcamp/ui/BootcampBadge';

export interface SimilarBootcampsProps {
  excludeBootcampId: number;
}

const POOL_SIZE = 12;
const SIMILAR_COUNT = 3;

/**
 * API 없음: "비슷한 교육"을 골라 주는 엔드포인트가 없다 — 채용공고 상세의 `SimilarJobs`가
 * 하는 것과 같이 목록(`GET /api/v1/bootcamps`)을 다시 불러 지금 보고 있는 건만 빼고 위에서
 * 몇 개를 그대로 쓴다. 실제 API로 붙일 때 추천 기준(같은 프로그램 유형 등)이 생기면 여기만
 * 바꾼다.
 *
 * 공개 목록은 **`getBootcamps1`**이다. 접미사 없는 `getBootcamps`는 기업 회원용
 * `/api/v1/users/me/bootcamps`라 여기서 부르면 404가 난다(실제로 한 번 그렇게 났다) — 상세가
 * `getBootcamp1`인 것과 같은 규칙이다.
 */
async function fetchSimilarPool(): Promise<BootcampSummary[]> {
  const response = (await getBootcamps1({
    page: 1,
    size: POOL_SIZE,
  })) as unknown as SuccessResponsePageResponseUserBootcampSummaryResponse;

  return response.data?.items ?? [];
}

/** `교육부트캠프 상세페이지.png` 사이드바의 목록 — 썸네일 + 제목 + `수강료 · 유형` + 배지. */
export async function SimilarBootcamps({ excludeBootcampId }: SimilarBootcampsProps) {
  const pool = await fetchSimilarPool();
  const items = pool
    .filter((bootcamp) => bootcamp.id !== excludeBootcampId)
    .slice(0, SIMILAR_COUNT);

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">지금 보고 있는 교육과 비슷한 교육이에요</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((bootcamp) => (
          <li key={bootcamp.id}>
            <Link href={`/bootcamps/${bootcamp.id}`} className="flex items-center gap-3">
              <Thumbnail src={bootcamp.representativeImageUrl} alt="" className="h-12 w-12 shrink-0 rounded-md shadow-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{bootcamp.title}</p>
                <p className="truncate text-xs text-gray-500">
                  {TUITION_TYPE_LABELS[bootcamp.tuitionType]} · {bootcamp.programType}
                </p>
              </div>
              <BootcampBadge
                recruitmentType={bootcamp.recruitmentType}
                recruitmentEndAt={bootcamp.recruitmentEndAt}
                status={bootcamp.status}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
