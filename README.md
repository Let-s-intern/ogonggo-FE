# ogonggo-FE

pnpm workspace: `apps/admin`(Vite, 내부 관리자), `apps/web`(Next.js + Turbopack, 대국민 서비스),
`packages/ui`(디자인 시스템), `packages/api`(백엔드 OpenAPI 기반 코드젠). 구조와 빌드 체계는
[`docs/architecture.md`](docs/architecture.md), 디자인 토큰은 [`docs/design-system.md`](docs/design-system.md)
참고.

## 시작하기

```bash
pnpm install
pnpm dev:admin   # apps/admin, http://localhost:5173
pnpm dev:web     # apps/web, http://localhost:3000
```

`packages/api`는 ogonggo-BE의 OpenAPI 스펙에서 코드를 생성한다. 로컬에서 백엔드를 띄운 뒤:

```bash
pnpm codegen
```
