import { notFound } from 'next/navigation';
import { httpClient } from '@ogonggo/api';
import type { SideStudyDetail, SideStudyDetailResponse } from '@/entities/side-study/model/types';
import { SideStudyDetailBreadcrumb } from './SideStudyDetailBreadcrumb';
import { SideStudyDetailHeaderCard } from './SideStudyDetailHeaderCard';
import { SideStudyInfoGrid } from './SideStudyInfoGrid';

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
 * `사이드스터디 상세페이지.png`가 쓰는 본문 세 섹션 그대로다. 값이 없으면 아래에서 제목째
 * 걸러지므로 `지원 자격 및 전형`은 `eligibility`가 없는 건(픽스처 id 2·3·4)에서 통째로
 * 사라진다 — 채용공고 상세의 `buildSections`와 같은 규칙이다.
 *
 * `content`는 목업의 소제목 다섯(프로젝트 소개 / 목표 및 예상 산출물 / 진행 상황 / 현재 팀
 * 구성 / 모임 방식)을 담은 한 덩어리 문자열이라 `whitespace-pre-line`으로 줄바꿈만 살려
 * 그린다. 소제목을 따로 뽑아 굵게 만들지 않는 것은 그 구조가 타입에 없기 때문이다 —
 * `content: string`뿐이고(`fixtures/side-study.ts`) 소제목은 목데이터를 지어낼 때의 약속이지
 * 응답이 보장하는 형식이 아니다. 실제 API가 구조를 나눠 주면 그때 나눠 그린다.
 */
function buildSections(sideStudy: SideStudyDetail): { label: string; value?: string }[] {
  return [
    { label: '한 줄 소개', value: sideStudy.shortDescription },
    { label: '모집 상세 내용', value: sideStudy.content },
    { label: '지원 자격 및 전형', value: sideStudy.eligibility },
  ];
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
        <div className="flex flex-col gap-8">
          <SideStudyInfoGrid sideStudy={sideStudy} />
          {buildSections(sideStudy)
            .filter((section) => Boolean(section.value))
            .map((section) => (
              <section key={section.label}>
                <h2 className="text-lg font-bold text-gray-900">{section.label}</h2>
                <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{section.value}</p>
              </section>
            ))}
        </div>
        <aside className="flex flex-col gap-6" />
      </div>
    </div>
  );
}
