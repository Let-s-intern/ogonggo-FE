/**
 * 백엔드 계약이 아니라 이 화면(`/side-studies`)을 만들기 위한 가정이다.
 *
 * 사이드·스터디는 ogonggo-BE에 엔드포인트도 엔티티도 없다(PRD 5절). 그래서 응답 형태를 이
 * 파일이 정한다. 실제 API가 생기면 이 파일은 사라지고 `packages/api/src/generated/`의 생성
 * 타입으로 대체된다 — 그래서 생성 디렉토리 안에 넣지 않았고, 이 파일도 생성 타입을 하나도
 * 임포트하지 않는다. 페이지 래핑(`SideStudyPageInfo`·`SideStudyListResponse`)은 다른
 * 목록 API와 같은 모양을 손으로 다시 적은 것이지 `PageInfo`를 가져다 쓴 것이 아니다 —
 * 가정이 생성 타입에 기대면 계약처럼 보이기 시작한다.
 *
 * 필드는 목업 `docs/asset/사이드스터디 상세페이지.png`의 정보 그리드 7칸(진행 방식, 모집 인원,
 * 기술 스택, 모집 시작일, 모집 포지션, 모집 마감일, 소통 방법)에 목록 카드가 필요로 하는 것
 * (구분, 작성자 닉네임, 조회수·댓글수, 마감 여부)을 더한 것이다(PRD 5절).
 */

/** 사이드 프로젝트인지 스터디인지. 목록 탭 세 개가 이 값으로 갈린다. */
export type SideStudyKind = 'SIDE_PROJECT' | 'STUDY';

/** 진행 방식. 부트캠프·채용공고의 `operationType`과 같은 세 값을 쓴다. */
export type SideStudyOperationType = 'ONLINE' | 'OFFLINE' | 'HYBRID';

/** 목록 카드 한 장이 그리는 값 전부. */
export interface SideStudySummary {
  id: number;
  kind: SideStudyKind;
  operationType: SideStudyOperationType;
  /** 모집장 닉네임. 실존 계정과 겹치지 않게 지어낸 값이다. */
  authorNickname: string;
  title: string;
  /** 모집 포지션. 카드 해시태그와 상세 정보 그리드가 함께 쓴다. */
  positions: string[];
  techStack: string[];
  /**
   * 카드 썸네일. 지어낸 데이터라 가져올 이미지가 없어 픽스처에서는 전부 비어 있고, 카드가
   * `CompanyLogo`처럼 회색 박스로 떨어진다(Push 3 task 파일 선행 조건의 결정).
   */
  thumbnailUrl?: string;
  /** 모집 마감 일시. 없으면 상시 모집이다. */
  recruitmentEndAt?: string;
  /** 모집 정원과 현재 지원 인원. 카드 배지의 `모집 중 2/6`이 이 둘이다(PRD 5절). */
  capacity: number;
  appliedCount: number;
  /** 모집장이 마감한 글. 정원이 차는 것과 별개다 — 정원이 차도 마감하지 않을 수 있다. */
  closed: boolean;
  viewCount: number;
  commentCount: number;
  /** 표시 전용. 토글은 이 PRD의 범위 밖이다(PRD 8절). */
  bookmarked: boolean;
}

/** 상세 화면이 목록 항목에 더해 필요로 하는 값(PRD 4.4·5절). */
export interface SideStudyDetail extends SideStudySummary {
  recruitmentStartAt?: string;
  /**
   * 소통 방법. "오픈 채팅", "이메일" 같은 수단 이름만 들어간다 —
   * 실제 링크·주소는 넣지 않는다(PRD 6.2).
   */
  contactMethod: string;
  /** "3개월", "8주" 같은 예상 진행 기간. */
  expectedDuration?: string;
  shortDescription: string;
  content: string;
  eligibility?: string;
  applicationUrl?: string;
}

/** `PageInfo`와 같은 모양이지만 가정 쪽에 따로 둔다 — 위 첫 주석 참고. */
export interface SideStudyPageInfo {
  pageNum: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
}

export interface SideStudyPageResponse {
  items: SideStudySummary[];
  pageInfo: SideStudyPageInfo;
}

/** `GET /api/v1/side-studies`의 응답 봉투. 다른 목록 API의 `SuccessResponse...`와 같은 모양이다. */
export interface SideStudyListResponse {
  status: number;
  message: string;
  data?: SideStudyPageResponse;
}
