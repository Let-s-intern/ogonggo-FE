import type { ConcernSummaryResponseCategory } from '../../generated/user/models/concernSummaryResponseCategory';
import { MOCK_VIEWER_NICKNAME, MOCK_VIEWER_USER_ID, minutesAgo } from './recruitment-post-comment';

/**
 * 사용자 웹 취준고민(`/api/v1/concerns` 아래 전부) 목 응답의 원본. 제목·닉네임·본문은 전부
 * 지어낸 값이다. 어드민 쪽 목(`./admin-concern.ts`)과는 따로 둔다 — 어드민은 노출 상태·작성자
 * userId 를 내려주고 사용자 API 는 `author`·`mine`·`liked` 를 내려줘서 모양이 다르다.
 *
 * 고민글의 `commentCount`(남은 답변 수) 와 `hasOfficialComment` 는 여기 적지 않는다. 답변
 * 픽스처에서 핸들러가 셈한다(`../concerns.ts`) — 따로 적으면 답변을 지우거나 쓸 때 어긋난다.
 *
 * 화면 분기를 지나가게 짠 것이다.
 *
 * - 고민글 14 건. 카테고리 다섯이 고루(공고 질문 3, 직무·커리어 3, 서류·면접 3, 사이드·경험 3,
 *   기타 2) 있고, 기본 한 페이지(10 건) 를 넘어 2 쪽이 생긴다.
 * - 운영자 답변(`official`) 이 있는 글: id 1, 3, 6, 9. 답변은 있으나 운영자 답변은 없는 글: id 2,
 *   5, 8, 11. 답변이 없는 글: 나머지.
 * - 닉네임이 없는 작성자: id 5 의 글쓴이(305) 와 id 1 의 답글 하나(407). 백엔드는 이 필드를
 *   `null` 로 보낸다(`ConcernAuthorResponse.nickname`).
 * - 최근 7 일(인기 고민 대상) 안의 글 7 건과 그보다 오래된 글 7 건. 인기 고민은 앞쪽에서만 나온다.
 * - 목 사용자(`MOCK_VIEWER_USER_ID`) 가 쓴 글(id 11) 과 답변(id 1 의 답변 5) — 로그인 상태면
 *   수정·삭제가 보인다.
 * - 고민글 1 번이 답변 화면의 모든 분기를 모았다: 운영자 답변, 글쓴이 답변(`concernAuthor`),
 *   삭제된 답변(남은 답글이 있어 자리를 지킨다), 답글 7 개짜리 답변(미리보기 5 개 뒤에 더보기 2 개).
 *
 * `createdAt` 은 백엔드 `LocalDateTime` 처럼 시간대가 없다. 지금으로부터 몇 분 전인지로 만든다.
 */
export type ConcernCategory = ConcernSummaryResponseCategory;

export interface ConcernFixture {
  id: number;
  category: ConcernCategory;
  title: string;
  content: string;
  userId: number;
  /** 없으면 프로필이 없는 작성자다. */
  nickname?: string;
  profileImageUrl?: string;
  createdAt: string;
  /** 수정한 적 없으면 `createdAt` 과 같다. */
  updatedAt?: string;
  viewCount: number;
  /** 삭제 시각. 있으면 삭제된 글이다. */
  deletedAt?: string;
}

export interface ConcernCommentFixture {
  id: number;
  concernId: number;
  /** 있으면 답글이다. 답글에는 다시 답글을 달 수 없다. */
  parentId?: number;
  userId: number;
  nickname?: string;
  profileImageUrl?: string;
  /** 관리자가 쓴 운영자 답변. */
  official?: boolean;
  content: string;
  createdAt: string;
  /** 삭제 시각. 있으면 삭제된 댓글이다. 본문은 응답에서 `삭제된 댓글입니다` 로 바뀐다. */
  deletedAt?: string;
  /** 도움돼요 수. 목 사용자의 몫을 포함한다. */
  likeCount: number;
  /** 목 사용자가 도움돼요를 눌렀는지. */
  liked?: boolean;
}

const HOUR = 60;
const DAY = 24 * HOUR;

/** 작성자 userId 별 닉네임. 같은 사람이 여러 글·답변에 같은 이름으로 나온다. */
const NICKNAMES: Record<number, string | undefined> = {
  301: '부끄러운 라이언',
  302: '마케터지망',
  303: '서류광탈',
  304: '주말코더',
  305: undefined,
  306: '공고탐색중',
  307: '비전공개발자',
  308: '면접울렁증',
  309: '팀플러',
  310: '연봉협상초보',
  311: '졸업유예중',
  312: '첫면접',
  313: '해커톤참가',
  401: '기필코 합격',
  402: '오픈채팅러',
  403: '인사담당출신',
  404: '취준선배',
  405: '밤샘자소서',
  407: undefined,
  900: '렛츠커리어 오공고',
  [MOCK_VIEWER_USER_ID]: MOCK_VIEWER_NICKNAME,
};

const concern = (
  id: number,
  category: ConcernCategory,
  userId: number,
  ago: number,
  viewCount: number,
  title: string,
  content: string,
): ConcernFixture => ({
  id,
  category,
  title,
  content,
  userId,
  nickname: NICKNAMES[userId],
  createdAt: minutesAgo(ago),
  viewCount,
});

export const CONCERN_FIXTURES: ConcernFixture[] = [
  concern(
    1,
    'JOB_POSTING',
    301,
    3 * DAY,
    5310,
    '콘텐츠 마케터 공고는 많은데 어떤 공고가 좋은지 모르겠어요',
    '요즘 콘텐츠 마케터 공고가 정말 많은데, 어떤 기준으로 골라야 할지 모르겠어요.\n혹시 추천하시는 콘텐츠 마케터 공고가 있나요?',
  ),
  concern(
    2,
    'CAREER',
    302,
    2 * DAY,
    2870,
    '마케팅 직무로 가고 싶은데 데이터 분석 공부를 먼저 해야 할까요?',
    '퍼포먼스 마케팅 공고를 보면 SQL 이나 GA 경험을 자주 요구합니다.\n비전공자인데 자격증부터 준비할지, 작은 프로젝트로 경험을 만들지 고민입니다.',
  ),
  concern(
    3,
    'APPLICATION_INTERVIEW',
    303,
    5 * DAY,
    1530,
    '자소서 "입사 후 포부" 항목은 어디까지 구체적으로 써야 하나요?',
    '회사 사업을 잘 모르는 상태에서 포부를 쓰려니 막연한 말만 나옵니다.\n' +
      '어느 정도까지 조사해서 써야 하는지 기준이 있을까요?\n\n' +
      '지금은 채용 공고의 우대사항과 회사 홈페이지의 사업 소개를 읽고, 제가 해본 일 중에서 그 사업과 이어지는 것을 두세 가지 골라 포부 첫 문단에 적고 있어요. ' +
      '그런데 이렇게 쓰면 지원하는 곳마다 문장만 바꾼 것처럼 보일까 봐 걱정이 됩니다. ' +
      '면접관이 보기에 회사를 정말 조사한 사람의 글과 검색해서 베낀 글은 어디서 갈리는지, 실제로 서류를 보신 분들의 이야기가 궁금합니다.',
  ),
  concern(
    4,
    'SIDE_EXPERIENCE',
    304,
    1 * DAY,
    640,
    '사이드 프로젝트 경험을 이력서에 어떻게 적어야 할지 모르겠어요',
    '팀원 네 명이 3개월 동안 만든 앱이 있는데 출시는 못 했습니다.\n결과가 없는 프로젝트도 이력서에 써도 되는지 궁금합니다.',
  ),
  concern(
    5,
    'ETC',
    305,
    6 * HOUR,
    120,
    '취업 준비하면서 번아웃이 올 때 어떻게 버티세요?',
    '서류에서 계속 떨어지니 지원서를 열기만 해도 숨이 막힙니다. 다들 어떻게 쉬고 다시 시작하시는지 알고 싶어요.',
  ),
  concern(
    6,
    'JOB_POSTING',
    306,
    4 * DAY,
    980,
    '공고에 "인턴 후 전환 검토"라고 적혀 있으면 전환율이 낮은 편인가요?',
    '지원하려는 공고에 인턴 3개월 후 정규직 전환 검토라고 적혀 있습니다.\n전환형 인턴과 체험형 인턴의 차이를 공고만 보고 구분할 수 있는지 궁금합니다.',
  ),
  concern(
    7,
    'CAREER',
    307,
    12 * DAY,
    1210,
    '중소기업 2년 다니고 대기업 신입으로 다시 지원해도 될까요?',
    '경력으로 가기엔 직무가 달라 신입 공채를 보고 있습니다.\n2년 근무 이력이 오히려 감점이 되는지 궁금합니다.',
  ),
  concern(
    8,
    'APPLICATION_INTERVIEW',
    308,
    9 * DAY,
    760,
    '1차 면접 뒤에 감사 메일을 보내는 게 도움이 되나요?',
    '면접관 메일 주소를 받았는데 감사 메일을 보내도 실례가 아닐지 고민입니다.',
  ),
  concern(
    9,
    'SIDE_EXPERIENCE',
    309,
    20 * DAY,
    430,
    '팀 프로젝트 경험을 직무 경험으로 인정받을 수 있나요?',
    '학교 팀 프로젝트에서 기획과 발표를 맡았습니다. 인턴이나 실무 경험이 없는데 이것을 직무 경험 칸에 적어도 될까요?',
  ),
  concern(
    10,
    'JOB_POSTING',
    310,
    15 * DAY,
    310,
    '공고에 연봉이 "회사 내규에 따름"이라고만 적혀 있는데 면접에서 연봉을 먼저 물어봐도 되는지, 물어본다면 언제 어떻게 말을 꺼내는 게 좋은지 궁금합니다',
    '제목이 길어서 목록에서 두 줄로 잘리는지 확인하려고 만든 글입니다. 실제 질문은 연봉을 언제 물어보면 좋은가입니다.',
  ),
  concern(
    11,
    'CAREER',
    MOCK_VIEWER_USER_ID,
    3 * HOUR,
    18,
    '데이터 직무 신입 포트폴리오에는 어떤 프로젝트를 넣는 게 좋을까요?',
    '목 모드에서 내가 쓴 고민글입니다. 로그인 상태에서 상세를 열면 수정·삭제가 보여야 합니다.',
  ),
  concern(
    12,
    'ETC',
    311,
    25 * DAY,
    220,
    '졸업 유예 중인데 지원 자격에 문제가 없을까요?',
    '재학 중이 아니라 졸업 유예 상태입니다. 공고의 지원 자격이 졸업 예정자 이상으로 되어 있는데 해당이 되는지 모르겠어요.',
  ),
  concern(
    13,
    'APPLICATION_INTERVIEW',
    312,
    30 * DAY,
    500,
    '직무 면접에서 모르는 질문이 나오면 어떻게 대답하세요?',
    '지난 면접에서 아는 내용이 아니어서 한참 말을 못 했습니다. 모르는 질문에 대처하는 방법이 있을까요?',
  ),
  concern(
    14,
    'SIDE_EXPERIENCE',
    313,
    40 * DAY,
    150,
    '해커톤 수상 경력이 취업에 도움이 될까요?',
    '주말 해커톤에서 장려상을 받았습니다. 이력서에 쓸 만한 경력인지 궁금합니다.',
  ),
];

const comment = (
  fields: Omit<ConcernCommentFixture, 'nickname' | 'likeCount'> & { likeCount?: number },
): ConcernCommentFixture => ({
  ...fields,
  nickname: NICKNAMES[fields.userId],
  likeCount: fields.likeCount ?? 0,
});

/** `root`/`reply` 는 `ago`(분 전) 와 도움돼요 수만 받는 줄임이다. 닉네임은 `NICKNAMES` 에서 찾는다. */
const root = (
  id: number,
  concernId: number,
  userId: number,
  ago: number,
  content: string,
  extra: Partial<ConcernCommentFixture> = {},
): ConcernCommentFixture =>
  comment({ id, concernId, userId, content, createdAt: minutesAgo(ago), ...extra });

const reply = (
  id: number,
  concernId: number,
  parentId: number,
  userId: number,
  ago: number,
  content: string,
  extra: Partial<ConcernCommentFixture> = {},
): ConcernCommentFixture =>
  comment({ id, concernId, parentId, userId, content, createdAt: minutesAgo(ago), ...extra });

export const CONCERN_COMMENT_FIXTURES: ConcernCommentFixture[] = [
  // 고민글 1: 모든 답변 분기. 글쓴이는 301.
  root(
    1,
    1,
    900,
    54 * HOUR,
    '지난번 질문 주셨던 콘텐츠 마케터 추천 공고 정리해왔어요.\n카드뉴스보다는 "글"에 자신 있다면 토스 Content Marketer, 브랜드 SNS 운영을 해보고 싶다면 딜로이트 디지털 홍보 신입을 추천해요.',
    { official: true, likeCount: 23, liked: true },
  ),
  root(
    2,
    1,
    401,
    50 * HOUR,
    '저는 공고에 "직접 운영한 채널" 우대 문구 있는 곳 위주로 지원했어요. 개인 계정 운영 경험만 있어도 서류 붙는 경우 많더라구요!',
    { likeCount: 23 },
  ),
  reply(101, 1, 2, 301, 48 * HOUR, '오 팔로워 수가 적어도 괜찮았나요?', { likeCount: 1 }),
  reply(
    102,
    1,
    2,
    401,
    47 * HOUR,
    '네! 숫자보다 "왜 이렇게 운영했는지" 설명할 수 있는 게 더 중요했어요.',
    { likeCount: 2 },
  ),
  reply(103, 1, 2, 303, 45 * HOUR, '저도 비슷했는데 포트폴리오에 채널 성과를 캡처로 넣었어요.'),
  reply(104, 1, 2, 402, 40 * HOUR, '채널 운영 기간은 어느 정도부터 인정받나요?'),
  reply(105, 1, 2, 301, 36 * HOUR, '감사합니다. 포트폴리오에 채널 운영 기록을 정리해볼게요!', {
    likeCount: 1,
  }),
  reply(106, 1, 2, 407, 30 * HOUR, '혹시 인스타 말고 블로그 운영도 인정되나요?'),
  reply(
    107,
    1,
    2,
    401,
    24 * HOUR,
    '블로그도 충분히 인정돼요. 글 주제가 지원 직무와 이어지면 더 좋아요.',
    { likeCount: 3 },
  ),
  root(4, 1, 403, 40 * HOUR, '삭제된 답변의 원래 내용입니다. 응답에서는 보이지 않습니다.', {
    deletedAt: minutesAgo(30 * HOUR),
  }),
  reply(
    201,
    1,
    4,
    404,
    38 * HOUR,
    '삭제된 답변에 먼저 달려 있던 답글입니다. 부모가 지워져도 남습니다.',
    { likeCount: 1 },
  ),
  root(3, 1, 301, 20 * HOUR, '답변 감사합니다. 정리해주신 공고 중에서 두 곳 지원해볼게요!', {
    likeCount: 4,
  }),
  root(
    5,
    1,
    MOCK_VIEWER_USER_ID,
    5 * HOUR,
    '목 모드에서 내가 쓴 답변입니다. 로그인 상태면 삭제가 보여야 합니다.',
  ),

  // 고민글 2: 운영자 답변 없이 답변 셋.
  root(
    6,
    2,
    404,
    40 * HOUR,
    '자격증보다 작은 프로젝트를 추천해요. 공공데이터로 지표 하나를 정해 분석해보면 면접에서 말할 거리가 생깁니다.',
    { likeCount: 12 },
  ),
  root(
    7,
    2,
    405,
    30 * HOUR,
    '저는 SQLD 를 먼저 땄는데 서류에서 크게 보지 않더라고요. 실제로 쿼리를 짜본 경험이 더 도움이 됐어요.',
    { likeCount: 5 },
  ),
  root(8, 2, 302, 20 * HOUR, '두 분 답변 감사합니다. 작은 프로젝트부터 시작해볼게요.', {
    likeCount: 2,
  }),

  // 고민글 3: 운영자 답변 하나와 일반 답변 하나.
  root(
    9,
    3,
    900,
    100 * HOUR,
    '포부는 "회사가 풀려는 문제"와 "내가 해본 일"이 만나는 지점을 한 문장으로 쓰는 것에서 시작해요.\n사업 보고서보다 채용 공고의 담당 업무와 최근 보도자료를 먼저 읽어보세요.',
    { official: true, likeCount: 31 },
  ),
  root(
    10,
    3,
    403,
    90 * HOUR,
    '인사 쪽에서 보면 회사 이름만 바꿔도 되는 포부는 바로 알아봅니다. 숫자 하나라도 그 회사 이야기가 들어가야 해요.',
    { likeCount: 14 },
  ),

  // 고민글 5: 닉네임 없는 글쓴이. 답변 둘.
  root(
    11,
    5,
    404,
    5 * HOUR,
    '일주일에 하루는 지원서를 열지 않는 날로 정했어요. 그날은 아무것도 안 해도 죄책감 갖지 않기로 했습니다.',
    { likeCount: 6 },
  ),
  root(12, 5, 305, 3 * HOUR, '다들 비슷하군요. 저도 하루 쉬는 날을 만들어볼게요.'),

  // 고민글 6: 운영자 답변 하나와 일반 답변 하나.
  root(
    13,
    6,
    900,
    80 * HOUR,
    '공고에 "검토"라고만 적혀 있으면 전환 기준이 정해져 있지 않다는 뜻이에요. 면접에서 지난 인턴의 전환 인원을 직접 물어보세요.',
    { official: true, likeCount: 9 },
  ),
  root(14, 6, 306, 70 * HOUR, '답변 감사합니다. 면접 때 꼭 물어볼게요.'),

  // 고민글 8: 답변 둘.
  root(
    15,
    8,
    403,
    8 * DAY,
    '감사 메일은 보내도 손해는 없어요. 다만 길게 쓰지 말고 면접에서 나온 이야기 하나만 짚어주세요.',
    { likeCount: 7 },
  ),
  root(16, 8, 308, 7 * DAY, '조언 감사합니다. 짧게 보내봤어요!'),

  // 고민글 9: 운영자 답변 하나.
  root(
    17,
    9,
    900,
    19 * DAY,
    '팀 프로젝트도 맡은 역할과 결과를 숫자로 적으면 직무 경험으로 충분히 인정돼요. "무엇을 했는가"보다 "무엇이 달라졌는가"를 쓰세요.',
    { official: true, likeCount: 18 },
  ),

  // 고민글 11: 목 사용자의 글. 답변 하나.
  root(
    18,
    11,
    404,
    2 * HOUR,
    '분석 과정이 보이는 프로젝트 하나가 결과물이 여러 개인 것보다 낫습니다. 문제 정의부터 한 장으로 정리해보세요.',
    { likeCount: 2 },
  ),
];
