# ogonggo-FE

pnpm workspace: `apps/admin`(Vite, 내부 관리자), `apps/web`(Next.js + Turbopack, 대국민 서비스),
`packages/ui`(디자인 시스템), `packages/api`(백엔드 OpenAPI 기반 코드젠). 구조와 빌드 체계는
[`docs/architecture.md`](docs/architecture.md), 디자인 토큰은 [`docs/design-system.md`](docs/design-system.md)
참고.

## 시작하기

```bash
pnpm install
pnpm dev         # web(http://localhost:4000)·admin(http://localhost:4001) 을 로컬 백엔드에 붙여 함께 띄운다
pnpm mock        # 같은 두 앱을 목데이터(MSW) 로 띄운다
```

한 앱만 띄우려면 `pnpm dev:web`, `pnpm dev:admin`, `pnpm mock:web`, `pnpm mock:admin`.

포트는 3000번대를 피해 4000/4001로 고정했다 — 렛츠커리어 프론트(`lets-intern-client`)가 로컬에서
3000(web)/3001(admin)/3002(mentor)를 쓰므로, 두 스택을 동시에 띄워도 겹치지 않는다.

`packages/api`는 ogonggo-BE의 OpenAPI 스펙에서 코드를 생성한다. 로컬에서 백엔드를 띄운 뒤:

```bash
pnpm codegen
```
