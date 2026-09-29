/**
 * 오픈채팅방 넷. 비밀이 아니라 공개 초대 주소다. `.env` 로 뺄 이유가 없고, 빼면 값이 없는 환경에서
 * 배너가 조용히 빈 모달을 연다.
 *
 * 모달(`ui/KakaoChannelBanner.tsx`)과 미리보기 경로(`app/open-chat-previews/route.ts`)가 같이 쓴다.
 * 미리보기 경로는 이 넷만 읽는다 — 요청으로 주소를 받으면 남의 페이지를 대신 읽어 주는 통로가 된다.
 */
export const OPEN_CHAT_ROOMS = [
  { job: '마케팅', url: 'https://open.kakao.com/o/g9JmRSFh' },
  { job: '세일즈', url: 'https://open.kakao.com/o/gZgMRSFh' },
  { job: '기획/운영', url: 'https://open.kakao.com/o/gPDpSSFh' },
  { job: '인사/HR/경영관리', url: 'https://open.kakao.com/o/ghzwTSFh' },
] as const;

/** 방 하나의 링크 미리보기. 카카오가 주는 `og:title`·`og:image` 다. 읽지 못한 값은 없다. */
export interface OpenChatPreview {
  url: string;
  title?: string;
  image?: string;
}
