import type { RecruitmentType } from '@/shared/lib/dday';

/**
 * 마이페이지 표 한 행에서 **종류와 무관한 부분**. `스크랩한 공고` 의 탭 셋과 `지원·신청 내역`
 * 의 탭 셋, 모두 여섯 가지 응답이 이 모양으로 옮겨진다(PRD 2·3 절).
 *
 * 응답 타입이 여섯 개 전부 다른데 표는 하나다. 행 컴포넌트가 여섯 타입을 다 알면 탭이 하나
 * 늘 때마다 그 파일이 커진다 — 옮기는 일은 탭마다 자기 파일에서 하고, 표는 이 모양만 안다.
 */
export interface MyPageListRow {
  /** 목록 안에서 고유하면 된다. 탭마다 id 종류가 달라 문자열로 둔다. */
  key: string;
  /**
   * 제목을 눌렀을 때 갈 상세 화면. 없으면 제목이 링크가 아니라 글자다 — 하드코딩한 행
   * (`features/my-applications/model/placeholder.ts`) 은 갈 곳이 없다.
   */
  href?: string;
  thumbnailUrl?: string;
  /** 제목 위 작은 줄. 공고는 회사명, 모집글은 작성자 닉네임이다. */
  caption: string;
  title: string;
  /** 제목 아래 줄. 가운뎃점으로 잇는다. 빈 값은 호출부가 걸러서 넘긴다. */
  meta: string[];
  recruitmentType: RecruitmentType;
  recruitmentEndAt?: string;
  closedAt?: string;
}
