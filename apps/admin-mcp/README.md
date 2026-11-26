# admin-mcp

오공고 관리자 API 를 MCP tool 로 여는 서버. claude.ai 맞춤 커넥터와 Claude Code 에서 쓴다. 왜 이렇게 만들었는지는
[`docs/prd/2026-11-26-admin-mcp.md`](../../docs/prd/2026-11-26-admin-mcp.md) 에 있다.

- Hono + `@hono/mcp`(Streamable HTTP, 상태 없음), Vercel Functions 로 올린다.
- OAuth 2.1 인가 서버를 직접 둔다. 클라이언트·코드·토큰이 모두 서명 JWT 라 저장소가 없다.
- 로그인은 렛츠커리어 이메일·비밀번호로 **본인 확인만** 한다. 관리자 API 는 MCP 전용 `ADMIN` 계정(서비스 계정)으로 부른다.
- 1차 tool 은 모두 조회다(`src/tools.ts`).

## 파일

| 파일                | 하는 일                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `src/index.ts`      | Vercel 진입점. `hono` 를 직접 import 해야 Vercel 이 진입점으로 찾는다    |
| `src/routes.ts`     | OAuth 메타데이터, `/register`, `/authorize`, `/token`, `/mcp`            |
| `src/tokens.ts`     | 서명 JWT 발급·검증, PKCE                                                 |
| `src/config.ts`     | 환경 변수, 허용 목록(이메일 → 부서 → tool)                               |
| `src/letscareer.ts` | 렛츠커리어 SSO                                                           |
| `src/ogonggo.ts`    | 서비스 계정 토큰(메모리 캐시, 재발급, 재로그인)과 관리자 API 호출        |
| `src/tools.ts`      | MCP tool 목록. enum 값은 `@ogonggo/api` 생성 타입과 빠짐없이 같은지 확인 |
| `src/login-page.ts` | 로그인 화면(`hono/html`)                                                 |

`src/app.ts` 라는 이름은 쓰지 않는다. Vercel 이 진입점 후보로 `src/index.ts` 보다 먼저 찾는다.
상대 import 는 `./config.js` 처럼 `.js` 를 붙인다. Vercel 은 TS 를 파일 단위로 JS 로 바꾸고 import 경로를 고치지 않아,
확장자가 없으면 Node ESM 이 실행 중에 모듈을 찾지 못한다. 같은 이유로 `.tsx` 파일을 두지 않는다
(`./x.js` 를 `x.tsx` 로 찾지 못해 배포 묶음에서 빠진다).

## 환경 변수

| 이름                                | 필수 | 내용                                                                          |
| ----------------------------------- | ---- | ----------------------------------------------------------------------------- |
| `ADMIN_MCP_JWT_SECRET`              | ✅   | 서명 키, 32자 이상. 바꾸면 모든 연결이 끊긴다(긴급 차단용)                    |
| `ADMIN_MCP_ACCESS`                  | ✅   | 허용 목록 JSON. 아래 예시                                                     |
| `OGONGGO_SERVICE_EMAIL`             | ✅   | 서비스 계정 렛츠커리어 이메일                                                 |
| `OGONGGO_SERVICE_PASSWORD`          | ✅   | 서비스 계정 렛츠커리어 비밀번호                                               |
| `ADMIN_MCP_PUBLIC_ORIGIN`           |      | 공개 주소(예: `https://admin-mcp.ogonggo.co.kr`). 비우면 요청 주소에서 읽는다 |
| `ADMIN_MCP_REDIRECT_URIS`           |      | 쉼표로 나눈 허용 redirect URI. 기본은 claude.ai·claude.com 커넥터 콜백        |
| `ADMIN_MCP_ALLOW_LOOPBACK_REDIRECT` |      | `false` 면 `http://localhost:*` 콜백(Claude Code)을 막는다. 기본 허용         |
| `OGONGGO_USER_API_ORIGIN`           |      | 사용자 API. 기본은 운영 API Gateway                                           |
| `OGONGGO_ADMIN_API_ORIGIN`          |      | 관리자 API. 기본은 운영 API Gateway                                           |
| `LETSCAREER_API_ORIGIN`             |      | 렛츠커리어 API. 기본은 운영                                                   |
| `LETSCAREER_SSO_REDIRECT_URI`       |      | SSO 화이트리스트에 있는 주소. 기본은 관리자 콘솔 콜백                         |

```json
{
  "departments": {
    "운영": ["*"],
    "영업": ["list_advertisement_inquiries", "get_advertisement_inquiry_today_count"]
  },
  "members": {
    "admin@example.com": "운영",
    "sales@example.com": "영업"
  }
}
```

## 로컬

```bash
cp .env.example .env.local   # 값 채우기
pnpm --filter admin-mcp dev  # http://localhost:4010/mcp
pnpm --filter admin-mcp test
```

MCP Inspector(`npx @modelcontextprotocol/inspector`)에서 `http://localhost:4010/mcp` 를 Streamable HTTP 로 연결하면
로그인 화면부터 tool 호출까지 확인할 수 있다.

## 배포

1. Vercel 에서 이 저장소로 프로젝트를 하나 더 만들고 Root Directory 를 `apps/admin-mcp` 로 둔다. Framework 는 Hono 로 잡힌다.
2. 위 환경 변수를 넣는다.
3. 도메인을 연결하고 `ADMIN_MCP_PUBLIC_ORIGIN` 을 그 주소로 맞춘다.
4. claude.ai 조직 설정 → 커넥터 → 맞춤 커넥터 추가 → `https://<도메인>/mcp`.
   Claude Code 는 `claude mcp add --transport http ogonggo-admin https://<도메인>/mcp`.

## 운영

- **사람 추가·제거**: `ADMIN_MCP_ACCESS` 를 고치고 재배포한다. 빠진 사람은 다음 요청부터 막힌다.
- **로그**: `login`, `login_rejected`, `tool_call`(email, department, tool, status, ms) 이 JSON 한 줄로 남는다. 인자 값은 남기지 않는다.
- **서비스 계정으로 콘솔·웹에 로그인하지 않는다.** 로그인하면 MCP 쪽 오공고 refresh 가 무효가 된다. 다음 호출에서 다시 로그인해 복구된다.
