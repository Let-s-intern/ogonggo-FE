import { ApplicationBoard, type ApplicationBoardQuery } from '@/widgets/application-board';

export type MyScrapsPageProps = ApplicationBoardQuery;

/**
 * `/mypage/scraps` 본문(v7 PRD "화면"). 바깥 껍데기(사이드바·로그인 가드) 는
 * `app/(site)/mypage/layout.tsx` 가 그린 `MyPageLayout` 이라 여기는 본문만 넘긴다.
 *
 * **v4 의 스크랩 표가 아니라 v7 칸반이다.** 스크랩이 지원 흐름의 첫 단계가 되면서 두 화면이
 * 하나로 합쳐졌고, 그 자리가 이 경로다(PRD 결정 기록의 메뉴·URL 표).
 *
 * 제목이 메뉴 이름(`스크랩한 공고`) 과 다르다. 목업이 그렇게 그렸고 PRD 결정 기록이 그대로
 * 두기로 했다.
 */
export function MyScrapsPage(query: MyScrapsPageProps) {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-gray-950">지원 · 신청 관리</h1>
        <p className="pt-2 text-sm text-gray-500">
          지원하거나 신청한 공고의 진행 상태를 한곳에서 확인해요.
        </p>
      </header>

      <ApplicationBoard query={query} />
    </section>
  );
}
