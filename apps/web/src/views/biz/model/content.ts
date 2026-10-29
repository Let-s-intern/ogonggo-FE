/**
 * `/biz`(출시 기념 무료 홍보 이벤트) 화면의 문구와 수치.
 *
 * 문구는 `apps/launch-notice/src/app/page.tsx` 에서 옮겨 와 PRD(`prd-biz-free-promo-event.md`) 2~6절대로
 * 고쳤다. 손으로 고치는 값은 이 파일에만 둔다.
 */

import { enumOptions } from '@ogonggo/api';

export const INSTAGRAM_URL = 'https://www.instagram.com/letscareer.job';

/**
 * 출시일. 메이 님 확인 전이라(PRD 결정 4) 한 곳에만 둔다. 바뀌면 이 줄만 고친다.
 */
export const LAUNCH_DATE_LABEL = '10월 12일';

/**
 * 채널 규모. 서버 enum 은 규모를 담지 않는다
 * (`ogonggo-BE/.../advertisementinquiry/domain/AdvertisementInquiryPromotionChannel.kt` 주석).
 * 손으로 고치는 값이다.
 */
export const INSTAGRAM_FOLLOWERS_LABEL = '2.9만';
export const OPEN_CHAT_MEMBERS_LABEL = '7,281';
/** 오픈채팅 인원을 센 때. 인원 옆에 `기준` 으로 붙는다. */
export const OPEN_CHAT_MEMBERS_AS_OF = '2026년 10월';
export const OPEN_CHAT_ROOM_COUNT = 6;

/** 직무별 오픈채팅방 여섯 곳. 라벨은 enum 카탈로그 그대로다(`docs/architecture.md` 라벨 규칙 1). */
export const OPEN_CHAT_ROOMS = enumOptions('AdvertisementInquiryPromotionChannel').filter(
  ({ value }) => value.startsWith('OPEN_CHAT_'),
);

export const INTRO_FEATURES = [
  {
    title: ['핵심 키워드로 채용공고의', '주요 내용을 쉽게 전달합니다'],
    body: '공고의 핵심 정보를 한눈에 파악할 수 있도록 정리해, 지원자가 자신의 경험 중 어떤 부분을 강조할 수 있을지 이해하도록 돕습니다.',
    image: {
      src: '/biz/intro-duties.webp',
      width: 2000,
      height: 493,
      alt: '채용공고 상세의 담당 업무 구역',
    },
  },
  {
    title: ['자격 요건을 한눈에 확인할 수', '있도록 구성합니다'],
    body: '필수 요건과 우대 사항을 구분해 보여주어, 지원자가 자신의 지원 가능 여부를 쉽게 판단할 수 있도록 돕습니다.',
    image: {
      src: '/biz/intro-requirements.webp',
      width: 2000,
      height: 1080,
      alt: '채용공고 상세의 자격 요건 체크리스트',
    },
  },
  {
    title: ['지원자가 자신의 경험과 연결해', '볼 수 있도록 공고와 함께 안내합니다'],
    body: '공모전·동아리·인턴처럼 지원자에게 익숙한 경험을 바탕으로 직무에 필요한 역량을 이해하고, 실제 지원까지 이어질 수 있도록 돕습니다.',
    image: {
      src: '/biz/intro-experiences.webp',
      width: 2000,
      height: 938,
      alt: '채용공고 상세의 이력서에 담을 경험 구역',
    },
  },
] as const;

export const STEPS = [
  { title: '신청서 제출', body: '채널과 공고 링크만 남겨주세요. 1분이면 끝납니다.' },
  {
    title: '진행 여부와 송출일 안내',
    body: '담당자가 확인 후 진행 여부와 (진행 시) 송출일을 안내드립니다.',
  },
  { title: '홍보 집행', body: '오늘의 공고에 게시 후 선택한 채널을 통해 공고가 확산됩니다.' },
] as const;

export const APPLY_NOTES = [
  '신청만으로 발생하는 비용이나 의무는 없습니다.',
  '정규직·인턴 채용 공고를 우선 진행합니다.',
  '기업회원으로 가입하면 이후 공고를 직접 등록하고 관리할 수 있습니다.',
] as const;

/** 1번·2번 답은 PRD 6절대로 `출시 알림` 표현을 고쳤다. */
export const FAQ = [
  {
    q: '지금 채용 계획이 확정되지 않았는데 신청해도 되나요?',
    a: '괜찮습니다. 신청은 홍보 일정을 잡기 위한 절차일 뿐이고, 실제 집행 시점은 공고가 나온 뒤에 정하시면 됩니다. 신청만으로 발생하는 비용이나 의무는 없습니다.',
  },
  {
    q: '비용은 얼마인가요?',
    a: '신청하신 기업은 채널 한 곳에 1회 무료로 집행해드립니다. 이후 추가 집행 단가는 신청 즉시 보내드리는 소개서에서 확인하실 수 있습니다.',
  },
  {
    q: '어떤 회사든 진행할 수 있나요?',
    a: '채널 구독자가 신뢰할 수 있는 공고인지 확인한 뒤 진행합니다. 정규직·인턴 채용 공고를 우선하며, 근무 조건이 명확하지 않은 공고는 정중히 거절할 수 있습니다.',
  },
  {
    q: '공고 소재를 저희가 만들어야 하나요?',
    a: '아닙니다. 채용 페이지 링크만 주시면 렛츠커리어가 채널별 소재를 제작합니다.',
  },
] as const;

export const TERMS_URL =
  'https://letsintern.notion.site/3e95e77cbee180f993a3c70e3bce5a21?source=copy_link';
export const PRIVACY_URL = 'https://letsintern.notion.site/3e95e77cbee18074a1c7dc485644d737?pvs=74';

/**
 * 히어로 브라우저 틀이 돌리는 화면(PRD 2절). 캡처는 `public/biz/` 에 화면 이름으로 둔다.
 *
 * 무엇을 찍을지는 영업이 고르고 노출 동의를 받는다(PRD 결정 5). 확정 전이라 2026-10-28 에 게시 중이던
 * 공고 19048 과 부트캠프 3305 로 찍었다. 바꿀 때는 같은 이름으로 파일만 바꾸고, 크기가 다르면 아래
 * `width`·`height` 와 주소 표시줄을 함께 고친다. 1280px 폭, 로그아웃 상태, 위에서 1800px 까지다.
 */
export const HERO_SCREENS = [
  {
    key: 'jobs-list',
    label: '채용공고 목록',
    address: 'ogonggo.co.kr',
    src: '/biz/jobs-list.webp',
    width: 1280,
    height: 1800,
  },
  {
    key: 'job-detail',
    label: '공고 상세',
    address: 'ogonggo.co.kr/jobs/19048',
    src: '/biz/job-detail.webp',
    width: 1280,
    height: 1800,
  },
  {
    key: 'bootcamps-list',
    label: '부트캠프 목록',
    address: 'ogonggo.co.kr/bootcamps',
    src: '/biz/bootcamps-list.webp',
    width: 1280,
    height: 1800,
  },
  {
    key: 'bootcamp-detail',
    label: '부트캠프 상세',
    address: 'ogonggo.co.kr/bootcamps/3305',
    src: '/biz/bootcamp-detail.webp',
    width: 1280,
    height: 1800,
  },
] as const;
