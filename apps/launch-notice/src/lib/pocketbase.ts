/**
 * 신청서를 포켓베이스에 저장한다.
 *
 * 구글 시트를 네 번 시도하고 접었다(2026-09-05 결정). 앱스 스크립트는 웹앱 컨텍스트, 시트 ID,
 * 배포 권한, 접근 권한에서 차례로 막혔고 마지막 것은 회사 Workspace 정책이라 설정으로 뚫을 수
 * 없었다. API 키는 애초에 쓰기가 안 된다. 포켓베이스는 우리가 띄우는 것이라 그런 관문이 없다.
 *
 * SDK 를 쓰지 않는다(`pocketbase` npm 패키지). 필요한 것은 로그인 한 번과 레코드 생성 한
 * 번뿐이고, 이 앱은 런칭 뒤 통째로 지운다.
 */

/** 포켓베이스가 신청을 담는 컬렉션. 어드민 화면도 같은 이름을 본다. */
export const COLLECTION = 'launch_notice_applications';

export interface ApplicationRecord {
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

interface Config {
  url: string;
  email: string;
  password: string;
}

function readConfig(): Config | undefined {
  const url = process.env.POCKETBASE_URL;
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!url || !email || !password) {
    return undefined;
  }
  return { url: url.replace(/\/$/, ''), email, password };
}

/**
 * 슈퍼유저로 로그인해 토큰을 받는다.
 *
 * 컬렉션의 모든 규칙을 `null`(슈퍼유저 전용)로 잠가 두었기 때문에 이 토큰이 필요하다. 규칙을
 * 열어 두면 주소를 아는 누구나 신청을 넣거나 남의 개인정보를 읽을 수 있다 — 이름·이메일·
 * 연락처가 들어가는 컬렉션이라 그렇게 두지 않는다.
 *
 * 토큰은 캐시하지 않는다. 신청이 하루에 몇 건인 화면이라 매번 한 번 더 왕복하는 비용이 만료를
 * 관리하는 복잡도보다 싸다.
 */
async function login(config: Config): Promise<string> {
  const response = await fetch(`${config.url}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: config.email, password: config.password }),
    signal: AbortSignal.timeout(10_000),
  });

  const body = (await response.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!response.ok || !body.token) {
    throw new Error(`포켓베이스 로그인 실패 (${response.status}): ${body.message ?? ''}`);
  }
  return body.token;
}

/**
 * 신청 한 건을 저장한다.
 *
 * `설정되지 않음` 을 돌려주면 환경변수가 없다는 뜻이다. 호출부가 그것과 진짜 실패를 갈라
 * 다르게 알린다 — 앞은 배포 설정 문제이고 뒤는 포켓베이스 쪽 문제다.
 */
export async function saveApplication(record: ApplicationRecord): Promise<'ok' | '설정되지 않음'> {
  const config = readConfig();
  if (!config) {
    return '설정되지 않음';
  }

  const token = await login(config);

  const response = await fetch(`${config.url}/api/collections/${COLLECTION}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify(record),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`포켓베이스 저장 실패 (${response.status}): ${body.slice(0, 300)}`);
  }

  return 'ok';
}
