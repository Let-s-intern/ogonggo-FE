import Link from 'next/link';
import { listPublicBootcamps } from '@ogonggo/api';
import type { SuccessResponsePageResponseUserBootcampSummaryResponse } from '@ogonggo/api';
import { JobThumbnail } from '@/entities/job/ui/JobThumbnail';
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
 * 공개 목록은 `listPublicBootcamps`이다. `listMyBootcamps`는 기업 회원용
 * `/api/v1/users/me/bootcamps`라 여기서 부르면 404가 난다(실제로 한 번 그렇게 났다) — 상세가
 * `getPublicBootcamp`인 것과 같은 규칙이다.
 */
async function fetchSimilarPool(): Promise<BootcampSummary[]> {
  const response = (await listPublicBootcamps({
    page: 1,
    size: POOL_SIZE,
  })) as unknown as SuccessResponsePageResponseUserBootcampSummaryResponse;

  return response.data?.items ?? [];
}

/**
 * 사이드바의 비슷한 교육 목록. 옆의 `함께 보면 좋아요`(`widgets/cross-sell`)와 같은 틀이다 —
 * 왼쪽에 `수강료 · 유형`·배지(회색 줄)와 제목(굵게, 두 줄까지), 오른쪽에 썸네일, 항목 사이에
 * 가는 선. 썸네일은 목록 카드와 같은 `JobThumbnail`(대표 이미지, 없으면 로고)을 폭만 줄여 쓴다.
 */
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
      <ul className="mt-1 divide-y divide-gray-100">
        {items.map((bootcamp) => (
          <li key={bootcamp.id}>
            <Link href={`/bootcamps/${bootcamp.id}`} className="group flex items-center gap-4 py-4">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="truncate">
                    {TUITION_TYPE_LABELS[bootcamp.tuitionType]} · {bootcamp.programType}
                  </span>
                  <span className="shrink-0">
                    <BootcampBadge
                      recruitmentType={bootcamp.recruitmentType}
                      recruitmentEndAt={bootcamp.recruitmentEndAt}
                      status={bootcamp.status}
                    />
                  </span>
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-bold text-gray-800 group-hover:text-blue-500">
                  {bootcamp.title}
                </p>
              </div>
              <div className="w-24 shrink-0">
                <JobThumbnail
                  companyName={bootcamp.companyName}
                  coverImageUrl={bootcamp.representativeImageUrl}
                  logoUrl={bootcamp.logoUrl}
                />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
