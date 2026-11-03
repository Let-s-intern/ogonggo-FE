import { OPEN_CHAT_ROOMS } from '@/widgets/my-profile/model/openChatRooms';

/**
 * 커뮤니티 화면(`community-pc.png`, `community-mo.png`)의 문구와 외부 링크. 서버 데이터가 없어 코드 상수로 둔다
 * (`.claude/tasks/memos/결정-광고시스템-web-커뮤니티-2026-11-03.md`).
 */

const roomUrl = (job: (typeof OPEN_CHAT_ROOMS)[number]['job']) =>
  OPEN_CHAT_ROOMS.find((room) => room.job === job)?.url;

export interface OpenChatChannel {
  title: string;
  description: string;
  /** 오픈채팅 초대 주소. 받지 못한 방은 없고, 화면에 그리지 않는다. */
  url?: string;
}

/**
 * 시안의 톡방 여섯. 주소는 마이페이지 채팅방 모달과 같은 목록(`widgets/my-profile/model/openChatRooms.ts`)에서
 * 가져온다. `공채 공고 큐레이션&QNA` 와 `AI역량/개발` 은 주소를 받지 못해 비워 둔다 — 받으면 여기 채운다.
 */
export const OPEN_CHAT_CHANNELS: OpenChatChannel[] = [
  {
    title: '공채 공고 큐레이션&QNA',
    description: '신입 공채 정보부터 취업 고민 해결까지 한곳에서 만나보세요.',
  },
  {
    title: '세일즈 채용공고 큐레이션',
    description: '영업·세일즈 직무의 최신 채용공고를 빠르게 확인해 보세요.',
    url: roomUrl('세일즈'),
  },
  {
    title: 'AI역량/개발 채용공고 큐레이션',
    description: 'AI·개발 직무의 채용 정보와 취업 기회를 만나보세요.',
  },
  {
    title: '마케팅 채용공고 큐레이션',
    description: '마케팅 직무별 채용공고와 취업 정보를 한눈에 확인해 보세요.',
    url: roomUrl('마케팅'),
  },
  {
    title: '인사/HR/경영관리 채용공고 큐레이션',
    description: '인사·HR·경영관리 직무의 채용 소식을 모아보세요.',
    url: roomUrl('인사/HR/경영관리'),
  },
  {
    title: '기획/운영 채용공고 큐레이션',
    description: '기획·서비스 운영 직무의 채용공고를 빠르게 확인해 보세요.',
    url: roomUrl('기획/운영'),
  },
];

/** `톡방에서 매일 이런 정보가 공유돼요` 의 카드 넷. */
export const SHARED_INFO_TOPICS = ['취준 꿀팁', '채용공고 공유', '공고 추천', '취준 컨텐츠 추천'];

export interface InstagramAccount {
  handle: string;
  caption: string;
  headline: string;
  body: string;
  url: string;
}

/**
 * 시안의 인스타그램 계정. PC 셋째 카드(`@letscareer.job` · 렛츠커리어 대외활동)는 첫 카드와 계정명이 같아
 * 넣지 않았다 — 계정명을 PM 에게 확인한다(PRD `커뮤니티` 확인 필요).
 */
export const INSTAGRAM_ACCOUNTS: InstagramAccount[] = [
  {
    handle: '@letscareer.job',
    caption: '렛츠커리어 오공고',
    headline: '나에게 맞는 직무를 찾는 분께 추천',
    body: '문과 취준생을 위해 큐레이션된 채용공고와 직무 인사이트를 인스타그램으로 가장 빠르게 만나보세요.',
    url: 'https://www.instagram.com/letscareer.job',
  },
  {
    handle: '@letscareer.official',
    caption: '렛츠커리어 공식',
    headline: '취업 트렌드를 놓치고 싶지 않은 분께 추천',
    body: '빠르고 트렌디한 취준 정보를 매일 오전 10시에 받아볼 수 있어요. 렛츠커리어의 모든 소식이 여기 담겨있어요.',
    url: 'https://www.instagram.com/letscareer.official',
  },
  {
    handle: '@letscareer.qna',
    caption: '렛츠커리어 QNA',
    headline: '취업 고민을 편하게 묻고 싶은 분께 추천',
    body: '현직자 멘토와 커리어 매니저에게 무엇이든 질문하고 취업 고민을 편하게 풀어보세요.',
    url: 'https://www.instagram.com/letscareer.qna',
  },
  {
    handle: 'letscareer.gongchae',
    caption: '렛츠커리어 공채',
    headline: '신입 공채 정보를 찾는 분께 추천',
    body: '문과 취준생을 위한 신입 공채와 기업별 채용 소식, 놓치기 쉬운 공채 일정까지 한눈에 확인해 보세요.',
    url: 'https://www.instagram.com/letscareer.gongchae',
  },
];
