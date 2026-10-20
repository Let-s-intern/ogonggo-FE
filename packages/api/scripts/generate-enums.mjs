/**
 * 백엔드 enum 카탈로그(`GET /api/v1/enums`)를 받아 `src/generated/enums.ts` 로 쓴다.
 *
 *   pnpm --filter @ogonggo/api codegen   (orval 다음에 이 스크립트가 돈다)
 *
 * 앱은 실행 중에 `/enums` 를 부르지 않고 이 스냅숏을 import 한다. 라벨을 동기 함수로 쓰는 곳
 * (URL 파싱, JSON-LD, 서버 컴포넌트)을 그대로 두기 위해서다.
 *
 * 기준 주소는 orval 과 같은 `OGONGGO_USER_API_URL` 에서 끝의 `/v3/api-docs` 를 뗀 것이다.
 * 받지 못하거나 응답이 비어 있으면 0이 아닌 코드로 끝나고 기존 파일은 건드리지 않는다.
 */
import { renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '../src/generated/enums.ts');

const base = (process.env.OGONGGO_USER_API_URL ?? 'http://localhost:8080').replace(
  /\/v3\/api-docs\/?$/,
  '',
);
const url = `${base}/api/v1/enums`;

function fail(message) {
  console.error(`[generate-enums] ${message} (${url})`);
  process.exit(1);
}

let body;
try {
  const res = await fetch(url);
  if (res.status !== 200) fail(`응답 코드가 ${res.status} 다`);
  body = await res.json();
} catch (error) {
  fail(`받지 못했다: ${error instanceof Error ? error.message : String(error)}`);
}

const data = body?.data;
if (data === null || typeof data !== 'object' || Array.isArray(data))
  fail('`data` 가 객체가 아니다');
const names = Object.keys(data);
if (names.length === 0) fail('`data` 가 비어 있다');

/** 작은따옴표 문자열 리터럴. */
const str = (value) =>
  `'${JSON.stringify(String(value)).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;

const lines = [
  '// 생성물. `pnpm --filter @ogonggo/api codegen` 이 `GET /api/v1/enums` 로 다시 만든다. 손으로 고치지 않는다.',
  'export const ENUM_CATALOG = {',
];
for (const name of names) {
  const options = data[name];
  if (!Array.isArray(options)) fail(`\`${name}\` 가 배열이 아니다`);
  lines.push(`  ${name}: [`);
  for (const option of options) {
    const parent = option.parent == null ? 'null' : str(option.parent);
    lines.push(`    { name: ${str(option.name)}, desc: ${str(option.desc)}, parent: ${parent} },`);
  }
  lines.push('  ],');
}
lines.push('} as const;', '');

// 다 만든 뒤 한 번에 바꾼다. 쓰다가 끊겨도 기존 파일이 반쯤 덮이지 않는다.
const tmp = `${OUT}.tmp`;
writeFileSync(tmp, lines.join('\n'));
renameSync(tmp, OUT);
console.log(`[generate-enums] ${names.length}개 enum 을 ${OUT} 에 썼다`);
