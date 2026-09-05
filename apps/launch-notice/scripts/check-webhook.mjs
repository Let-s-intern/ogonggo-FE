/**
 * 앱스 스크립트 배포가 제대로 됐는지 확인한다. 폼을 열기 전에 이걸 먼저 돌린다.
 *
 *   pnpm --filter launch-notice check-sheet
 *
 * 지난 두 번의 실패가 전부 "어디서 틀렸는지 안 보인다" 였다. 앱스 스크립트는 설정이 어긋나면
 * JSON 대신 HTML 로그인 페이지나 오류 페이지를 200 으로 돌려주기 때문에, 그냥 호출해서는
 * 성공과 실패가 구분되지 않는다. 여기서 응답의 모양까지 보고 무엇이 잘못됐는지 말해 준다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** `.env` / `.env.local` 을 읽는다. Next 없이 도는 스크립트라 직접 읽는다. */
function readEnv() {
  const env = {};
  for (const name of ['.env', '.env.local']) {
    let text;
    try {
      text = readFileSync(join(here, '..', name), 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (match) env[match[1]] = match[2];
    }
  }
  return env;
}

function verdict(label, ok, detail) {
  console.log(`${ok ? '통과' : '실패'}  ${label}`);
  if (detail) console.log(`      ${detail}`);
  return ok;
}

/** 응답 본문을 보고 무엇이 잘못됐는지 사람 말로 옮긴다. */
function diagnose(text) {
  if (/<title>.*(로그인|Sign in)/is.test(text) || /accounts\.google\.com/.test(text)) {
    return '구글 로그인 페이지가 왔습니다 → 배포의 "액세스 권한"을 "모든 사용자"로 바꾸세요.';
  }
  if (/승인이 필요|Authorization is required|requires authorization/i.test(text)) {
    return '권한 승인이 안 됐습니다 → 편집기에서 setup() 을 한 번 실행하고 승인하세요.';
  }
  if (/Script function not found|doGet/i.test(text)) {
    return 'doGet/doPost 를 못 찾았습니다 → 스크립트를 저장한 뒤 배포를 새로 만드세요.';
  }
  if (/<html/i.test(text)) {
    return 'HTML 오류 페이지가 왔습니다 → 배포를 새로 만들어 보세요(기존 배포 수정이 아니라 "새 배포").';
  }
  return `예상 밖의 응답입니다: ${text.slice(0, 200)}`;
}

async function call(url, init) {
  const response = await fetch(url, { redirect: 'follow', ...init });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    /* JSON 이 아니면 diagnose 가 처리한다 */
  }
  return { status: response.status, text, json };
}

const env = readEnv();
const url = env.LAUNCH_NOTICE_SHEET_WEBHOOK_URL;
const secret = env.LAUNCH_NOTICE_SHEET_SECRET;

console.log('앱스 스크립트 웹앱 점검\n');

if (!url) {
  verdict('LAUNCH_NOTICE_SHEET_WEBHOOK_URL 설정', false, '.env 에 /exec 주소를 넣으세요.');
  process.exit(1);
}
// 배포 주소는 `/exec` 로 끝나야 한다. 편집기가 함께 보여 주는 `/dev` 는 로그인한 본인만
// 열 수 있어 서버에서 부르면 로그인 페이지가 온다 — 헷갈리기 쉬운 자리라 먼저 막는다.
// 호스트는 검사하지 않는다. 이 스크립트 자체를 가짜 서버로 시험할 수 있어야 한다.
if (url.endsWith('/dev')) {
  verdict('주소 모양', false, '/dev 는 본인만 열 수 있습니다. 배포 화면의 /exec 주소를 쓰세요.');
  process.exit(1);
}
if (!url.endsWith('/exec')) {
  verdict('주소 모양', false, '배포 주소는 /exec 로 끝나야 합니다.');
  process.exit(1);
}
verdict('주소 모양', true);
verdict('SHARED_SECRET 설정', Boolean(secret), secret ? undefined : '.env 에 비밀을 넣으세요.');

// 1. 배포가 살아 있는가 (doGet)
const alive = await call(url, { method: 'GET' });
if (!alive.json) {
  verdict('배포 응답', false, diagnose(alive.text));
  process.exit(1);
}
if (!alive.json.ok) {
  verdict('배포 응답', false, `스크립트가 실패를 알렸습니다: ${alive.json.message ?? ''}`);
  process.exit(1);
}
verdict('배포 응답', true, `시트 "${alive.json.sheet}", 지금 ${alive.json.rows}행`);

// 2. 비밀이 실제로 막고 있는가
const denied = await call(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ secret: '틀린-비밀' }),
});
verdict(
  '비밀이 다른 요청 차단',
  denied.json?.ok === false,
  denied.json?.ok === false ? undefined : '아무나 행을 넣을 수 있는 상태입니다.',
);

// 3. 진짜로 행이 들어가는가
const before = alive.json.rows;
const wrote = await call(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    secret,
    submittedAt: new Date().toISOString(),
    mode: '점검용 — 지워도 됩니다',
    company: 'check-webhook.mjs',
  }),
});
if (!wrote.json?.ok) {
  verdict('행 추가', false, wrote.json ? JSON.stringify(wrote.json) : diagnose(wrote.text));
  process.exit(1);
}

const after = await call(url, { method: 'GET' });
verdict(
  '행 추가',
  after.json?.rows === before + 1,
  `${before}행 → ${after.json?.rows}행. 마지막 줄은 점검용이니 시트에서 지우세요.`,
);

console.log('\n전부 통과했습니다. 폼 제출이 시트로 들어갑니다.');
