import type { RecruitmentPostDetailResponse } from '../../generated/user/models/recruitmentPostDetailResponse';

/**
 * `GET /api/v1/recruitment-posts`, `GET /api/v1/recruitment-posts/{postId}` 목 응답의 원본.
 *
 * `./side-study.ts` 의 지어낸 12 건을 생성 모델(`RecruitmentPostDetailResponse`) 모양으로 옮긴
 * 것이다. 제목·닉네임·본문이 전부 지어낸 값이라는 점과 그 이유(PRD 6.2, 2026-09-01 결정) 는
 * 그대로다. 옮기면서 바뀐 것은 이렇다.
 *
 * - `positions` 는 스펙 enum 이다. `디자이너` 는 `DESIGN`, `기획자`·`PM` 은 `PM`,
 *   `안드로이드`·`iOS` 는 `MOBILE` 로 합쳤다.
 * - `contact` 는 수단과 값이 필수다. 값은 남의 연락처가 되지 않도록 예약 도메인
 *   `example.com` 만 쓴다. 옛 `구글 폼`(id 4, 9) 은 enum 에 없어 각각 오픈채팅·이메일로 바꿨다.
 * - `recruitmentEndDate` 가 필수가 되어 상시 모집이던 id 5 에도 마감일을 넣었다.
 * - 날짜는 시간대 없는 `YYYY-MM-DD` 다. 주 단위 진행 기간은 가까운 개월 수로 바꿨다.
 * - `content` 는 문자열이 아니라 Lexical EditorState JSON 이다(`buildContent`).
 * - 상세 응답에는 지원 수가 없어 목록용 `applicationCount` 를 따로 들고 있다.
 *
 * 상세 화면 분기를 지나가는 건: 닉네임 없음(id 2), 프로필 이미지 있음(id 1), 본문에 목록·링크·
 * 인용·코드·굵은 글씨와 렌더러가 모르는 노드가 섞인 것(id 12), 기술 스택 없음(id 3),
 * `eligibilityAndSelectionProcess` 없음(id 2, 3, 4), 마감(id 11).
 */
export type RecruitmentPostFixture = RecruitmentPostDetailResponse & {
  /** 목록 응답의 `applicationCount`. 상세 응답에는 없는 값이다. */
  applicationCount: number;
};

/** 오늘 기준 상대 일수의 로컬 날짜 `YYYY-MM-DD`. UTC 로 바꾸지 않아 자정 무렵에도 하루가 밀리지 않는다. */
const daysFromToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

/** Lexical 직렬화 노드. 필드 이름은 Lexical `exportJSON` 이 내는 모양 그대로다. */
type SerializedNode = Record<string, unknown>;

/** `format` 비트: 1 굵게, 2 기울임. Lexical `TextNode` 의 값이다. */
const text = (value: string, format = 0): SerializedNode => ({
  type: 'text',
  version: 1,
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
});

const element = (type: string, children: SerializedNode[], extra: SerializedNode = {}) => ({
  type,
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  children,
  ...extra,
});

const paragraph = (...children: SerializedNode[]) =>
  element('paragraph', children, { textFormat: 0, textStyle: '' });

const heading = (value: string) => element('heading', [text(value)], { tag: 'h3' });

const root = (children: SerializedNode[]) => ({
  root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children },
});

/**
 * 본문 소제목 구조는 목업 `사이드스터디 상세페이지.png` 를 따른다(PRD 6.2). 옛 픽스처가
 * 문자열 줄바꿈으로 흉내 내던 소제목을 이제 제목 노드로 나눠 담는다.
 */
const buildContent = (
  sections: { intro: string; goal: string; progress: string; team: string; meeting: string },
  extra: SerializedNode[] = [],
) =>
  root([
    heading('프로젝트 소개'),
    paragraph(text(sections.intro)),
    heading('목표 및 예상 산출물'),
    paragraph(text(sections.goal)),
    heading('진행 상황'),
    paragraph(text(sections.progress)),
    heading('현재 팀 구성'),
    paragraph(text(sections.team)),
    heading('모임 방식'),
    paragraph(text(sections.meeting)),
    ...extra,
  ]);

/**
 * id 12 에만 붙는 서식 모음. 렌더러가 그려야 하는 노드(목록, 링크, 인용, 코드, 굵게·기울임)
 * 와 모르는 노드를 한 번씩 지나간다. `image` 는 ogonggo-BE 테스트
 * (`ImageAssetManagerTest`) 가 쓰는 사용자 정의 노드이고, `mention` 은 텍스트를 가진 모르는
 * 인라인 노드다.
 */
const FORMATTING_SAMPLE: SerializedNode[] = [
  heading('매주 하는 일'),
  element(
    'list',
    [
      element('listitem', [text('월요일까지 문제 세 개 풀기')], { value: 1 }),
      element('listitem', [text('목요일 밤 풀이 공유와 리뷰')], { value: 2 }),
      element('listitem', [text('주말에 다음 주 문제 고르기')], { value: 3 }),
    ],
    { listType: 'number', start: 1, tag: 'ol' },
  ),
  paragraph(
    text('참여 전에 '),
    element('link', [text('스터디 안내 문서')], {
      url: 'https://example.com/study-guide',
      rel: 'noreferrer',
      target: null,
      title: null,
    }),
    text('를 꼭 읽어 주세요. '),
    text('풀이는 언어 제한이 없습니다.', 1),
  ),
  element('quote', [text('꾸준함이 실력보다 먼저입니다.', 2)]),
  element('code', [text('function solve(input) {\n  return input.trim();\n}')], {
    language: 'javascript',
  }),
  { type: 'image', version: 1, imageId: 'fixture-image-1', src: 'https://example.com/image.png' },
  paragraph(text('문의는 '), { type: 'mention', version: 1, text: '@코드둥지' }, text(' 에게.')),
];

export const RECRUITMENT_POST_FIXTURES: RecruitmentPostFixture[] = [
  {
    id: 1,
    author: { userId: 101, nickname: '문서정리봇', profileImageUrl: '/icon-192.png' },
    title: '개발자 회고 모아보는 큐레이션 서비스 팀원 구합니다',
    recruitmentType: 'SIDE_PROJECT',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-12),
    recruitmentEndDate: daysFromToday(26),
    progressMethod: 'ONLINE',
    capacity: 5,
    applicationCount: 2,
    activityDurationMonths: 3,
    technologyStacks: ['React', 'TypeScript', 'Spring'],
    positions: ['FRONTEND', 'BACKEND'],
    contact: { method: 'OPEN_KAKAO', value: 'https://example.com/open-chat/1' },
    summary: '흩어져 있는 회고 글을 주제별로 모아 보여주는 웹 서비스를 만듭니다.',
    content: buildContent({
      intro: '좋은 회고 글이 여기저기 흩어져 있어 찾기 어렵다는 문제에서 시작했습니다.',
      goal: '주제·연차별로 회고를 모아 보여주는 웹 서비스를 배포하는 것이 목표입니다.',
      progress: '기획과 화면 설계가 끝났고 다음 주부터 구현에 들어갑니다.',
      team: '기획 1명, 프론트엔드 1명이 함께하고 있습니다.',
      meeting: '주 1회 저녁 온라인 회의로 진행 상황을 나눕니다.',
    }),
    eligibilityAndSelectionProcess:
      '주 5시간 이상 참여할 수 있고 끝까지 함께 배포까지 갈 분이면 좋겠습니다.',
    viewCount: 412,
    commentCount: 3,
    bookmarkCount: 7,
    bookmarked: false,
  },
  {
    id: 2,
    author: { userId: 102 },
    title: '취미 기록 다이어리 웹 서비스 팀원 구합니다',
    recruitmentType: 'SIDE_PROJECT',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-9),
    recruitmentEndDate: daysFromToday(21),
    progressMethod: 'ONLINE',
    capacity: 4,
    applicationCount: 1,
    activityDurationMonths: 3,
    technologyStacks: ['Next.js', 'TypeScript', 'Figma'],
    positions: ['DESIGN', 'FRONTEND'],
    contact: { method: 'EMAIL', value: 'side-study-2@example.com' },
    summary: '취미 활동을 사진과 짧은 글로 남기는 개인 기록 서비스입니다.',
    content: buildContent({
      intro: '취미 활동을 가볍게 기록하고 월말에 돌아볼 수 있는 다이어리를 만듭니다.',
      goal: '웹에서 쓸 수 있는 기록·통계 화면까지가 1차 목표입니다.',
      progress: '레퍼런스 조사를 마치고 화면 흐름을 정리하는 중입니다.',
      team: '기획 겸 백엔드 1명이 준비하고 있습니다.',
      meeting: '평일 저녁 비동기로 소통하고 격주로 화상 회의를 합니다.',
    }),
    viewCount: 288,
    commentCount: 1,
    bookmarkCount: 2,
    bookmarked: false,
  },
  {
    id: 3,
    author: { userId: 103, nickname: '초록노트' },
    title: '데이터 분석 포트폴리오 합평 스터디',
    recruitmentType: 'STUDY',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-6),
    recruitmentEndDate: daysFromToday(18),
    progressMethod: 'HYBRID',
    capacity: 6,
    applicationCount: 3,
    activityDurationMonths: 2,
    technologyStacks: [],
    positions: ['PM'],
    contact: { method: 'OPEN_KAKAO', value: 'https://example.com/open-chat/3' },
    summary: '각자 만든 분석 포트폴리오를 매주 한 명씩 발표하고 피드백합니다.',
    content: buildContent({
      intro: '혼자 만들면 판단이 어려운 포트폴리오를 서로 읽어 주는 스터디입니다.',
      goal: '8주 동안 각자 완성도 있는 분석 프로젝트 하나를 정리하는 것이 목표입니다.',
      progress: '1기 커리큘럼을 정리했고 2기 인원을 모집합니다.',
      team: '현재 3명이 참여 중이고 세 자리가 남았습니다.',
      meeting: '온라인 발표가 기본이고 한 달에 한 번은 모여서 진행합니다.',
    }),
    viewCount: 531,
    commentCount: 5,
    bookmarkCount: 12,
    bookmarked: true,
  },
  {
    id: 4,
    author: { userId: 104, nickname: '느린빌드' },
    title: '성수동에서 모이는 소상공인 예약 서비스 팀',
    recruitmentType: 'SIDE_PROJECT',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-14),
    recruitmentEndDate: daysFromToday(12),
    progressMethod: 'OFFLINE',
    capacity: 6,
    applicationCount: 4,
    activityDurationMonths: 4,
    technologyStacks: ['Spring', 'Kotlin', 'Figma'],
    positions: ['PM', 'BACKEND', 'DESIGN'],
    contact: { method: 'OPEN_KAKAO', value: 'https://example.com/open-chat/4' },
    summary: '동네 가게가 직접 쓰는 가벼운 예약 관리 도구를 만듭니다.',
    content: buildContent({
      intro: '전화로만 예약을 받는 작은 가게가 쓸 수 있는 예약 관리 도구를 만듭니다.',
      goal: '가게 사장님 다섯 곳에서 실제로 써 보는 것까지가 목표입니다.',
      progress: '인터뷰 다섯 건을 마쳤고 핵심 화면 두 개를 붙이는 중입니다.',
      team: 'PM 1명, 프론트엔드 2명, 디자이너 1명이 모였습니다.',
      meeting: '매주 토요일 오전 성수동 작업실에서 모입니다.',
    }),
    viewCount: 774,
    commentCount: 7,
    bookmarkCount: 9,
    bookmarked: false,
  },
  {
    id: 5,
    author: { userId: 105, nickname: '주말코더' },
    title: '자취생 냉장고 재료 관리 앱 만들어요',
    recruitmentType: 'SIDE_PROJECT',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-20),
    recruitmentEndDate: daysFromToday(30),
    progressMethod: 'ONLINE',
    capacity: 4,
    applicationCount: 2,
    activityDurationMonths: 3,
    technologyStacks: ['Flutter', 'Kotlin'],
    positions: ['MOBILE'],
    contact: { method: 'OPEN_KAKAO', value: 'https://example.com/open-chat/5' },
    summary: '유통기한이 지나기 전에 알려 주는 냉장고 재료 관리 앱입니다.',
    content: buildContent({
      intro: '사 놓고 잊어버리는 재료를 줄이려고 시작한 모바일 앱입니다.',
      goal: '스토어 배포와 첫 사용자 100명이 목표입니다.',
      progress: '재료 등록 화면까지 만들었고 알림 기능이 남았습니다.',
      team: '안드로이드 1명, 디자이너 1명이 함께합니다.',
      meeting: '합류 시점에 맞춰 온라인으로 온보딩합니다.',
    }),
    eligibilityAndSelectionProcess: '개인 앱을 하나라도 배포해 본 경험이 있으면 좋습니다.',
    viewCount: 356,
    commentCount: 2,
    bookmarkCount: 4,
    bookmarked: false,
  },
  {
    id: 6,
    author: { userId: 106, nickname: '사이드메이커' },
    title: 'Next.js 공식 문서 같이 읽는 스터디',
    recruitmentType: 'STUDY',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-4),
    recruitmentEndDate: daysFromToday(9),
    progressMethod: 'ONLINE',
    capacity: 8,
    applicationCount: 5,
    activityDurationMonths: 2,
    technologyStacks: ['Next.js', 'React', 'TypeScript'],
    positions: ['FRONTEND'],
    contact: { method: 'OPEN_KAKAO', value: 'https://example.com/open-chat/6' },
    summary: '매주 정해진 문서 범위를 읽고 예제를 하나씩 만들어 옵니다.',
    content: buildContent({
      intro: '버전이 올라갈 때마다 달라지는 내용을 같이 따라잡는 문서 읽기 스터디입니다.',
      goal: '6주 뒤 각자 작은 예제 앱 하나와 정리 노트를 남깁니다.',
      progress: '읽을 범위를 6주로 나눈 커리큘럼이 준비돼 있습니다.',
      team: '현재 5명이 참여 중입니다.',
      meeting: '매주 수요일 밤 온라인 모임 한 시간입니다.',
    }),
    eligibilityAndSelectionProcess: '자바스크립트 기본 문법을 알고 있으면 따라올 수 있습니다.',
    viewCount: 918,
    commentCount: 11,
    bookmarkCount: 21,
    bookmarked: true,
  },
  {
    id: 7,
    author: { userId: 107, nickname: '파도타는PM' },
    title:
      '온라인으로 기획하고 한 달에 한 번 모여서 만드는 독서 기록 서비스, 디자이너와 백엔드 개발자를 추가로 모십니다',
    recruitmentType: 'SIDE_PROJECT',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-11),
    recruitmentEndDate: daysFromToday(15),
    progressMethod: 'HYBRID',
    capacity: 7,
    applicationCount: 4,
    activityDurationMonths: 5,
    technologyStacks: ['React', 'Spring', 'Figma', 'TypeScript'],
    positions: ['DESIGN', 'BACKEND'],
    contact: { method: 'EMAIL', value: 'side-study-7@example.com' },
    summary: '읽은 책의 문장과 생각을 모아 두는 기록 서비스입니다.',
    content: buildContent({
      intro: '책에서 밑줄 친 문장을 모아 두고 다시 꺼내 보는 서비스를 만들고 있습니다.',
      goal: '웹 배포 후 독서 모임 두 곳에서 실제로 써 보는 것이 목표입니다.',
      progress: '기획과 디자인 시안이 절반쯤 나왔고 서버 작업을 시작했습니다.',
      team: 'PM 1명, 프론트엔드 2명, 백엔드 1명이 있습니다.',
      meeting: '평소에는 온라인으로 일하고 한 달에 한 번 오프라인으로 모입니다.',
    }),
    eligibilityAndSelectionProcess: '월 1회 오프라인 모임에 참석할 수 있는 분을 찾습니다.',
    viewCount: 645,
    commentCount: 6,
    bookmarkCount: 8,
    bookmarked: false,
  },
  {
    id: 8,
    author: { userId: 108, nickname: '밤샘디자이너' },
    title: '전시회 도슨트 앱 사이드 프로젝트 팀원 모집',
    recruitmentType: 'SIDE_PROJECT',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-8),
    recruitmentEndDate: daysFromToday(7),
    progressMethod: 'ONLINE',
    capacity: 5,
    applicationCount: 3,
    activityDurationMonths: 3,
    technologyStacks: ['Flutter', 'Figma'],
    positions: ['MOBILE', 'PM'],
    contact: { method: 'OPEN_KAKAO', value: 'https://example.com/open-chat/8' },
    summary: '작은 전시회를 위한 음성 도슨트를 손쉽게 만드는 앱입니다.',
    content: buildContent({
      intro: '도슨트를 따로 두기 어려운 작은 전시장을 위한 앱입니다.',
      goal: '전시 두 곳에 시범 적용하고 피드백을 받는 것이 목표입니다.',
      progress: '프로토타입 화면이 나왔고 음성 재생 부분을 붙이고 있습니다.',
      team: '디자이너 1명, 프론트엔드 1명이 참여 중입니다.',
      meeting: '주 2회 온라인 회의와 상시 비동기 소통으로 진행합니다.',
    }),
    eligibilityAndSelectionProcess: '전시나 문화 공간에 관심이 있는 분이면 좋겠습니다.',
    viewCount: 502,
    commentCount: 4,
    bookmarkCount: 5,
    bookmarked: false,
  },
  {
    id: 9,
    author: { userId: 109, nickname: '스택쌓는곰' },
    title:
      '주 1회 오프라인으로 모여서 만드는 반려동물 산책 기록 서비스, 기획부터 배포까지 함께할 팀원을 찾습니다',
    recruitmentType: 'SIDE_PROJECT',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-16),
    recruitmentEndDate: daysFromToday(11),
    progressMethod: 'OFFLINE',
    capacity: 8,
    applicationCount: 5,
    activityDurationMonths: 6,
    technologyStacks: ['React', 'TypeScript', 'Spring', 'Figma'],
    positions: ['PM', 'FRONTEND', 'BACKEND'],
    contact: { method: 'EMAIL', value: 'side-study-9@example.com' },
    summary: '산책 경로와 반려동물의 컨디션을 함께 남기는 기록 서비스입니다.',
    content: buildContent({
      intro: '산책 경로와 그날의 컨디션을 같이 남겨 두는 서비스를 만듭니다.',
      goal: '6개월 안에 웹과 모바일 웹을 배포하는 것이 목표입니다.',
      progress: '핵심 화면 기획이 끝났고 지도 연동을 검토하고 있습니다.',
      team: '기획 1명, 디자이너 1명, 개발 3명이 모였습니다.',
      meeting: '매주 일요일 오후 서울 시내 스터디룸에서 모입니다.',
    }),
    eligibilityAndSelectionProcess: '주말 오프라인 모임에 꾸준히 나올 수 있는 분을 찾습니다.',
    viewCount: 1204,
    commentCount: 9,
    bookmarkCount: 30,
    bookmarked: true,
  },
  {
    id: 10,
    author: { userId: 110, nickname: '화요일의기획' },
    title: '프론트엔드 면접 대비 CS 스터디',
    recruitmentType: 'STUDY',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-18),
    recruitmentEndDate: daysFromToday(5),
    progressMethod: 'ONLINE',
    capacity: 5,
    applicationCount: 5,
    activityDurationMonths: 2,
    technologyStacks: ['TypeScript', 'React'],
    positions: ['FRONTEND'],
    contact: { method: 'OPEN_KAKAO', value: 'https://example.com/open-chat/10' },
    summary: '기술 면접에서 자주 나오는 주제를 매주 하나씩 정리하고 모의 면접을 봅니다.',
    content: buildContent({
      intro: '면접 질문을 혼자 정리하다 막히는 부분을 서로 채워 주는 스터디입니다.',
      goal: '8주 동안 주제별 답변 노트를 만들고 모의 면접을 네 번 진행합니다.',
      progress: '정원이 다 찼고 다음 기수 대기 인원을 받고 있습니다.',
      team: '5명 정원이 모두 찼습니다.',
      meeting: '매주 화요일 밤 온라인 모의 면접 한 시간입니다.',
    }),
    eligibilityAndSelectionProcess: '이직이나 첫 취업을 준비 중인 분이면 누구나 좋습니다.',
    viewCount: 1387,
    commentCount: 14,
    bookmarkCount: 26,
    bookmarked: false,
  },
  {
    id: 11,
    author: { userId: 111, nickname: '새벽두시개발' },
    title: '동네 러닝 크루 기록 앱 같이 만들 팀원 구해요',
    recruitmentType: 'SIDE_PROJECT',
    recruitmentStatus: 'CLOSED',
    recruitmentStartDate: daysFromToday(-40),
    recruitmentEndDate: daysFromToday(-3),
    progressMethod: 'ONLINE',
    capacity: 6,
    applicationCount: 4,
    activityDurationMonths: 4,
    technologyStacks: ['Kotlin', 'Spring'],
    positions: ['MOBILE', 'BACKEND'],
    contact: { method: 'EMAIL', value: 'side-study-11@example.com' },
    summary: '러닝 크루의 출석과 기록을 한곳에서 관리하는 앱입니다.',
    content: buildContent({
      intro: '메신저로 흩어지는 러닝 크루의 출석과 기록을 한곳에 모읍니다.',
      goal: '크루 세 곳이 쓸 수 있는 수준으로 만들어 배포하는 것이 목표였습니다.',
      progress: '모집을 마감했고 지금은 합류한 팀원들과 개발 중입니다.',
      team: '안드로이드 2명, 백엔드 1명, 디자이너 1명으로 팀을 꾸렸습니다.',
      meeting: '주 1회 온라인 회의와 매일 짧은 비동기 공유로 진행합니다.',
    }),
    eligibilityAndSelectionProcess: '모집이 끝나 지금은 추가 지원을 받지 않습니다.',
    viewCount: 863,
    commentCount: 8,
    bookmarkCount: 6,
    bookmarked: false,
  },
  {
    id: 12,
    author: { userId: 112, nickname: '코드둥지' },
    title: '주 1회 알고리즘 문제 풀이 스터디 함께해요',
    recruitmentType: 'STUDY',
    recruitmentStatus: 'RECRUITING',
    recruitmentStartDate: daysFromToday(-5),
    recruitmentEndDate: daysFromToday(1),
    progressMethod: 'ONLINE',
    capacity: 6,
    applicationCount: 2,
    activityDurationMonths: 3,
    technologyStacks: ['TypeScript', 'Kotlin'],
    positions: ['BACKEND', 'FRONTEND'],
    contact: { method: 'OPEN_KAKAO', value: 'https://example.com/open-chat/12' },
    summary: '매주 문제 세 개를 풀고 풀이를 서로 리뷰합니다.',
    content: buildContent(
      {
        intro: '꾸준히 문제를 풀기 어려워 강제로 리듬을 만드는 스터디입니다.',
        goal: '12주 동안 매주 세 문제씩, 총 36문제 풀이를 남기는 것이 목표입니다.',
        progress: '모집 마감이 하루 남았고 다음 주부터 바로 시작합니다.',
        team: '현재 2명이고 네 자리가 남았습니다.',
        meeting: '매주 목요일 밤 온라인으로 풀이를 공유합니다.',
      },
      FORMATTING_SAMPLE,
    ),
    eligibilityAndSelectionProcess: '언어는 상관없고 매주 풀이를 올릴 수 있으면 됩니다.',
    viewCount: 1096,
    commentCount: 10,
    bookmarkCount: 15,
    bookmarked: false,
  },
];
