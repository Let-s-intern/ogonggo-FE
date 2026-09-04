import { createSign } from 'node:crypto';

/**
 * 구글 시트에 행을 더한다. 앱스 스크립트를 거치지 않고 Sheets API 를 직접 부른다.
 *
 * **API 키로는 안 된다.** 구글 API 키는 "공개된 자원을 인증 없이 읽는" 용도라 쓰기 요청에
 * `401 API keys are not supported by this API` 를 준다(2026-09-04 확인). 행을 더하려면
 * 주체가 있는 자격증명이 필요하고, 사람 없이 서버가 쓰는 경우 그게 서비스 계정이다.
 *
 * 라이브러리를 쓰지 않는다. `googleapis` 는 이 한 가지 호출을 위해 들이기엔 크고, 이 앱은
 * 런칭 뒤 통째로 지운다. 필요한 것은 JWT 하나를 만들어 토큰으로 바꾸고 POST 하는 것뿐이라
 * Node 기본 `crypto` 로 충분하다.
 */

/** 시트를 읽고 쓰는 데 필요한 권한. 더 넓은 것을 요구하지 않는다. */
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

/** 구글이 주는 서비스 계정 JSON 에서 실제로 쓰는 두 값. */
interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * 서비스 계정 JSON 을 환경변수 하나에서 읽는다.
 *
 * 개인 키를 따로 떼어 넣지 않고 JSON 을 통째로 넣게 한 이유가 있다. PEM 은 줄바꿈을 품고
 * 있어서 환경변수로 옮길 때 `\n` 이 깨지는 것이 이 바닥에서 가장 흔한 실패다. JSON 문자열
 * 안에서는 그 줄바꿈이 이미 `\n` 두 글자로 이스케이프돼 있고 `JSON.parse` 가 되돌려 준다 —
 * 사람이 손댈 곳이 없다.
 */
function readServiceAccount(): ServiceAccount | undefined {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    return undefined;
  }

  let parsed: Partial<ServiceAccount>;
  try {
    parsed = JSON.parse(raw) as Partial<ServiceAccount>;
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 을 JSON 으로 읽지 못했습니다.');
  }

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON 에 client_email 또는 private_key 가 없습니다.');
  }

  return { client_email: parsed.client_email, private_key: parsed.private_key };
}

/**
 * 서비스 계정으로 서명한 JWT 를 액세스 토큰으로 바꾼다.
 *
 * 토큰은 한 시간짜리라 캐시할 수 있지만 하지 않는다. 신청이 하루에 몇 건인 화면이라 매번
 * 한 번 더 왕복하는 비용이 캐시를 두고 만료를 관리하는 복잡도보다 싸다.
 */
async function getAccessToken(account: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signer = createSign('RSA-SHA256');
  signer.update(`${header}.${claims}`);
  const signature = base64url(signer.sign(account.private_key));
  const assertion = `${header}.${claims}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const body = (await response.json()) as { access_token?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`토큰 발급 실패 (${response.status}): ${body.error_description ?? ''}`);
  }

  return body.access_token;
}

/** 신청이 쌓일 탭 이름. 기존 데이터가 있는 첫 탭을 건드리지 않으려고 따로 둔다. */
const TAB = '출시알림 신청';

/** 시트의 열 순서. `api/apply/route.ts` 가 만드는 행과 짝이다. */
export const HEADER_LABELS = [
  '신청 시각',
  '유형',
  '회사명',
  '담당자',
  '직함',
  '이메일',
  '연락처',
  '희망 채널',
  '채용 직무',
  '공고 링크',
  '설문 답변',
  '마케팅 수신',
];

async function callSheets(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<Record<string, unknown>> {
  const response = await fetch(`${SHEETS_API}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10_000),
  });

  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const error = body.error as { message?: string } | undefined;
    throw new Error(`Sheets API ${response.status}: ${error?.message ?? ''}`);
  }
  return body;
}

/**
 * 행 하나를 탭 맨 아래에 더한다. 탭이 비어 있으면 머리글을 먼저 깐다.
 *
 * `설정되지 않음` 을 돌려주면 환경변수가 없다는 뜻이다. 호출부가 그것과 진짜 실패를 갈라
 * 다르게 알린다 — 앞은 배포 설정 문제이고 뒤는 구글 쪽 문제다.
 */
export async function appendRow(values: string[]): Promise<'ok' | '설정되지 않음'> {
  const account = readServiceAccount();
  const sheetId = process.env.LAUNCH_NOTICE_SHEET_ID;
  if (!account || !sheetId) {
    return '설정되지 않음';
  }

  const token = await getAccessToken(account);
  const range = encodeURIComponent(`${TAB}!A1`);

  // 비어 있는 탭이면 머리글부터. 매번 한 번 더 읽지만 신청이 드문 화면이라 문제되지 않고,
  // 사람이 머리글을 손으로 맞춰 넣어야 하는 일이 없어진다.
  const existing = (await callSheets(token, `${sheetId}/values/${range}`)) as {
    values?: string[][];
  };
  if (!existing.values || existing.values.length === 0) {
    await callSheets(token, `${sheetId}/values/${range}:append?valueInputOption=RAW`, {
      method: 'POST',
      body: JSON.stringify({ values: [HEADER_LABELS] }),
    });
  }

  await callSheets(
    token,
    `${sheetId}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
    { method: 'POST', body: JSON.stringify({ values: [values] }) },
  );

  return 'ok';
}
