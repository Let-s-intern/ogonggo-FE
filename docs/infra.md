**프로젝트 모노레포 구조 (pnpm + FSD)**

```text
my-monorepo/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── apps/
│   ├── admin/ (Vite + FSD)
│   │   └── src/
│   │       ├── app/
│   │       ├── pages/
│   │       ├── widgets/
│   │       ├── features/
│   │       ├── entities/
│   │       └── shared/
│   └── web/ (Next.js + FSD)
│       └── src/
│           ├── app/
│           ├── pages/
│           ├── widgets/
│           ├── features/
│           ├── entities/
│           └── shared/
└── packages/
    ├── api/ (Orval + TanStack Query + Zod + MSW)
    ├── ui/ (Radix UI + Tailwind CSS + Storybook)
    └── config/ (oxlint, oxfmt, tsgo, tsconfig)

```

**workspace 설정 (`pnpm-workspace.yaml`)**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'

```

**패키지별 핵심 역할**

* **`apps/admin` (Vite)**: 내부 관리자 시스템. FSD 레이어 규칙을 따르며 `packages/api`와 `packages/ui`를 가져다 사용.
* **`apps/web` (Next.js with Turbopack)**: 대국민 서비스 웹. FSD 구조 적용, Server Components 및 클라이언트 컴포넌트 분리.
* **`packages/api`**: OpenAPI 스펙을 바탕으로 `Orval`이 TanStack Query 훅, Zod 스키마, TypeScript 타입을 자동 생성하며, `MSW`를 통한 목업 서버 환경 제공.
* **`packages/ui`**: `Radix UI` 헤드리스 컴포넌트와 `Tailwind CSS`를 결합한 공통 디자인 시스템 컴포넌트 및 `Storybook` 문서화 환경.
* **`packages/config`**: `oxlint`, `oxfmt`, `tsgo`, 그리고 `tsconfig` 공통 설정을 중앙화하여 모노레포 전체의 품질 및 빌드 기준 통일.

**루트 개발 명령어 (`package.json`)**

```json
{
  "scripts": {
    "dev:admin": "pnpm --filter admin dev",
    "dev:web": "pnpm --filter web dev",
    "codegen": "pnpm --filter api generate",
    "type-check": "tsgo --noEmit",
    "lint": "oxlint",
    "format": "oxfmt write",
    "storybook": "pnpm --filter ui storybook"
  }
}

```