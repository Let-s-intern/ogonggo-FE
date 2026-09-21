/**
 * **백엔드가 생기면 이 파일을 지우고 API 로 바꾼다.**
 *
 * `지원·신청 내역`(PRD 3 절) 의 탭 셋 중 `채용 공고` 와 `교육 · 부트캠프` 두 탭에 그리는
 * 고정 값이다. 그 둘은 되읽는 API 가 없어서 화면만 있고 데이터가 없다. 클릭은 이미 쌓고 있고
 * (`POST /api/v1/jobs/{jobId}/source-url-clicks`,
 * `POST /api/v1/bootcamps/{bootcampId}/application-url-clicks`) 둘 다 쓰기 전용이다.
 *
 * 필요한 API 는 `.claude/tasks/memos/백엔드-요청-마이페이지.md` 의 1·2 번이다.
 *
 * | 번호 | 필요한 것 |
 * |---|---|
 * | 1 | `GET /api/v1/me/job-applications`, `GET /api/v1/me/bootcamp-applications` — 목록 조회 |
 * | 2 | 그 둘의 "나의 지원·신청 상태" 를 저장하는 `PATCH` |
 *
 * 그것들이 생기면 지울 것은 이 파일 하나다. 값을 화면 여기저기에 흩어 두지 않은 이유가
 * 그것이다 — 나중에 무엇을 지워야 하는지 알 수 있어야 한다.
 *
 * 상태 목록도 여기 있다. 채용공고의 여섯 단계와 부트캠프의 세 단계는 **저장할 곳이 없어서**
 * 목업 문구만 옮긴 것이고, 생성 타입에 대응하는 enum 이 없다. 실제로 있는 네 단계
 * (`PREPARING`·`COMPLETED`·`IN_PROGRESS`·`ENDED`) 는 사이드·스터디 탭만 쓴다.
 */

export type PlaceholderApplicationTab = 'jobs' | 'bootcamps';

export interface PlaceholderApplicationRow {
  key: string;
  /** 제목 위 작은 줄. 회사명 또는 운영사다. */
  caption: string;
  title: string;
  /** 제목 아래 줄. 화면에서 가운뎃점으로 이어진다. */
  meta: string[];
  /** 마감일. 아래 `inDays` 가 만든다. */
  recruitmentEndAt: string;
  /** 상태 셀렉트에 보일 값. 아래 상태 목록의 `value` 중 하나다. */
  applicationStatus: string;
}

/**
 * 오늘로부터 며칠 뒤의 마감 일시(23:59).
 *
 * 고정 날짜를 박지 않는다. 목업의 `2026.00.00(토) 23:59` 은 자리표시자라 옮길 값이 없고,
 * 아무 날짜나 박아 두면 그 날이 지난 뒤로는 세 행이 전부 `마감` 으로 보인다 — 이 화면이
 * 존재하는 이유가 "백엔드가 생겼을 때 어떻게 보일지" 인데 그게 안 보이게 된다.
 * 음수를 주면 이미 지난 날이 되어 `마감` 배지가 그려진다(목업 셋째 행이 그렇다).
 */
function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 0, 0);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T23:59:00`;
}

/**
 * 채용공고의 여섯 단계(목업 `지원 신청내역/채용공고.png` 의 드롭다운). `value` 는 백엔드에
 * 대응하는 enum 이 없어 화면 안에서만 쓰는 이름이다 — 저장되지 않는다.
 */
const JOB_STATUSES = [
  { value: 'PREPARING', label: '지원 준비 중' },
  { value: 'COMPLETED', label: '지원 완료' },
  { value: 'DOCUMENT_PASSED', label: '서류 합격' },
  { value: 'INTERVIEW', label: '면접 진행' },
  { value: 'FINAL_PASSED', label: '최종 합격' },
  { value: 'REJECTED', label: '불합격' },
] as const;

/** 부트캠프의 세 단계(목업 `지원 신청내역/교육 부트캠프.png` 의 드롭다운). 같이 저장되지 않는다. */
const BOOTCAMP_STATUSES = [
  { value: 'NOT_APPLIED', label: '신청 전' },
  { value: 'COMPLETED', label: '신청 완료' },
  { value: 'ENDED', label: '활동 종료' },
] as const;

export const PLACEHOLDER_APPLICATION_STATUSES: Record<
  PlaceholderApplicationTab,
  readonly { value: string; label: string }[]
> = {
  jobs: JOB_STATUSES,
  bootcamps: BOOTCAMP_STATUSES,
};

/** 목업 세 행 그대로다(`지원 신청내역/채용공고.png`, `교육 부트캠프.png`). */
export const PLACEHOLDER_APPLICATIONS: Record<
  PlaceholderApplicationTab,
  readonly PlaceholderApplicationRow[]
> = {
  jobs: [
    {
      key: 'placeholder-job-1',
      caption: '카카오',
      title: '카카오 2026 신입 서비스 기획',
      meta: ['신입', '서비스 기획', '경력 무관'],
      recruitmentEndAt: inDays(3),
      applicationStatus: 'COMPLETED',
    },
    {
      key: 'placeholder-job-2',
      caption: '토스증권',
      title: 'Product Designer Assistant',
      meta: ['신입', 'UX/UI 디자인', '경력 무관'],
      recruitmentEndAt: inDays(3),
      applicationStatus: 'COMPLETED',
    },
    {
      key: 'placeholder-job-3',
      caption: '네이버',
      title: '콘텐츠 마케팅 인턴',
      meta: ['인턴', '마케팅', '경력 무관'],
      recruitmentEndAt: inDays(-7),
      applicationStatus: 'COMPLETED',
    },
  ],
  bootcamps: [
    {
      key: 'placeholder-bootcamp-1',
      caption: '렛츠커리어 X 파트너',
      title: 'iOS 앱 개발',
      meta: ['서비스 기획', '신입'],
      recruitmentEndAt: inDays(3),
      applicationStatus: 'COMPLETED',
    },
    {
      key: 'placeholder-bootcamp-2',
      caption: '렛츠커리어 X 파트너',
      title: 'PM 부트 캠프 교육 과정',
      meta: ['UX/UI 디자인', '경력 무관'],
      recruitmentEndAt: inDays(3),
      applicationStatus: 'COMPLETED',
    },
    {
      key: 'placeholder-bootcamp-3',
      caption: '렛츠커리어 X 파트너',
      title: '생성형 AI & 언리얼 엔진 활용 과정',
      meta: ['마케팅', '경력 무관'],
      recruitmentEndAt: inDays(-7),
      applicationStatus: 'COMPLETED',
    },
  ],
};

/** 탭 옆 건수 배지. 목업의 `채용 공고 3`, `교육 · 부트캠프 3` 이다. */
export const PLACEHOLDER_APPLICATION_COUNTS: Record<PlaceholderApplicationTab, number> = {
  jobs: PLACEHOLDER_APPLICATIONS.jobs.length,
  bootcamps: PLACEHOLDER_APPLICATIONS.bootcamps.length,
};

/**
 * 하드코딩한 탭의 행 위에 두는 안내. 그 탭의 컨트롤이 왜 비활성인지 말한다.
 *
 * 행마다 한 줄씩 반복하지 않고 표 위에 한 줄 둔다. 같은 문장이 행 수만큼 반복되면 표가
 * 읽히지 않고, 목업에도 그 자리에 안내 띠가 있다. 대신 비활성 컨트롤마다 `title` 로 같은
 * 말을 달아 띠를 못 본 사람이 그 자리에서 답을 얻는다.
 */
export const PLACEHOLDER_NOTICE = '준비 중인 기능이에요';

/** 위 안내 한 줄에 이어 붙는 설명. 왜 비활성인지와 무엇이 가짜인지를 말한다. */
export const PLACEHOLDER_NOTICE_DESCRIPTION =
  '지원·신청 내역을 저장하는 기능을 준비하고 있어요. 아래 목록은 예시이고, 상태 변경과 삭제는 아직 되지 않아요.';
