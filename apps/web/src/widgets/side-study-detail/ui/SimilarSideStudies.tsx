import Link from 'next/link';
import { httpClient } from '@ogonggo/api';
import { KIND_LABELS, OPERATION_TYPE_LABELS } from '@/entities/side-study/model/labels';
import type {
  SideStudyKind,
  SideStudyListResponse,
  SideStudySummary,
} from '@/entities/side-study/model/types';

export interface SimilarSideStudiesProps {
  excludePostId: number;
  kind: SideStudyKind;
}

const SIMILAR_COUNT = 3;
/** 지금 보고 있는 글이 앞쪽에 섞여 들어와도 3건이 남도록 하나만 더 받는다. */
const POOL_SIZE = SIMILAR_COUNT + 1;

/**
 * API 없음: "비슷한 글"을 골라 주는 엔드포인트가 없다. 그 전에 사이드·스터디 엔드포인트 자체가
 * 백엔드에 없다(PRD 5절). **판정 기준이 없으므로 같은 `kind`(사이드 프로젝트 / 스터디)의 목록을
 * 다시 불러 지금 보고 있는 글만 빼고 위에서 3건을 그대로 쓴다** — 채용공고 상세의 `SimilarJobs`,
 * 부트캠프 상세의 `SimilarBootcamps`가 하는 것과 같은 처리다. 실제 API에 추천 기준(기술 스택
 * 겹침, 모집 포지션 등)이 생기면 여기만 바꾼다.
 *
 * 이 블록이 목업의 댓글·대댓글 자리를 대신한다. 댓글은 이 PRD의 범위 밖이다
 * (PRD 8절, 2026-09-01 결정).
 */
async function fetchSimilarPool(kind: SideStudyKind): Promise<SideStudySummary[]> {
  const params = new URLSearchParams({ page: '1', size: String(POOL_SIZE), kind });
  const response = await httpClient<SideStudyListResponse>(
    `/api/v1/side-studies?${params.toString()}`,
  );

  return response.data?.items ?? [];
}

/** 목업 사이드바의 목록 — 회색 썸네일 + 제목 + `종류 · 진행 방식` + `모집 중 N/M`. */
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
              {/* 목록 카드와 같은 이유로 회색 박스다 — 지어낸 목데이터라 걸어 둘 이미지가 없다
                  (`entities/side-study/ui/SideStudyCard.tsx`). */}
              <div className="h-12 w-12 shrink-0 rounded-md bg-gray-100 shadow-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{sideStudy.title}</p>
                <p className="truncate text-xs text-gray-500">
                  {KIND_LABELS[sideStudy.kind]} · {OPERATION_TYPE_LABELS[sideStudy.operationType]}
                </p>
              </div>
              <span className="shrink-0 text-xs font-bold text-gray-500">
                {sideStudy.closed ? '마감' : `${sideStudy.appliedCount}/${sideStudy.capacity}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
