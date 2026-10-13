import type {
  AdminConcernDetailResponse,
  AdminConcernImageResponse,
} from '../../generated/admin/models';

/**
 * 어드민 취준고민 고민글 목(`GET /api/v1/admin/concerns`, `GET /api/v1/admin/concerns/{concernId}`).
 *
 * 제목·닉네임·본문은 지어낸 값이다. 운영 데이터가 아직 0 건이라 옮겨 올 실데이터가 없다.
 *
 * 화면 분기를 지나가는 건: 숨긴 글(id 4, 9), 프로필 없는 작성자(id 6), 공식 답변 있음(id 1, 3, 8),
 * 답변 0 건(id 5, 11), 수정된 글(id 2), 사진 있음(id 1 은 3장, id 4 는 1장).
 *
 * 본문은 Lexical EditorState JSON 문자열이다(취준고민 작성 API 가 JSON 만 받는다, BE #90). 서식이
 * 그려지는지 보려고 id 1 에 굵게·목록·링크를, id 7 에 번호 목록을 둔다. id 3 만 일반 텍스트다 —
 * 운영에 JSON 전환 전에 저장된 일반 텍스트 글(id 3)이 남아 있어, 상세가 그 글을 견디는지 본다.
 *
 * 사진 주소는 운영 웹의 `/hero/` 이미지다(`apps/web/public/hero/`). 어드민은 다른 주소에서 떠서 상대 경로로는 못 읽는다.
 */

const heroImage = (id: string, name: string): AdminConcernImageResponse => ({
  id,
  url: `https://www.ogonggo.co.kr/hero/${name}.png`,
});

/** 오늘 기준 상대 일수의 시각. `HH:mm` 을 받아 그날 그 시각으로 둔다. */
const daysAgo = (days: number, time: string): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const [hours, minutes] = time.split(':').map(Number);
  date.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return date.toISOString();
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

const list = (listType: 'bullet' | 'number', items: string[]) =>
  element(
    'list',
    items.map((item, index) => element('listitem', [text(item)], { value: index + 1 })),
    { listType, start: 1, tag: listType === 'bullet' ? 'ul' : 'ol' },
  );

/** 노드들을 EditorState JSON 문자열로. 작성 API 가 보내는 모양이다. */
const lexical = (...children: SerializedNode[]): string =>
  JSON.stringify({
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children,
    },
  });

/** 서식 없는 문단들. 한 줄이 문단 하나다. */
const plain = (...lines: string[]): string =>
  lexical(...lines.map((line) => paragraph(text(line))));

const concern = (
  fields: Omit<AdminConcernDetailResponse, 'updatedAt' | 'images'> & {
    updatedAt?: string;
    images?: AdminConcernImageResponse[];
  },
): AdminConcernDetailResponse => ({
  ...fields,
  updatedAt: fields.updatedAt ?? fields.registeredAt,
  images: fields.images ?? [],
});

export const ADMIN_CONCERN_FIXTURES: AdminConcernDetailResponse[] = [
  concern({
    id: 1,
    category: 'JOB_POSTING',
    title: '공고에 "인턴 후 전환 검토"라고 적혀 있으면 전환율이 낮은 편인가요?',
    content: lexical(
      paragraph(
        text('지원하려는 공고에 '),
        text('인턴 3개월 후 정규직 전환 검토', 1),
        text('라고 적혀 있습니다.'),
      ),
      paragraph(text('공고에서 확인한 내용은 이렇습니다.')),
      list('bullet', [
        '근무 기간 3개월, 연장 없음',
        '전환 조건은 면접 후 결정',
        '전환 인원은 적혀 있지 않음',
      ]),
      paragraph(
        text('전환형 인턴과 체험형 인턴의 차이를 '),
        element('link', [text('공고')], {
          url: 'https://example.com/jobs/1',
          rel: 'noreferrer',
          target: null,
          title: null,
        }),
        text('만 보고 구분할 수 있는지 궁금합니다.'),
      ),
    ),
    viewCount: 412,
    commentCount: 6,
    hasOfficialComment: true,
    visibility: 'VISIBLE',
    authorUserId: 201,
    authorNickname: '취준1년차',
    registeredAt: daysAgo(1, '09:20'),
    images: [
      heroImage('admin-concern-1-image-1', 'concerns'),
      heroImage('admin-concern-1-image-2', 'jobs'),
      heroImage('admin-concern-1-image-3', 'side-studies'),
    ],
  }),
  concern({
    id: 2,
    category: 'CAREER',
    title: '마케팅 직무로 가고 싶은데 데이터 분석 공부를 먼저 해야 할까요?',
    content: plain(
      '퍼포먼스 마케팅 공고를 보면 SQL 이나 GA 경험을 자주 요구합니다.',
      '비전공자인데 자격증부터 준비할지, 작은 프로젝트로 경험을 만들지 고민입니다.',
    ),
    viewCount: 287,
    commentCount: 4,
    hasOfficialComment: false,
    visibility: 'VISIBLE',
    authorUserId: 202,
    authorNickname: '마케터지망',
    registeredAt: daysAgo(2, '21:05'),
    updatedAt: daysAgo(1, '08:40'),
  }),
  concern({
    id: 3,
    category: 'APPLICATION_INTERVIEW',
    title: '자소서 "입사 후 포부" 항목은 어디까지 구체적으로 써야 하나요?',
    // JSON 전환 전에 저장된 일반 텍스트 글. 줄바꿈이 문단으로 살아야 한다.
    content:
      '회사 사업을 잘 모르는 상태에서 포부를 쓰려니 막연한 말만 나옵니다.\n' +
      '어느 정도까지 조사해서 써야 하는지 기준이 있을까요?',
    viewCount: 530,
    commentCount: 9,
    hasOfficialComment: true,
    visibility: 'VISIBLE',
    authorUserId: 203,
    authorNickname: '서류광탈',
    registeredAt: daysAgo(3, '13:10'),
  }),
  concern({
    id: 4,
    category: 'ETC',
    title: '스터디 같이 하실 분 오픈채팅 링크 남깁니다',
    content: plain('취준 스터디원 구해요. 오픈채팅 주소는 프로필에 있습니다.'),
    viewCount: 38,
    commentCount: 1,
    hasOfficialComment: false,
    visibility: 'HIDDEN',
    authorUserId: 204,
    authorNickname: '스터디장',
    registeredAt: daysAgo(3, '23:45'),
    images: [heroImage('admin-concern-4-image-1', 'concerns')],
  }),
  concern({
    id: 5,
    category: 'SIDE_EXPERIENCE',
    title: '사이드 프로젝트 경험을 이력서에 어떻게 적어야 할지 모르겠어요',
    content: plain(
      '팀원 네 명이 3개월 동안 만든 앱이 있는데 출시는 못 했습니다.',
      '결과가 없는 프로젝트도 이력서에 써도 되는지 궁금합니다.',
    ),
    viewCount: 64,
    commentCount: 0,
    hasOfficialComment: false,
    visibility: 'VISIBLE',
    authorUserId: 205,
    authorNickname: '주말코더',
    registeredAt: daysAgo(4, '10:30'),
  }),
  concern({
    id: 6,
    category: 'APPLICATION_INTERVIEW',
    title: '1차 면접 뒤에 감사 메일을 보내는 게 도움이 되나요?',
    content: plain('면접관 메일 주소를 받았는데 감사 메일을 보내도 실례가 아닐지 고민입니다.'),
    viewCount: 145,
    commentCount: 3,
    hasOfficialComment: false,
    visibility: 'VISIBLE',
    authorUserId: 206,
    registeredAt: daysAgo(5, '16:00'),
  }),
  concern({
    id: 7,
    category: 'CAREER',
    title: '중소기업 2년 다니고 대기업 신입으로 다시 지원해도 될까요?',
    content: lexical(
      paragraph(text('경력으로 가기엔 직무가 달라 신입 공채를 보고 있습니다.')),
      paragraph(text('고민하는 점은 두 가지입니다.')),
      list('number', ['이전 경력을 이력서에 적을지', '면접에서 퇴사 이유를 어떻게 설명할지']),
      paragraph(text('중고신입으로 지원할 때 이전 경력을 어떻게 설명하는 게 좋을까요?', 2)),
    ),
    viewCount: 698,
    commentCount: 12,
    hasOfficialComment: false,
    visibility: 'VISIBLE',
    authorUserId: 207,
    authorNickname: '중고신입',
    registeredAt: daysAgo(6, '19:25'),
  }),
  concern({
    id: 8,
    category: 'JOB_POSTING',
    title: '"우대사항"을 하나도 못 맞추면 지원하지 않는 게 나을까요?',
    content: plain(
      '필수 조건은 맞는데 우대사항은 전부 해당이 없습니다. 그래도 지원해 볼 만할까요?',
    ),
    viewCount: 356,
    commentCount: 7,
    hasOfficialComment: true,
    visibility: 'VISIBLE',
    authorUserId: 208,
    authorNickname: '지원할까말까',
    registeredAt: daysAgo(8, '11:15'),
  }),
  concern({
    id: 9,
    category: 'ETC',
    title: '광고) 자소서 첨삭 저렴하게 해드립니다',
    content: plain('현직자가 자소서를 첨삭해 드립니다. 문의는 쪽지로 주세요.'),
    viewCount: 22,
    commentCount: 0,
    hasOfficialComment: false,
    visibility: 'HIDDEN',
    authorUserId: 209,
    authorNickname: '첨삭전문',
    registeredAt: daysAgo(9, '02:10'),
  }),
  concern({
    id: 10,
    category: 'SIDE_EXPERIENCE',
    title: '공모전 수상 경력이 실제로 서류 통과에 영향이 있나요?',
    content: plain('교내 공모전 장려상이 하나 있는데 이력서 첫 줄에 둘 만한지 모르겠습니다.'),
    viewCount: 119,
    commentCount: 2,
    hasOfficialComment: false,
    visibility: 'VISIBLE',
    authorUserId: 210,
    authorNickname: '공모전러',
    registeredAt: daysAgo(11, '14:40'),
  }),
  concern({
    id: 11,
    category: 'CAREER',
    title: 'PM 직무는 신입 공고가 거의 없는데 어떻게 시작하나요?',
    content: plain(
      '기획 직무 공고는 대부분 경력 3년 이상입니다. 신입은 어디서부터 시작하면 될까요?',
    ),
    viewCount: 47,
    commentCount: 0,
    hasOfficialComment: false,
    visibility: 'VISIBLE',
    authorUserId: 211,
    authorNickname: '기획하고싶다',
    registeredAt: daysAgo(13, '08:05'),
  }),
  concern({
    id: 12,
    category: 'APPLICATION_INTERVIEW',
    title: 'AI 역량검사 결과가 합격에 얼마나 반영되나요?',
    content: plain('역량검사를 망친 것 같은데 서류가 좋으면 만회가 되는지 궁금합니다.'),
    viewCount: 233,
    commentCount: 5,
    hasOfficialComment: false,
    visibility: 'VISIBLE',
    authorUserId: 212,
    authorNickname: '역검무서워',
    registeredAt: daysAgo(15, '20:50'),
  }),
];
