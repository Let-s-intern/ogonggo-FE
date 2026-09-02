**프로젝트 모노레포 구조 (pnpm + FSD)**

```text
my-monorepo/
├── turbo.json
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
│   └── web/ (Next.js + Turbopack + FSD)
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

- **`apps/admin` (Vite)**: 내부 관리자 시스템. FSD 레이어 규칙을 따르며 `packages/api`와 `packages/ui`를 가져다 사용.
- **`apps/web` (Next.js with Turbopack)**: 대국민 서비스 웹. FSD 구조 적용, Server Components 및 클라이언트 컴포넌트 분리.
- **`packages/api`**: OpenAPI 스펙을 바탕으로 `Orval`이 TanStack Query 훅, Zod 스키마, TypeScript 타입을 자동 생성하며, `MSW`를 통한 목업 서버 환경 제공.
- **`packages/ui`**: `Radix UI` 헤드리스 컴포넌트와 `Tailwind CSS`를 결합한 공통 디자인 시스템 컴포넌트 및 `Storybook` 문서화 환경.
- **`packages/config`**: `oxlint`, `oxfmt`, `tsgo`, 그리고 `tsconfig` 공통 설정을 중앙화하여 모노레포 전체의 품질 및 빌드 기준 통일.

**빌드 오케스트레이션 — Turborepo와 Turbopack**

이름이 비슷하지만 역할이 다른 두 도구를 함께 쓴다.

| 도구          | 층위                              | 하는 일                                                                                                                                                         |
| ------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Turborepo** | 모노레포 전체 (루트 `turbo.json`) | `apps/*`, `packages/*` 사이의 태스크(build, lint, type-check, test)를 의존 그래프 순서대로 실행하고, 로컬/원격 캐시로 바뀌지 않은 패키지는 다시 실행하지 않는다 |
| **Turbopack** | `apps/web` 내부 (Next.js)         | Next.js의 Rust 기반 번들러 겸 개발 서버. Webpack을 대체하며 `next dev --turbo`로만 켜진다. `apps/admin`(Vite)에는 관여하지 않는다                               |

Turborepo는 "여러 패키지를 어떤 순서로, 뭘 캐싱해서 돌릴지"를 결정하고, Turbopack은 그중 `apps/web` 한 패키지를 "얼마나 빨리 번들링할지"를 결정한다. 서로 대체 관계가 아니라 층이 다르다.

**`turbo.json` 파이프라인**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "codegen": {
      "outputs": ["src/generated/**"]
    }
  }
}
```

`dependsOn: ["^build"]`는 "이 패키지를 빌드하기 전에 이 패키지가 의존하는 워크스페이스 패키지부터 빌드한다"는 뜻이다. `packages/ui`, `packages/api`가 먼저 빌드되어야 `apps/admin`, `apps/web`이 그 결과물을 가져다 쓸 수 있다.

`dev`는 캐싱 대상이 아니고 프로세스가 계속 떠 있어야 하므로 `cache: false`, `persistent: true`로 캐시·완료 판정에서 제외한다.

**루트 개발 명령어 (`package.json`)**

여러 패키지를 가로지르는 작업(빌드, 린트, 타입체크, 코드젠)은 `turbo run`으로 묶어 캐시와 의존 순서를 태운다. 앱 하나만 띄우는 개발 서버는 `pnpm --filter`로 직접 부른다 — 캐싱할 결과물이 없고 항상 새로 떠야 하기 때문이다.

```json
{
  "scripts": {
    "dev:admin": "pnpm --filter admin dev",
    "dev:web": "pnpm --filter web dev",
    "build": "turbo run build",
    "codegen": "turbo run codegen",
    "type-check": "turbo run type-check",
    "lint": "turbo run lint",
    "format": "oxfmt write",
    "storybook": "pnpm --filter ui storybook"
  }
}
```
