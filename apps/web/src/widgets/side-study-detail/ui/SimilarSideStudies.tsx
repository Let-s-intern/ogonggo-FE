import Link from 'next/link';
import { getRecruitmentPosts } from '@ogonggo/api';
import type { SuccessResponsePageResponseRecruitmentPostSummaryResponse } from '@ogonggo/api';
import { KIND_LABELS, OPERATION_TYPE_LABELS } from '@/entities/side-study/model/labels';
import type { SideStudyKind, SideStudySummary } from '@/entities/side-study/model/types';

export interface SimilarSideStudiesProps {
  excludePostId: number;
  kind: SideStudyKind;
}

const SIMILAR_COUNT = 3;
/** 지금 보고 있는 글이 앞쪽에 섞여 들어와도 3건이 남도록 하나만 더 받는다. */
const POOL_SIZE = SIMILAR_COUNT + 1;

/**
 * API 없음: "비슷한 글"을 골라 주는 엔드포인트가 없다. **판정 기준이 없으므로 같은 구분(사이드
 * 프로젝트 / 스터디)의 목록(`getRecruitmentPosts` 의 `recruitmentTypes`) 을 다시 불러 지금 보고
 * 있는 글만 빼고 위에서 3건을 그대로 쓴다** — 채용공고 상세의 `SimilarJobs`,
 * 부트캠프 상세의 `SimilarBootcamps`가 하는 것과 같은 처리다. 실제 API에 추천 기준(기술 스택
 * 겹침, 모집 포지션 등)이 생기면 여기만 바꾼다.
 *
 * 이 블록이 목업의 댓글·대댓글 자리를 대신한다. 댓글은 이 PRD의 범위 밖이다
 * (PRD 8절, 2026-09-01 결정).
 */
async function fetchSimilarPool(kind: SideStudyKind): Promise<SideStudySummary[]> {
  const response = (await getRecruitmentPosts({
    page: '1',
    size: String(POOL_SIZE),
    recruitmentTypes: [kind],
  })) as unknown as SuccessResponsePageResponseRecruitmentPostSummaryResponse;

  return response.data?.items ?? [];
}

/**
 * 목업 사이드바의 목록 — 제목 + `종류 · 진행 방식` + `N/M`. 목업의 썸네일은 목록 응답에 없어
 * 뺐다(PRD Push 5 "사용자 결정").
 */
export async function SimilarSideStudies({ excludePostId, kind }: SimilarSideStudiesProps) {
  const pool = await fetchSimilarPool(kind);
  const items = pool.filter((sideStudy) => sideStudy.id !== excludePostId).slice(0, SIMILAR_COUNT);

  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <h2 className="text-sm font-bold text-gray-900">비슷한 사이드·스터디</h2>
      <ul className="mt-3 flex flex-col gap-3">
        {items.map((sideStudy) => (
          <li key={sideStudy.id}>
            <Link href={`/side-studies/${sideStudy.id}`} className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{sideStudy.title}</p>
                <p className="truncate text-xs text-gray-500">
                  {KIND_LABELS[sideStudy.recruitmentType]} ·{' '}
                  {OPERATION_TYPE_LABELS[sideStudy.progressMethod]}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-gray-500">
                {sideStudy.recruitmentStatus === 'CLOSED'
                  ? '마감'
                  : `${sideStudy.applicationCount}/${sideStudy.capacity}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
