import type { AdminServiceFeedbackResponse } from '../../generated/admin/models';

/**
 * 어드민 서비스 개선 의견 목(`GET /api/v1/admin/service-feedbacks`).
 *
 * 문구와 작성자는 지어낸 값이다. 화면 분기를 지나가는 건: 비로그인 작성(id 2, 5), 만족한 점만(id 3),
 * 아쉬운 점만(id 4), 칸을 넘기는 긴 글(id 1), 닉네임 없는 회원(id 3), 프로필 없는 회원(id 4).
 */

/** 오늘 기준 상대 일수의 시각. `HH:mm` 을 받아 그날 그 시각으로 둔다. */
const daysAgo = (days: number, time: string): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date.toISOString();
};

export const ADMIN_SERVICE_FEEDBACK_FIXTURES: AdminServiceFeedbackResponse[] = [
  {
    id: 1,
    userId: 12,
    userName: '김오공',
    userNickname: '오공이',
    userEmail: 'ogong@example.com',
    satisfaction:
      '채용공고를 직무별로 모아 볼 수 있어서 여러 사이트를 돌아다니지 않아도 됩니다. 마감일이 카드에 바로 보여서 지원 일정을 짜기도 편했어요.',
    improvement:
      '북마크한 공고의 마감 알림을 하루 전에도 받고 싶어요. 지금은 놓치는 공고가 생깁니다. 그리고 필터를 고른 상태가 다른 화면에 다녀오면 풀려서 매번 다시 골라야 합니다.',
    registeredAt: daysAgo(6, '18:30'),
  },
  {
    id: 2,
    satisfaction: '부트캠프 정보를 한눈에 비교할 수 있어 좋아요.',
    improvement: '수강료 기준으로 정렬하는 기능이 있으면 좋겠습니다.',
    registeredAt: daysAgo(4, '09:12'),
  },
  {
    id: 3,
    userId: 31,
    userName: '이취준',
    userEmail: 'chwijun@example.com',
    satisfaction: '취준고민 게시판 답변이 실제로 도움이 됐어요.',
    registeredAt: daysAgo(2, '14:40'),
  },
  {
    id: 4,
    userId: 7,
    improvement: '모바일에서 상세 화면 글씨가 조금 작아요.',
    registeredAt: daysAgo(1, '21:05'),
  },
  {
    id: 5,
    improvement: '로그인 없이도 스크랩할 수 있으면 좋겠어요.',
    registeredAt: daysAgo(0, '10:20'),
  },
];
