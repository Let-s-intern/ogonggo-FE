/**
 * 기업서비스 랜딩의 문구와 수치. 시안 `.claude/tasks/memos/광고-시스템-시안/오늘의공고 기업서비스.html` 의 내부 스크립트
 * (`heroStats`, `whys`, `LC`, `PKGS`, `cases`, `steps`, `faqs`)에서 그대로 옮겼다.
 *
 * 수치는 시안에 "2026년 9월 기준"으로 적힌 값이다. 게시 전 영업 확인이 필요하다(PRD `기업서비스 랜딩`,
 * `.claude/tasks/memos/결정-광고시스템-business-랜딩-2026-11-03.md`). 바뀌면 이 파일만 고친다.
 */

export const STATS_BASIS = '수치는 2026년 9월 기준';

export const HERO_STATS: readonly { value: string; label: string }[] = [
  { value: '월 10만명+', label: '렛츠커리어 · 오늘의공고 채널 총합' },
  { value: '6.7만명+', label: '인스타그램 팔로워' },
  { value: '10,000명+', label: '카카오톡 오픈채팅 참여자' },
  { value: '24시간', label: '세일즈 매니저 연락' },
  { value: '48시간', label: '소재 제작 → 집행' },
];

export const REASONS: readonly { title: string; description: string }[] = [
  {
    title: '지원 중인 취준생 중심 유저풀',
    description:
      '렛츠커리어가 취업 준비부터 실제 지원 단계까지 함께해요. 높은 지원 의사와 완성된 서류를 갖춘 타겟에게 바로 닿아요.',
  },
  {
    title: "광고가 아닌 '추천하는' 채널",
    description:
      '취업 교육부터 공고 큐레이션까지 쌓아온 신뢰로, 광고 콘텐츠도 팔로워의 97%가 보는 반응을 만들어요.',
  },
  {
    title: '소재 제작까지 48시간',
    description:
      '공고 링크만 있으면 카드뉴스·카카오톡 소재·오공고 해석 한 줄까지 직접 만들어 빠르게 집행해요.',
  },
];
