/**
 * `GET/POST /api/v1/recruitment-posts/{postId}/comments` 와 그 아래 대댓글·삭제·신고 목 응답의
 * 원본. 닉네임과 본문은 전부 지어낸 값이다.
 *
 * 댓글은 모집글 id 6(`./recruitment-post.ts`, 작성자 userId 106) 에만 있다. 화면 분기를 지나가게
 * 짠 것이다.
 *
 * - 부모 댓글 12 건 — 한 페이지(10 건) 를 넘어 `댓글 더보기` 가 보인다.
 * - 대댓글 7 건짜리 부모(id 1) — 미리보기 5 건 뒤에 `답글 2개 더보기` 가 보인다. 그중 하나는
 *   모집글 작성자가 써서 `작성자` 배지가 붙는다.
 * - 삭제된 부모(id 2) 와 살아 있는 대댓글 2 건 — 부모 자리에 `삭제된 댓글입니다` 가 남는다(LC-3309).
 * - 닉네임 없는 작성자(id 5).
 * - 목 사용자(`MOCK_VIEWER_USER_ID`) 가 쓴 댓글(id 3) — 로그인 상태면 `삭제` 가 보인다.
 *
 * 살아 있는 댓글이 부모 11 + 대댓글 9 = 20 건이라 모집글 id 6 의 `commentCount` 를 20 으로 맞췄다.
 * 백엔드처럼 삭제된 부모는 세지 않는다.
 *
 * `createdAt` 은 백엔드처럼 시간대 없는 `LocalDateTime` 모양이다. 지금으로부터 몇 분 전인지로
 * 만들어 `N분 전`·`N시간 전`·`N일 전` 이 모두 보이게 한다.
 */
export interface RecruitmentPostCommentFixture {
  id: number;
  postId: number;
  parentId?: number;
  userId: number;
  nickname?: string;
  profileImageUrl?: string;
  content: string;
  createdAt: string;
  /** 삭제 시각. 있으면 삭제된 댓글이다. */
  deletedAt?: string;
}

/**
 * 목 모드에서 "나" 로 칠 사용자. 목 핸들러는 토큰을 검사하지 않으므로 `Authorization` 헤더가
 * 실려 오면 이 사람이 보낸 것으로 본다.
 */
export const MOCK_VIEWER_USER_ID = 9001;
export const MOCK_VIEWER_NICKNAME = '목데이터나';

/** 지금으로부터 `minutes` 분 전의 로컬 `LocalDateTime` 문자열. */
export const minutesAgo = (minutes: number): string => {
  const date = new Date(Date.now() - minutes * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const HOUR = 60;
const DAY = 24 * HOUR;

const root = (
  id: number,
  userId: number,
  nickname: string | undefined,
  content: string,
  ago: number,
): RecruitmentPostCommentFixture => ({
  id,
  postId: 6,
  userId,
  nickname,
  content,
  createdAt: minutesAgo(ago),
});

const reply = (
  id: number,
  parentId: number,
  userId: number,
  nickname: string,
  content: string,
  ago: number,
): RecruitmentPostCommentFixture => ({ ...root(id, userId, nickname, content, ago), parentId });

export const RECRUITMENT_POST_COMMENT_FIXTURES: RecruitmentPostCommentFixture[] = [
  root(1, 201, '프론트초보', '혹시 디자인 직무도 참여 가능할까요?', 3 * DAY),
  reply(101, 1, 106, '사이드메이커', '네, 환영이에요! 신청 눌러주세요 :)', 3 * DAY - 30),
  reply(102, 1, 202, '리액트러버', '저도 궁금했는데 감사합니다.', 3 * DAY - 60),
  reply(103, 1, 201, '프론트초보', '바로 신청했어요!', 2 * DAY),
  reply(104, 1, 203, '타입스크립터', '디자이너분 오시면 좋겠네요.', 2 * DAY - 10),
  reply(105, 1, 106, '사이드메이커', '첫 모임 전에 공지 한 번 더 드릴게요.', DAY + 3 * HOUR),
  reply(106, 1, 204, '밤공부', '모임 시간은 고정인가요?', DAY),
  reply(107, 1, 106, '사이드메이커', '수요일 밤 9시로 고정입니다.', 20 * HOUR),
  {
    ...root(2, 205, '지운사람', '이 댓글은 지워졌습니다', 2 * DAY + 5 * HOUR),
    deletedAt: minutesAgo(DAY),
  },
  reply(201, 2, 206, '남은답글', '지워지기 전에 단 답글입니다.', 2 * DAY + 4 * HOUR),
  reply(202, 2, 207, '또남은답글', '부모가 지워져도 저는 남아요.', 2 * DAY + 3 * HOUR),
  root(3, MOCK_VIEWER_USER_ID, MOCK_VIEWER_NICKNAME, '목 모드에서 내가 쓴 댓글입니다.', 30 * HOUR),
  root(4, 208, '주말개발자', '방금 신청했어요! 잘 부탁드립니다', 10 * HOUR),
  root(5, 209, undefined, '닉네임이 없는 작성자의 댓글입니다.', 9 * HOUR),
  root(6, 210, '코드리뷰어', '예제 앱은 개인 저장소에 올리나요?', 8 * HOUR),
  root(7, 211, '문서덕후', '버전 차이 정리 노트가 기대돼요.\n두 줄로 쓴 댓글입니다.', 6 * HOUR),
  root(8, 212, '신입준비생', '비전공자도 따라갈 수 있을까요?', 5 * HOUR),
  root(9, 213, '라우터장인', 'App Router 위주인가요?', 3 * HOUR),
  root(10, 214, '캐시연구소', '캐시 파트가 제일 궁금합니다.', 2 * HOUR),
  root(11, 215, '서버컴포넌트', '신청 완료했습니다.', 40),
  root(12, 216, '막차탑승', '아직 자리 남았나요?', 5),
];
