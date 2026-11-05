/**
 * `/community` 화면의 문구·링크·이미지. 손으로 고치는 값은 이 파일에만 둔다.
 *
 * 제목·설명 문구는 시안(`.claude/tasks/todo/오공고 커무니티/image copy.png`)을 따르고, 링크·계정·이미지는
 * 렛츠커리어 커뮤니티 페이지(`lets-intern-client` `apps/web/src/domain/community/data/`)에서 옮겼다. 두 곳이
 * 같은 방·계정으로 보내야 한다(이슈 #569).
 *
 * 시안에는 톡방 여섯(공채 공고 큐레이션&QNA, AI역량/개발 포함)과 인스타그램 다섯(대외활동, 공채 계정 포함)이
 * 있지만, 렛츠커리어에 주소가 있는 것은 톡방 넷과 계정 셋뿐이다. 주소가 생기면 아래 배열에 더한다.
 */

export interface OpenChatRoomCard {
  /** 분석 이벤트의 `community_name`. */
  id: string;
  title: string;
  description: string;
  /** 카드 왼쪽 아이콘(lucide). Tailwind 가 클래스 이름을 읽어야 해서 통째로 적는다. */
  iconClass: string;
  url: string;
}

/**
 * 직무별 오픈채팅방. 주소는 마이페이지 배너(`widgets/my-profile/model/openChatRooms.ts`)와 같은 넷이다.
 * 순서는 시안의 순서에서 주소가 없는 방을 뺀 것이다.
 */
export const OPEN_CHAT_ROOM_CARDS: OpenChatRoomCard[] = [
  {
    id: 'sales',
    title: '세일즈 채용공고 큐레이션',
    description: '영업·세일즈 직무의 최신 채용공고를 빠르게 확인해 보세요.',
    iconClass: 'icon-[lucide--briefcase-business]',
    url: 'https://open.kakao.com/o/gZgMRSFh',
  },
  {
    id: 'marketing',
    title: '마케팅 채용공고 큐레이션',
    description: '마케팅 직무별 채용공고와 취업 정보를 한눈에 확인해 보세요.',
    iconClass: 'icon-[lucide--megaphone]',
    url: 'https://open.kakao.com/o/g9JmRSFh',
  },
  {
    id: 'hr',
    title: '인사/HR/경영관리 채용공고 큐레이션',
    description: '인사·HR·경영관리 직무의 채용 소식을 모아보세요.',
    iconClass: 'icon-[lucide--square-user]',
    url: 'https://open.kakao.com/o/ghzwTSFh',
  },
  {
    id: 'planning',
    title: '기획/운영 채용공고 큐레이션',
    description: '기획·서비스 운영 직무의 채용공고를 빠르게 확인해 보세요.',
    iconClass: 'icon-[lucide--shapes]',
    url: 'https://open.kakao.com/o/gPDpSSFh',
  },
];

export interface ChatPreviewCard {
  label: string;
  alt: string;
  /** `public/community/`. 렛츠커리어 `images/chat-*.jpg` 를 폭 720 으로 줄였다. */
  src: string;
}

/** 톡방 화면 캡처 넷. 대체 텍스트는 렛츠커리어 것 그대로다. */
export const CHAT_PREVIEW_CARDS: ChatPreviewCard[] = [
  { label: '취준 꿀팁', alt: '취준 꿀팁 공유', src: '/community/chat-tip.jpg' },
  { label: '채용공고 공유', alt: '채용공고 큐레이션', src: '/community/chat-job.jpg' },
  { label: '공고 추천', alt: 'HR 공고 추천', src: '/community/chat-hr.jpg' },
  { label: '취준 컨텐츠 추천', alt: '취준 콘텐츠 추천', src: '/community/chat-info.jpg' },
];

export interface InstagramAccountCard {
  /** 분석 이벤트의 `community_name`. */
  id: string;
  handle: string;
  label: string;
  /** 파란 상자의 굵은 첫 줄. 시안 문구다. */
  pitch: string;
  /** 파란 상자의 설명. 렛츠커리어 문구다. */
  description: string;
  url: string;
  /** `public/community/`. 렛츠커리어 `images/instagram-*` 의 프로필과 게시물 여섯이다(2026-11-05 사용자: 사진 6개 모두). */
  profileImage: string;
  thumbnails: { src: string; alt: string }[];
}

export const INSTAGRAM_ACCOUNT_CARDS: InstagramAccountCard[] = [
  {
    id: 'job',
    handle: '@letscareer.job',
    label: '렛츠커리어 오공고',
    pitch: '나에게 맞는 직무를 찾는 분께 추천',
    description:
      '문과 취준생을 위해 큐레이션된 채용공고와 직무 인사이트를 인스타그램으로 가장 빠르게 만나보세요.',
    url: 'https://www.instagram.com/letscareer.job?igsh=dXl4YmhvOWdsYXU1',
    profileImage: '/community/instagram-job-profile-ogonggo.jpg',
    thumbnails: [
      { src: '/community/instagram-job-1.jpg', alt: '오공고 소개' },
      { src: '/community/instagram-job-2.jpg', alt: '인턴 합격 후기' },
      { src: '/community/instagram-job-3.jpg', alt: '카카오스타일 마케팅 인턴 채용' },
      { src: '/community/instagram-job-4.jpg', alt: 'PTKOREA 공채 문과 직무' },
      { src: '/community/instagram-job-5.jpg', alt: '오늘의집 Recruiting Coordinator' },
      { src: '/community/instagram-job-6.jpg', alt: '당근마켓 그로스 매니저 인턴' },
    ],
  },
  {
    id: 'official',
    handle: '@letscareer.official',
    label: '렛츠커리어 공식',
    pitch: '취업 트렌드를 놓치고 싶지 않은 분께 추천',
    description:
      '빠르고 트렌디한 취준 정보를 매일 오전 10시에 받아볼 수 있어요. 렛츠커리어의 모든 소식이 여기 담겨있어요.',
    url: 'https://www.instagram.com/letscareer.official?igsh=MTNkMDNxcWt5MG43bA==',
    profileImage: '/community/instagram-official-profile.jpg',
    thumbnails: [
      { src: '/community/instagram-official-1.jpg', alt: '2026 자유양식 이력서 템플릿' },
      { src: '/community/instagram-official-2.jpg', alt: '삼성·롯데 인적성 시작을 시작해' },
      { src: '/community/instagram-official-3.jpg', alt: '문과 직무 SQL & AI 활용 실습' },
      { src: '/community/instagram-official-4.jpg', alt: '자소서 제출 직전 성과가 없어 보인다면' },
      { src: '/community/instagram-official-5.jpg', alt: '네이버 마케터 ADsP·SQLD 따야 돼?' },
      { src: '/community/instagram-official-6.jpg', alt: 'AI 면접관 프롬프트 공개' },
    ],
  },
  {
    id: 'univ',
    // 계정 주소와 프로필·게시물 캡처 다섯 장은 사용자가 준 것이다(2026-11-05). 여섯째 칸은 비어 회색으로 남는다.
    handle: '@letscareer.univ',
    label: '렛츠커리어 대외활동',
    pitch: '다양한 대외활동을 찾는 분께 추천',
    description:
      '다양한 대외활동과 공모전 정보부터 취업에 필요한 경험을 쌓을 기회까지 빠르게 만나보세요.',
    url: 'https://www.instagram.com/letscareer.univ/',
    profileImage: '/community/instagram-univ-profile.jpg',
    thumbnails: [
      { src: '/community/instagram-univ-1.jpg', alt: '2026년 10월 5주차 대외활동·공모전' },
      { src: '/community/instagram-univ-2.jpg', alt: '네이버 웹툰 찐오타쿠 모집' },
      { src: '/community/instagram-univ-3.jpg', alt: '교촌 서포터즈 모집' },
      { src: '/community/instagram-univ-4.jpg', alt: '대학생 일본여행 무료 지원' },
      { src: '/community/instagram-univ-5.jpg', alt: '학년별 취업 준비' },
    ],
  },
  {
    id: 'qna',
    handle: '@letscareer.qna',
    label: '렛츠커리어 QNA',
    // 시안 문구 그대로다 — `@letscareer.job` 카드와 같은 말이 들어가 있다. 바꿀 문구는 확인 필요.
    pitch: '나에게 맞는 직무를 찾는 분께 추천',
    description: '현직자 멘토와 커리어 매니저에게 무제한 질의응답. 취업 고민을 편하게 올려두세요.',
    url: 'https://www.instagram.com/letscareer.qna?igsh=a24wYmdlNWM1amUy',
    profileImage: '/community/instagram-qna-profile.jpg',
    thumbnails: [
      { src: '/community/instagram-qna-1.jpg', alt: '취준생의 현실 12시간 루틴' },
      { src: '/community/instagram-qna-2.jpg', alt: '인적성 면접 준비 가이드' },
      { src: '/community/instagram-qna-3.jpg', alt: '인스타그램 광고로 역량 쌓는법' },
      { src: '/community/instagram-qna-4.jpg', alt: 'AI 티 나는 문장 4가지' },
      { src: '/community/instagram-qna-5.jpg', alt: '면접에서 AI 써봤냐고 물어보면' },
      { src: '/community/instagram-qna-6.jpg', alt: '계약직 vs 정규직 퍼포먼스 QNA' },
    ],
  },
  {
    id: 'gongchae',
    // 프로필과 게시물은 사용자가 준 자료(`letscareer_공채` 폴더)다. 넷째 캡처와 같은 그림이 한 장 더 있어 다섯 장만 넣어
    // 여섯째 칸은 비어 회색으로 남는다. 계정 주소는 사용자가 준 것이다(2026-11-05).
    handle: '@letscareer.gongchae',
    label: '렛츠커리어 공채',
    pitch: '신입 공채 정보를 찾는 분께 추천',
    description:
      '문과 취준생을 위한 신입 공채와 기업별 채용 소식, 놓치기 쉬운 공채 일정까지 한눈에 확인해 보세요.',
    url: 'https://www.instagram.com/letscareer.gongchae/',
    profileImage: '/community/instagram-gongchae-profile.jpg',
    thumbnails: [
      { src: '/community/instagram-gongchae-1.jpg', alt: '삼성전자 GSAT 참거짓 문제' },
      { src: '/community/instagram-gongchae-2.jpg', alt: '삼성전자 GSAT 자료해석 유형' },
      { src: '/community/instagram-gongchae-3.jpg', alt: '1분 안에 풀어야 하는 삼성 GSAT 문제' },
      { src: '/community/instagram-gongchae-4.jpg', alt: '오답률 86% 삼성 인적성 문제' },
      {
        src: '/community/instagram-gongchae-5.jpg',
        alt: '60초 안에 풀어야 하는 삼성 필기고사 문제',
      },
    ],
  },
];
