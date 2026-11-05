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
  /** `public/community/`. 렛츠커리어 `images/instagram-*` 의 프로필과 앞의 게시물 셋이다. */
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
    profileImage: '/community/instagram-job-profile.jpg',
    thumbnails: [
      { src: '/community/instagram-job-1.jpg', alt: '오공고 소개' },
      { src: '/community/instagram-job-2.jpg', alt: '인턴 합격 후기' },
      { src: '/community/instagram-job-3.jpg', alt: '카카오스타일 마케팅 인턴 채용' },
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
    ],
  },
];
