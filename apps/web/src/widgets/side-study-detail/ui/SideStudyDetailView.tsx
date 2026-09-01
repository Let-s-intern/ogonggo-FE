import { notFound } from 'next/navigation';
import { httpClient } from '@ogonggo/api';
import type { SideStudyDetail, SideStudyDetailResponse } from '@/entities/side-study/model/types';
import { SideStudyDetailBreadcrumb } from './SideStudyDetailBreadcrumb';
import { SideStudyDetailHeaderCard } from './SideStudyDetailHeaderCard';

export interface SideStudyDetailViewProps {
  postId: number;
}

/**
 * API 없음: `GET /api/v1/side-studies/{postId}`는 백엔드에 없는 경로다(PRD 5절). 생성된 클라이언트
 * 함수가 있을 리 없어 목록(`widgets/side-study-list/ui/SideStudyList.tsx`)과 같이 `httpClient`로
 * URL을 직접 만들어 부른다 — MSW 핸들러(`packages/api/src/mocks/handlers.ts`)만 이 요청에 답한다.
 *
 * 404는 `httpClient`가 구조화된 응답 대신 `Error("GET /api/v1/side-studies/{id} failed: 404")`를
 * 던지므로 메시지 끝의 상태 코드로 가려내 `notFound()`로 바꾼다 — 채용공고·부트캠프 상세와 같은
 * 처리다. 그 외 오류는 다시 던진다.
 */
async function fetchSideStudyDetail(postId: number): Promise<SideStudyDetail> {
  let response: SideStudyDetailResponse;
  try {
    response = await httpClient<SideStudyDetailResponse>(`/api/v1/side-studies/${postId}`);
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
 * 사이드·스터디 상세 — `docs/asset/사이드스터디 상세페이지.png` 순서(브레드크럼 → 헤더 카드 →
 * 정보 그리드·본문 / 사이드바)로 조합한다. 2단 비율·여백(`lg:grid-cols-[739fr_323fr]`, `px-8`,
 * `lg:gap-15`)은 채용공고·부트캠프 상세와 같은 값이다 — 세 상세 화면의 글자 시작 x가 한 줄로
 * 맞아야 한다(PRD 7절).
 */
export async function SideStudyDetailView({ postId }: SideStudyDetailViewProps) {
  const sideStudy = await fetchSideStudyDetail(postId);

  return (
    <div className="flex w-full max-w-6xl flex-col gap-4">
      <SideStudyDetailBreadcrumb />
      <SideStudyDetailHeaderCard sideStudy={sideStudy} />
      <div className="grid grid-cols-1 gap-6 px-8 lg:grid-cols-[739fr_323fr] lg:gap-15">
        <div className="flex flex-col gap-8" />
        <aside className="flex flex-col gap-6" />
      </div>
    </div>
  );
}
