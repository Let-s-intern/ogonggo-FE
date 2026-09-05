/**
 * `/admin` 화면이 포켓베이스에서 신청을 읽어 오는 자리.
 *
 * **브라우저에서 직접 부른다.** 신청을 저장하는 쪽(`lib/pocketbase.ts`)과 다르다 — 그쪽은
 * 서버가 슈퍼유저 비밀번호로 로그인하지만, 이쪽은 사람이 화면에서 로그인한다. 서버 환경변수의
 * 비밀번호를 이 화면에 쓰면 `/admin` 주소를 아는 누구나 신청자 전원의 개인정보를 보게 된다.
 */

/** 신청이 담긴 컬렉션. `lib/pocketbase.ts` 와 같은 이름이다. */
const COLLECTION = 'launch_notice_applications';

/**
 * 포켓베이스 주소. 공개돼도 되는 값이다 — 컬렉션이 잠겨 있어(비인증 조회 403) 읽으려면
 * 로그인해야 한다. 그래서 `NEXT_PUBLIC_` 이 붙어 있다.
 */
export const POCKETBASE_URL = (process.env.NEXT_PUBLIC_POCKETBASE_URL ?? '').replace(/\/$/, '');

export interface Application {
  id: string;
  created: string;
  mode: string;
  company: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  channel: string;
  role: string;
  link: string;
  survey: string;
  marketing: boolean;
}

/** 표와 CSV 가 함께 쓰는 열 정의. 순서가 곧 화면과 파일의 열 순서다. */
export const COLUMNS: { key: keyof Application; label: string }[] = [
  { key: 'created', label: '신청 시각' },
  { key: 'mode', label: '유형' },
  { key: 'company', label: '회사명' },
  { key: 'name', label: '담당자' },
  { key: 'title', label: '직함' },
  { key: 'email', label: '이메일' },
  { key: 'phone', label: '연락처' },
  { key: 'channel', label: '희망 채널' },
  { key: 'role', label: '채용 직무' },
  { key: 'link', label: '공고 링크' },
  { key: 'survey', label: '설문 답변' },
  { key: 'marketing', label: '마케팅 수신' },
];

export async function login(email: string, password: string): Promise<string> {
  const response = await fetch(`${POCKETBASE_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  });

  const body = (await response.json().catch(() => ({}))) as { token?: string };
  if (!response.ok || !body.token) {
    throw new Error(
      response.status === 400 ? '이메일 또는 비밀번호가 맞지 않습니다.' : '로그인에 실패했습니다.',
    );
  }
  return body.token;
}

/**
 * 신청을 최신순으로 전부 가져온다.
 *
 * 페이지를 나누지 않는다. 3주짜리 캠페인이라 많아야 수백 건이고, 표를 훑고 CSV 로 내보내는
 * 것이 이 화면이 하는 일 전부다 — 페이지네이션은 그 두 가지를 다 불편하게 만든다.
 */
export async function fetchApplications(token: string): Promise<Application[]> {
  const response = await fetch(
    `${POCKETBASE_URL}/api/collections/${COLLECTION}/records?sort=-created&perPage=500`,
    { headers: { Authorization: token } },
  );

  if (!response.ok) {
    throw new Error(`목록을 불러오지 못했습니다 (${response.status}).`);
  }

  const body = (await response.json()) as { items: Application[] };
  return body.items;
}

/**
 * CSV 한 덩어리로 만든다.
 *
 * 맨 앞에 BOM(`\uFEFF`)을 붙인다. 없으면 엑셀이 UTF-8 로 읽지 않아 한글이 전부 깨진다 —
 * 받는 사람이 엑셀로 열 파일이라 이게 없으면 쓸모가 없다.
 *
 * 따옴표 안에서 따옴표는 두 번 겹쳐 쓴다(RFC 4180). 설문 답변에 줄바꿈과 쉼표가 들어오므로
 * 모든 칸을 따옴표로 감싼다.
 */
export function toCsv(rows: Application[]): string {
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const lines = [
    COLUMNS.map((column) => escape(column.label)).join(','),
    ...rows.map((row) =>
      COLUMNS.map((column) =>
        escape(column.key === 'marketing' ? (row.marketing ? 'Y' : 'N') : row[column.key]),
      ).join(','),
    ),
  ];
  return `\uFEFF${lines.join('\r\n')}`;
}

/** `2026-09-05 03:48:57.703Z` 를 `2026-09-05 12:48` 로. 초와 밀리초는 이 표에서 쓰지 않는다. */
export function formatCreated(value: string): string {
  if (!value) return '';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
