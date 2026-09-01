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

/**
 * 아래 12건은 **전부 지어낸 값이다.** 제목, 닉네임, 본문, 기술 스택, 조회수까지 실존하는
 * 게시글에서 옮겨 온 것이 하나도 없다 — 외부 모집 게시판에서 가져오지 않기로 한
 * 2026-09-01 결정(PRD 6.2)이다. 그런 게시판의 글은 개인이 쓴 것이라 닉네임·연락 링크·신상
 * 서술이 본문에 그대로 들어 있고 이 픽스처는 공개 URL에 배포된다. 화면 확인에 필요한 것은
 * 형태이지 남의 글이 아니다.
 *
 * 같은 이유로 링크가 하나도 없다. `contactMethod`는 "오픈 채팅"처럼 수단 이름만 넣고 실제
 * 주소를 넣지 않으며(PRD 6.2), `applicationUrl`도 전부 비어 있다 — 지어낼 수 없는 값이라
 * 비워 두는 쪽이 맞다. 상세 화면의 `신청하러 가기`는 이 픽스처에서 주소 없는 경로를 탄다.
 *
 * `thumbnailUrl`도 전부 비어 있다. 지어낸 글이라 가져올 이미지가 없어 카드가 회색 박스로
 * 떨어진다(Push 3 task 파일 선행 조건의 결정).
 *
 * 구성은 PRD 6.2의 표 그대로다. 목록 한 페이지가 채워지고 화면의 분기가 전부 한 번씩 나온다.
 *
 * | 조건 | 건수 | 해당 id |
 * |---|---|---|
 * | `kind` | 사이드 프로젝트 8 / 스터디 4 | 스터디 3·6·10·12 |
 * | 마감 임박(D-1 이하) | 1 | 12 |
 * | 마감됨(`closed`) | 1 | 11 |
 * | 정원이 다 찬 것 | 1 | 10 |
 * | 긴 제목(두 줄) | 2 | 7·9 |
 * | 진행 방식 | OFFLINE 2 / HYBRID 2 / 나머지 ONLINE | 4·9 / 3·7 |
 *
 * id가 클수록 최신이다. 기본 정렬(id 역순)에서 마감 임박·마감·정원 참 세 가지가 1페이지
 * 위쪽에 모이도록 12·11·10에 몰아 두었다 — 배지 세 모양을 한 화면에서 확인할 수 있다.
 *
 * 선택 필드가 빈 경로도 한 번씩 지나간다. id 5는 `recruitmentEndAt`이 없는 상시 모집이고,
 * id 2·3·4는 `eligibility`가 없다.
 */

/** 오늘 기준 상대 일수를 날짜 문자열로. `fixtures/bootcamp.ts`의 같은 이름 함수와 같은 계산이다. */
const daysFromToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 19) + 'Z';
};

/**
 * 본문 소제목 구조는 목업 `사이드스터디 상세페이지.png`를 따른다(PRD 6.2) — 프로젝트 소개 /
 * 목표 및 예상 산출물 / 진행 상황 / 현재 팀 구성 / 모임 방식, 각 1~2문장.
 */
const buildContent = (sections: {
  intro: string;
  goal: string;
  progress: string;
  team: string;
  meeting: string;
}): string =>
  [
    `프로젝트 소개\n${sections.intro}`,
    `목표 및 예상 산출물\n${sections.goal}`,
    `진행 상황\n${sections.progress}`,
    `현재 팀 구성\n${sections.team}`,
    `모임 방식\n${sections.meeting}`,
  ].join('\n\n');

export const SIDE_STUDY_FIXTURES: SideStudyDetail[] = [
  {
    id: 1,
    kind: 'SIDE_PROJECT',
    operationType: 'ONLINE',
    authorNickname: '문서정리봇',
    title: '개발자 회고 모아보는 큐레이션 서비스 팀원 구합니다',
    positions: ['프론트엔드', '백엔드'],
    techStack: ['React', 'TypeScript', 'Spring'],
    recruitmentStartAt: daysFromToday(-12),
    recruitmentEndAt: daysFromToday(26),
    capacity: 5,
    appliedCount: 2,
    closed: false,
    viewCount: 412,
    commentCount: 3,
    bookmarked: false,
    contactMethod: '오픈 채팅',
    expectedDuration: '3개월',
    shortDescription: '흩어져 있는 회고 글을 주제별로 모아 보여주는 웹 서비스를 만듭니다.',
    content: buildContent({
      intro: '좋은 회고 글이 여기저기 흩어져 있어 찾기 어렵다는 문제에서 시작했습니다.',
      goal: '주제·연차별로 회고를 모아 보여주는 웹 서비스를 배포하는 것이 목표입니다.',
      progress: '기획과 화면 설계가 끝났고 다음 주부터 구현에 들어갑니다.',
      team: '기획 1명, 프론트엔드 1명이 함께하고 있습니다.',
      meeting: '주 1회 저녁 온라인 회의로 진행 상황을 나눕니다.',
    }),
    eligibility: '주 5시간 이상 참여할 수 있고 끝까지 함께 배포까지 갈 분이면 좋겠습니다.',
  },
  {
    id: 2,
    kind: 'SIDE_PROJECT',
    operationType: 'ONLINE',
    authorNickname: '도넛과커피',
    title: '취미 기록 다이어리 웹 서비스 팀원 구합니다',
    positions: ['디자이너', '프론트엔드'],
    techStack: ['Next.js', 'TypeScript', 'Figma'],
    recruitmentStartAt: daysFromToday(-9),
    recruitmentEndAt: daysFromToday(21),
    capacity: 4,
    appliedCount: 1,
    closed: false,
    viewCount: 288,
    commentCount: 1,
    bookmarked: false,
    contactMethod: '이메일',
    expectedDuration: '10주',
    shortDescription: '취미 활동을 사진과 짧은 글로 남기는 개인 기록 서비스입니다.',
    content: buildContent({
      intro: '취미 활동을 가볍게 기록하고 월말에 돌아볼 수 있는 다이어리를 만듭니다.',
      goal: '웹에서 쓸 수 있는 기록·통계 화면까지가 1차 목표입니다.',
      progress: '레퍼런스 조사를 마치고 화면 흐름을 정리하는 중입니다.',
      team: '기획 겸 백엔드 1명이 준비하고 있습니다.',
      meeting: '평일 저녁 비동기로 소통하고 격주로 화상 회의를 합니다.',
    }),
  },
  {
    id: 3,
    kind: 'STUDY',
    operationType: 'HYBRID',
    authorNickname: '초록노트',
    title: '데이터 분석 포트폴리오 합평 스터디',
    positions: ['기획자'],
    techStack: ['TypeScript'],
    recruitmentStartAt: daysFromToday(-6),
    recruitmentEndAt: daysFromToday(18),
    capacity: 6,
    appliedCount: 3,
    closed: false,
    viewCount: 531,
    commentCount: 5,
    bookmarked: true,
    contactMethod: '오픈 채팅',
    expectedDuration: '8주',
    shortDescription: '각자 만든 분석 포트폴리오를 매주 한 명씩 발표하고 피드백합니다.',
    content: buildContent({
      intro: '혼자 만들면 판단이 어려운 포트폴리오를 서로 읽어 주는 스터디입니다.',
      goal: '8주 동안 각자 완성도 있는 분석 프로젝트 하나를 정리하는 것이 목표입니다.',
      progress: '1기 커리큘럼을 정리했고 2기 인원을 모집합니다.',
      team: '현재 3명이 참여 중이고 세 자리가 남았습니다.',
      meeting: '온라인 발표가 기본이고 한 달에 한 번은 모여서 진행합니다.',
    }),
  },
  {
    id: 4,
    kind: 'SIDE_PROJECT',
    operationType: 'OFFLINE',
    authorNickname: '느린빌드',
    title: '성수동에서 모이는 소상공인 예약 서비스 팀',
    positions: ['PM', '백엔드', '디자이너'],
    techStack: ['Spring', 'Kotlin', 'Figma'],
    recruitmentStartAt: daysFromToday(-14),
    recruitmentEndAt: daysFromToday(12),
    capacity: 6,
    appliedCount: 4,
    closed: false,
    viewCount: 774,
    commentCount: 7,
    bookmarked: false,
    contactMethod: '구글 폼',
    expectedDuration: '4개월',
    shortDescription: '동네 가게가 직접 쓰는 가벼운 예약 관리 도구를 만듭니다.',
    content: buildContent({
      intro: '전화로만 예약을 받는 작은 가게가 쓸 수 있는 예약 관리 도구를 만듭니다.',
      goal: '가게 사장님 다섯 곳에서 실제로 써 보는 것까지가 목표입니다.',
      progress: '인터뷰 다섯 건을 마쳤고 핵심 화면 두 개를 붙이는 중입니다.',
      team: 'PM 1명, 프론트엔드 2명, 디자이너 1명이 모였습니다.',
      meeting: '매주 토요일 오전 성수동 작업실에서 모입니다.',
    }),
  },
  {
    id: 5,
    kind: 'SIDE_PROJECT',
    operationType: 'ONLINE',
    authorNickname: '주말코더',
    title: '자취생 냉장고 재료 관리 앱 만들어요',
    positions: ['안드로이드', 'iOS'],
    techStack: ['Flutter', 'Kotlin'],
    recruitmentStartAt: daysFromToday(-20),
    capacity: 4,
    appliedCount: 2,
    closed: false,
    viewCount: 356,
    commentCount: 2,
    bookmarked: false,
    contactMethod: '오픈 채팅',
    shortDescription: '유통기한이 지나기 전에 알려 주는 냉장고 재료 관리 앱입니다.',
    content: buildContent({
      intro: '사 놓고 잊어버리는 재료를 줄이려고 시작한 모바일 앱입니다.',
      goal: '스토어 배포와 첫 사용자 100명이 목표입니다.',
      progress: '재료 등록 화면까지 만들었고 알림 기능이 남았습니다.',
      team: '안드로이드 1명, 디자이너 1명이 함께합니다.',
      meeting: '상시 모집이라 합류 시점에 맞춰 온라인으로 온보딩합니다.',
    }),
    eligibility: '개인 앱을 하나라도 배포해 본 경험이 있으면 좋습니다.',
  },
  {
    id: 6,
    kind: 'STUDY',
    operationType: 'ONLINE',
    authorNickname: '사이드메이커',
    title: 'Next.js 공식 문서 같이 읽는 스터디',
    positions: ['프론트엔드'],
    techStack: ['Next.js', 'React', 'TypeScript'],
    recruitmentStartAt: daysFromToday(-4),
    recruitmentEndAt: daysFromToday(9),
    capacity: 8,
    appliedCount: 5,
    closed: false,
    viewCount: 918,
    commentCount: 11,
    bookmarked: true,
    contactMethod: '오픈 채팅',
    expectedDuration: '6주',
    shortDescription: '매주 정해진 문서 범위를 읽고 예제를 하나씩 만들어 옵니다.',
    content: buildContent({
      intro: '버전이 올라갈 때마다 달라지는 내용을 같이 따라잡는 문서 읽기 스터디입니다.',
      goal: '6주 뒤 각자 작은 예제 앱 하나와 정리 노트를 남깁니다.',
      progress: '읽을 범위를 6주로 나눈 커리큘럼이 준비돼 있습니다.',
      team: '현재 5명이 참여 중입니다.',
      meeting: '매주 수요일 밤 온라인 모임 한 시간입니다.',
    }),
    eligibility: '자바스크립트 기본 문법을 알고 있으면 따라올 수 있습니다.',
  },
  {
    id: 7,
    kind: 'SIDE_PROJECT',
    operationType: 'HYBRID',
    authorNickname: '파도타는PM',
    title:
      '온라인으로 기획하고 한 달에 한 번 모여서 만드는 독서 기록 서비스, 디자이너와 백엔드 개발자를 추가로 모십니다',
    positions: ['디자이너', '백엔드'],
    techStack: ['React', 'Spring', 'Figma', 'TypeScript'],
    recruitmentStartAt: daysFromToday(-11),
    recruitmentEndAt: daysFromToday(15),
    capacity: 7,
    appliedCount: 4,
    closed: false,
    viewCount: 645,
    commentCount: 6,
    bookmarked: false,
    contactMethod: '이메일',
    expectedDuration: '5개월',
    shortDescription: '읽은 책의 문장과 생각을 모아 두는 기록 서비스입니다.',
    content: buildContent({
      intro: '책에서 밑줄 친 문장을 모아 두고 다시 꺼내 보는 서비스를 만들고 있습니다.',
      goal: '웹 배포 후 독서 모임 두 곳에서 실제로 써 보는 것이 목표입니다.',
      progress: '기획과 디자인 시안이 절반쯤 나왔고 서버 작업을 시작했습니다.',
      team: 'PM 1명, 프론트엔드 2명, 백엔드 1명이 있습니다.',
      meeting: '평소에는 온라인으로 일하고 한 달에 한 번 오프라인으로 모입니다.',
    }),
    eligibility: '월 1회 오프라인 모임에 참석할 수 있는 분을 찾습니다.',
  },
  {
    id: 8,
    kind: 'SIDE_PROJECT',
    operationType: 'ONLINE',
    authorNickname: '밤샘디자이너',
    title: '전시회 도슨트 앱 사이드 프로젝트 팀원 모집',
    positions: ['iOS', '기획자'],
    techStack: ['Flutter', 'Figma'],
    recruitmentStartAt: daysFromToday(-8),
    recruitmentEndAt: daysFromToday(7),
    capacity: 5,
    appliedCount: 3,
    closed: false,
    viewCount: 502,
    commentCount: 4,
    bookmarked: false,
    contactMethod: '오픈 채팅',
    expectedDuration: '3개월',
    shortDescription: '작은 전시회를 위한 음성 도슨트를 손쉽게 만드는 앱입니다.',
    content: buildContent({
      intro: '도슨트를 따로 두기 어려운 작은 전시장을 위한 앱입니다.',
      goal: '전시 두 곳에 시범 적용하고 피드백을 받는 것이 목표입니다.',
      progress: '프로토타입 화면이 나왔고 음성 재생 부분을 붙이고 있습니다.',
      team: '디자이너 1명, 프론트엔드 1명이 참여 중입니다.',
      meeting: '주 2회 온라인 회의와 상시 비동기 소통으로 진행합니다.',
    }),
    eligibility: '전시나 문화 공간에 관심이 있는 분이면 좋겠습니다.',
  },
  {
    id: 9,
    kind: 'SIDE_PROJECT',
    operationType: 'OFFLINE',
    authorNickname: '스택쌓는곰',
    title:
      '주 1회 오프라인으로 모여서 만드는 반려동물 산책 기록 서비스, 기획부터 배포까지 함께할 팀원을 찾습니다',
    positions: ['기획자', '프론트엔드', '백엔드'],
    techStack: ['React', 'TypeScript', 'Spring', 'Figma'],
    recruitmentStartAt: daysFromToday(-16),
    recruitmentEndAt: daysFromToday(11),
    capacity: 8,
    appliedCount: 5,
    closed: false,
    viewCount: 1204,
    commentCount: 9,
    bookmarked: true,
    contactMethod: '구글 폼',
    expectedDuration: '6개월',
    shortDescription: '산책 경로와 반려동물의 컨디션을 함께 남기는 기록 서비스입니다.',
    content: buildContent({
      intro: '산책 경로와 그날의 컨디션을 같이 남겨 두는 서비스를 만듭니다.',
      goal: '6개월 안에 웹과 모바일 웹을 배포하는 것이 목표입니다.',
      progress: '핵심 화면 기획이 끝났고 지도 연동을 검토하고 있습니다.',
      team: '기획 1명, 디자이너 1명, 개발 3명이 모였습니다.',
      meeting: '매주 일요일 오후 서울 시내 스터디룸에서 모입니다.',
    }),
    eligibility: '주말 오프라인 모임에 꾸준히 나올 수 있는 분을 찾습니다.',
  },
  {
    id: 10,
    kind: 'STUDY',
    operationType: 'ONLINE',
    authorNickname: '화요일의기획',
    title: '프론트엔드 면접 대비 CS 스터디',
    positions: ['프론트엔드'],
    techStack: ['TypeScript', 'React'],
    recruitmentStartAt: daysFromToday(-18),
    recruitmentEndAt: daysFromToday(5),
    capacity: 5,
    appliedCount: 5,
    closed: false,
    viewCount: 1387,
    commentCount: 14,
    bookmarked: false,
    contactMethod: '오픈 채팅',
    expectedDuration: '8주',
    shortDescription: '기술 면접에서 자주 나오는 주제를 매주 하나씩 정리하고 모의 면접을 봅니다.',
    content: buildContent({
      intro: '면접 질문을 혼자 정리하다 막히는 부분을 서로 채워 주는 스터디입니다.',
      goal: '8주 동안 주제별 답변 노트를 만들고 모의 면접을 네 번 진행합니다.',
      progress: '정원이 다 찼고 다음 기수 대기 인원을 받고 있습니다.',
      team: '5명 정원이 모두 찼습니다.',
      meeting: '매주 화요일 밤 온라인 모의 면접 한 시간입니다.',
    }),
    eligibility: '이직이나 첫 취업을 준비 중인 분이면 누구나 좋습니다.',
  },
  {
    id: 11,
    kind: 'SIDE_PROJECT',
    operationType: 'ONLINE',
    authorNickname: '새벽두시개발',
    title: '동네 러닝 크루 기록 앱 같이 만들 팀원 구해요',
    positions: ['안드로이드', '백엔드'],
    techStack: ['Kotlin', 'Spring'],
    recruitmentStartAt: daysFromToday(-40),
    recruitmentEndAt: daysFromToday(-3),
    capacity: 6,
    appliedCount: 4,
    closed: true,
    viewCount: 863,
    commentCount: 8,
    bookmarked: false,
    contactMethod: '이메일',
    expectedDuration: '4개월',
    shortDescription: '러닝 크루의 출석과 기록을 한곳에서 관리하는 앱입니다.',
    content: buildContent({
      intro: '메신저로 흩어지는 러닝 크루의 출석과 기록을 한곳에 모읍니다.',
      goal: '크루 세 곳이 쓸 수 있는 수준으로 만들어 배포하는 것이 목표였습니다.',
      progress: '모집을 마감했고 지금은 합류한 팀원들과 개발 중입니다.',
      team: '안드로이드 2명, 백엔드 1명, 디자이너 1명으로 팀을 꾸렸습니다.',
      meeting: '주 1회 온라인 회의와 매일 짧은 비동기 공유로 진행합니다.',
    }),
    eligibility: '모집이 끝나 지금은 추가 지원을 받지 않습니다.',
  },
  {
    id: 12,
    kind: 'STUDY',
    operationType: 'ONLINE',
    authorNickname: '코드둥지',
    title: '주 1회 알고리즘 문제 풀이 스터디 함께해요',
    positions: ['백엔드', '프론트엔드'],
    techStack: ['TypeScript', 'Kotlin'],
    recruitmentStartAt: daysFromToday(-5),
    recruitmentEndAt: daysFromToday(1),
    capacity: 6,
    appliedCount: 2,
    closed: false,
    viewCount: 1096,
    commentCount: 10,
    bookmarked: false,
    contactMethod: '오픈 채팅',
    expectedDuration: '12주',
    shortDescription: '매주 문제 세 개를 풀고 풀이를 서로 리뷰합니다.',
    content: buildContent({
      intro: '꾸준히 문제를 풀기 어려워 강제로 리듬을 만드는 스터디입니다.',
      goal: '12주 동안 매주 세 문제씩, 총 36문제 풀이를 남기는 것이 목표입니다.',
      progress: '모집 마감이 하루 남았고 다음 주부터 바로 시작합니다.',
      team: '현재 2명이고 네 자리가 남았습니다.',
      meeting: '매주 목요일 밤 온라인으로 풀이를 공유합니다.',
    }),
    eligibility: '언어는 상관없고 매주 풀이를 올릴 수 있으면 됩니다.',
  },
];
