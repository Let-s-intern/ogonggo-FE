/**
 * 포켓베이스에 신청 컬렉션을 만든다. 없으면 만들고 있으면 필드를 맞춘다.
 *
 *   pnpm --filter launch-notice setup-db
 *
 * `.env` 의 POCKETBASE_URL / POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD 를 읽는다.
 * 새 서버에 배포할 때마다 손으로 컬렉션을 만들면 필드 이름 하나가 어긋나도 조용히 빈 칸이
 * 되므로, 스키마를 코드로 두고 이 명령이 맞춘다.
 *
 * 규칙을 전부 `null` 로 둔다 = 슈퍼유저만 읽고 쓸 수 있다. 이름·이메일·연락처가 들어가는
 * 컬렉션이라 열어 두지 않는다. 신청은 서버(`src/lib/pocketbase.ts`)가, 조회는 어드민 화면이
 * 각각 로그인해서 한다.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const COLLECTION = 'launch_notice_applications';

/** `src/lib/pocketbase.ts` 의 `ApplicationRecord` 와 짝이다. 하나를 바꾸면 둘 다 바꾼다. */
const FIELDS = [
  {
    name: 'id',
    type: 'text',
    primaryKey: true,
    required: true,
    autogeneratePattern: '[a-z0-9]{15}',
  },
  { name: 'mode', type: 'text', required: true },
  { name: 'company', type: 'text', required: true },
  { name: 'name', type: 'text', required: true },
  { name: 'title', type: 'text', required: true },
  { name: 'email', type: 'email', required: true },
  { name: 'phone', type: 'text', required: true },
  { name: 'channel', type: 'text' },
  { name: 'role', type: 'text' },
  { name: 'link', type: 'text' },
  { name: 'survey', type: 'text', max: 5000 },
  { name: 'marketing', type: 'bool' },
  // 최신 포켓베이스는 생성 시각이 자동 필드가 아니다. 명시하지 않으면 `created` 가 비어
  // 있고, 그러면 표도 CSV 도 언제 온 신청인지 알 수 없다.
  { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
];

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

const env = readEnv();
const url = (env.POCKETBASE_URL ?? '').replace(/\/$/, '');
const email = env.POCKETBASE_ADMIN_EMAIL;
const password = env.POCKETBASE_ADMIN_PASSWORD;

if (!url || !email || !password) {
  console.error(
    'POCKETBASE_URL / POCKETBASE_ADMIN_EMAIL / POCKETBASE_ADMIN_PASSWORD 를 .env 에 넣으세요.',
  );
  process.exit(1);
}

const auth = await fetch(`${url}/api/collections/_superusers/auth-with-password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identity: email, password }),
});
if (!auth.ok) {
  console.error(`로그인 실패 (${auth.status}). 주소와 계정을 확인하세요.`);
  process.exit(1);
}
const { token } = await auth.json();
console.log(`로그인 성공  ${url}`);

const existing = await fetch(`${url}/api/collections/${COLLECTION}`, {
  headers: { Authorization: token },
});

const body = {
  name: COLLECTION,
  type: 'base',
  fields: FIELDS,
  listRule: null,
  viewRule: null,
  createRule: null,
  updateRule: null,
  deleteRule: null,
};

let response;
if (existing.ok) {
  const current = await existing.json();
  response = await fetch(`${url}/api/collections/${current.id}`, {
    method: 'PATCH',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log('이미 있어 필드를 맞춥니다.');
} else {
  response = await fetch(`${url}/api/collections`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  console.log('새로 만듭니다.');
}

if (!response.ok) {
  console.error(`실패 (${response.status}): ${(await response.text()).slice(0, 400)}`);
  process.exit(1);
}

const saved = await response.json();
console.log(`완료  ${saved.name}`);
console.log(`필드  ${saved.fields.map((f) => f.name).join(', ')}`);

// 잠겨 있는지 실제로 확인한다. 규칙이 열려 있으면 주소를 아는 누구나 개인정보를 읽는다.
const anonymous = await fetch(`${url}/api/collections/${COLLECTION}/records`);
console.log(
  anonymous.status === 403
    ? '보안  인증 없는 조회가 403 으로 막힙니다.'
    : `경고  인증 없는 조회가 ${anonymous.status} 입니다. 규칙을 확인하세요.`,
);
