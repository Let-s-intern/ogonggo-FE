import type { UserNoticeDetailResponse } from '../../generated/user/models/userNoticeDetailResponse';

/**
 * `GET /api/v1/notices`, `GET /api/v1/notices/{noticeId}` 목 응답의 원본.
 *
 * 어드민 공지 픽스처(`./admin-notice.ts`) 와 별개다. 그쪽은 백엔드 도메인이 없던 시절의 모양
 * (`publicationStartAt`, `active`) 이고 이쪽은 배포된 사용자 스펙
 * (`UserNoticeDetailResponse`) 그대로다. 사용자 목록에는 노출 중인 공지만 오므로 비노출 건은
 * 여기 없다.
 *
 * **아래 값은 전부 지어낸 것이다.** 2026-09-23 기준 운영 DB 에 공지가 한 건도 없어
 * (`GET /api/v1/notices` → `totalElements: 0`) 화면을 볼 수 있는 데이터가 이것뿐이다.
 *
 * `content` 는 Lexical EditorState JSON 문자열이다 — 생성 모델의 설명과 백엔드
 * `UserNoticeResponses.kt` 가 그렇게 적고 있다. 백엔드는 이 문자열을 검사하지 않고 어드민이
 * 넣은 값을 그대로 돌려주므로, 형식이 어긋난 값이 올 수 있다. id 5 를 일부러 평문으로 두어
 * `shared/ui/LexicalContent` 의 대체 경로(`kind: 'text'`) 도 화면에서 지나가게 한다.
 *
 * `createdAt` 은 백엔드가 `LocalDateTime` 으로 내보내 시간대 표시가 없다. 그 모양을 그대로
 * 흉내 낸다 — 화면이 `Z` 를 기대하고 만들어지면 실제 응답에서 어긋난다.
 */

/** Lexical 직렬화 노드. 필드 이름은 Lexical `exportJSON` 이 내는 모양 그대로다. */
type SerializedNode = Record<string, unknown>;

/** `format` 비트: 1 굵게. Lexical `TextNode` 의 값이다. */
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

const heading = (value: string) => element('heading', [text(value)], { tag: 'h3' });

const listItem = (value: string) => element('listitem', [text(value)], { value: 1 });

const bulletList = (...values: string[]) =>
  element('list', values.map(listItem), { listType: 'bullet', start: 1, tag: 'ul' });

const link = (value: string, url: string) =>
  element('link', [text(value)], { url, rel: null, target: null, title: null });

const editorState = (children: SerializedNode[]): string =>
  JSON.stringify({
    root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children },
  });

/** 오늘 기준 상대 일수의 로컬 일시 `YYYY-MM-DDTHH:mm:ss`. 백엔드 `LocalDateTime` 과 같은 모양이다. */
const daysAgo = (days: number, time = '09:00:00'): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}T${time}`;
};

/**
 * 13 건이다. 한 페이지 10 건(`widgets/notice-list`) 기준으로 2 페이지가 되어 페이지네이션이
 * 눌리는지 화면에서 볼 수 있다.
 *
 * 순서는 백엔드 정렬과 같다 — 고정 먼저, 그 안에서 id 역순
 * (`core/notice/persistence/NoticeRepositories.kt` 의 `pinned.desc(), id.desc()`).
 */
export const USER_NOTICE_FIXTURES: UserNoticeDetailResponse[] = [
  {
    id: 12,
    title: '개인정보 처리방침 개정 안내',
    pinned: true,
    createdAt: daysAgo(3, '10:20:00'),
    content: editorState([
      paragraph(text('2026년 10월 1일부터 개인정보 처리방침이 개정됩니다.')),
      heading('주요 변경 사항'),
      bulletList(
        '보관 기간을 항목별로 나누어 적습니다',
        '위탁 업체 목록을 갱신했습니다',
        '마케팅 수신 동의를 가입과 분리했습니다',
      ),
      paragraph(
        text('자세한 내용은 '),
        link('개정 전문', 'https://www.letscareer.co.kr/'),
        text(' 에서 확인해 주세요.'),
      ),
    ]),
  },
  {
    id: 4,
    title: '오늘의 공고 서비스 이용 안내',
    pinned: true,
    createdAt: daysAgo(60, '11:00:00'),
    content: editorState([
      paragraph(
        text('오늘의 공고는 채용공고·교육·사이드 프로젝트 모집 정보를 한곳에 모아 보여드립니다.'),
      ),
      paragraph(
        text('문의는 ', 1),
        text('official@letscareer.co.kr'),
        text(' 로 보내 주세요. 평일 기준 하루 안에 답변드립니다.'),
      ),
    ]),
  },
  {
    id: 13,
    title: '공고 달력에서 마감일을 한눈에 볼 수 있습니다',
    pinned: false,
    createdAt: daysAgo(1, '14:30:00'),
    content: editorState([
      paragraph(text('상단 메뉴의 공고 달력에서 마감일 기준으로 채용공고를 볼 수 있습니다.')),
      paragraph(text('관심 직무를 고르면 그 직무의 공고만 달력에 표시됩니다.')),
    ]),
  },
  {
    id: 11,
    title: '추석 연휴 고객센터 운영 안내',
    pinned: false,
    createdAt: daysAgo(5, '09:30:00'),
    content: editorState([
      paragraph(text('9월 27일부터 10월 1일까지 문의 답변이 지연될 수 있습니다.')),
    ]),
  },
  {
    id: 10,
    title: '기업 회원 공고 등록 절차가 간단해졌습니다',
    pinned: false,
    createdAt: daysAgo(9),
    content: editorState([
      paragraph(text('공고 등록에 필요한 입력 칸을 열둘에서 여덟으로 줄였습니다.')),
      bulletList('근무 형태와 경력 조건을 한 줄로 합쳤습니다', '복리후생은 선택 항목이 됐습니다'),
    ]),
  },
  {
    id: 9,
    title: '사이드·스터디 모집글 작성 가이드',
    pinned: false,
    createdAt: daysAgo(14),
    content: editorState([
      paragraph(text('모집글은 소개·목표·진행 방식·팀 구성 순으로 적으면 읽기 좋습니다.')),
      paragraph(text('연락처는 오픈채팅 주소나 이메일 중 하나를 꼭 남겨 주세요.')),
    ]),
  },
  {
    id: 8,
    title: '서비스 점검 안내 (9월 12일 새벽)',
    pinned: false,
    createdAt: daysAgo(18),
    content: editorState([
      paragraph(text('9월 12일 새벽 2시부터 4시까지 서비스 점검을 진행합니다.')),
      paragraph(text('점검 중에는 로그인과 공고 조회가 되지 않습니다.')),
    ]),
  },
  {
    id: 7,
    title: '부트캠프 정보가 매주 갱신됩니다',
    pinned: false,
    createdAt: daysAgo(23),
    content: editorState([paragraph(text('매주 월요일 교육·부트캠프 목록을 갱신합니다.'))]),
  },
  {
    id: 6,
    title: '스크랩한 공고를 마이페이지에서 볼 수 있습니다',
    pinned: false,
    createdAt: daysAgo(30),
    content: editorState([
      paragraph(text('마이페이지 스크랩 탭에서 저장한 공고를 모아 볼 수 있습니다.')),
    ]),
  },
  {
    id: 5,
    title: '회원 가입 방식이 렛츠커리어 통합 로그인으로 바뀝니다',
    pinned: false,
    createdAt: daysAgo(35),
    // 일부러 Lexical JSON 이 아닌 평문이다. 위 주석의 대체 경로 확인용이다.
    content:
      '기존 오늘의 공고 계정은 그대로 쓸 수 있습니다.\n새로 가입하시는 분은 렛츠커리어 계정으로 로그인해 주세요.',
  },
  {
    id: 3,
    title: '공고 검색에 직무 필터가 추가됐습니다',
    pinned: false,
    createdAt: daysAgo(44),
    content: editorState([paragraph(text('채용공고 목록에서 직무별로 걸러 볼 수 있습니다.'))]),
  },
  {
    id: 2,
    title: '오늘의 공고 로고가 바뀌었습니다',
    pinned: false,
    createdAt: daysAgo(51),
    content: editorState([paragraph(text('서비스 로고와 앱 아이콘을 새로 바꿨습니다.'))]),
  },
  {
    id: 1,
    title: '오늘의 공고를 열었습니다',
    pinned: false,
    createdAt: daysAgo(70, '08:00:00'),
    content: editorState([
      heading('반갑습니다'),
      paragraph(text('채용·교육·모집 정보를 한곳에서 보는 오늘의 공고를 시작합니다.')),
    ]),
  },
];
