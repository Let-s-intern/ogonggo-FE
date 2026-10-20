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

**enum 라벨의 출처**

화면에 보이는 enum 값의 이름(배지, 상세 칸, 필터·폼 선택지, 정렬, 본문 칸 제목, 판정 문구)은 모두 백엔드 enum 카탈로그의 `desc` 다. 카탈로그는 백엔드 Kotlin enum 에서 나오고 `GET /api/v1/enums` 가 `data.<Enum 이름>` 아래 선언 순서대로 `{ name, desc, parent }` 를 준다. `parent` 는 상위 값이다(직무 → 직군, 시·군·구 → 시·도).

앱은 실행 중에 `/enums` 를 부르지 않고 codegen 때 받아 둔 정적 스냅숏을 import 한다. 사용자 웹이 URL 필터 파싱, JSON-LD, 서버 컴포넌트에서 라벨을 동기 함수로 쓰기 때문이다. 그 대가로 백엔드가 라벨만 바꿔도 codegen 과 FE 배포가 있어야 화면에 반영된다.

| 파일                                      | 하는 일                                                                           |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `packages/api/scripts/generate-enums.mjs` | codegen 때 `GET /api/v1/enums` 를 받아 스냅숏을 쓴다                              |
| `packages/api/src/generated/enums.ts`     | 스냅숏 `ENUM_CATALOG`. 생성물이라 손으로 고치지 않는다                            |
| `packages/api/src/enums.ts`               | 헬퍼. `packages/api/src/index.ts` 와 `packages/api/src/admin.ts` 가 함께 내보낸다 |
| `packages/api/src/enums.typecheck.ts`     | 스냅숏과 orval 생성 타입의 값 집합이 같은지 타입으로 단언한다                     |
| `packages/api/src/mocks/enums.ts`         | 목 `GET /api/v1/enums`·`GET /api/v1/admin/enums`. 스냅숏을 그대로 돌려준다        |

생성 명령은 `pnpm --filter @ogonggo/api codegen` 이고, `packages/api/package.json` 의 `codegen` 이 `orval --config orval.config.ts && node scripts/generate-enums.mjs` 다. 기준 주소는 orval 과 같은 `OGONGGO_USER_API_URL` 에서 끝의 `/v3/api-docs` 를 뗀 것이고, 없으면 `http://localhost:8080` 이다. 받지 못하거나 `data` 가 비어 있으면 0이 아닌 코드로 끝나고 기존 스냅숏은 그대로 남는다. 무엇이 바뀌었는지는 `git diff packages/api/src/generated/enums.ts` 로 본다.

헬퍼(`packages/api/src/enums.ts`)는 모두 동기 함수다. `ENUM_CATALOG` 는 이 파일 밖에서 직접 읽지 않는다.

| 이름                             | 돌려주는 것                                                                                                           |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `enumOptions(name)`              | 선언 순서의 `{ value, label }[]`. 폼·필터 선택지                                                                      |
| `enumLabel(name, value)`         | 값의 라벨. 카탈로그에 없는 값이면 값 그대로                                                                           |
| `enumLabels(name)`               | 값 → 라벨 맵. 사용자 웹의 `Record<Enum, string>` 상수가 이것으로 만들어진다                                           |
| `enumChildren(name, parent)`     | 상위 값이 같은 값들(직군 → 직무, 시·도 → 시·군·구)                                                                    |
| `enumParent(name, value)`        | 상위 값(직무 → 직군). 없으면 `undefined`                                                                              |
| `contentFieldLabel(name, field)` | 본문 칸 이름(camelCase 응답 필드)의 라벨. `companyAndTeamIntroduction` 을 `COMPANY_AND_TEAM_INTRODUCTION` 으로 찾는다 |
| `EnumName`, `EnumValue<K>`       | 카탈로그 enum 이름과 그 값의 유니온 타입                                                                              |

사용자 웹의 라벨 맵(예: `apps/web/src/entities/job/model/labels.ts`)은 이름과 타입을 그대로 두고 값만 헬퍼로 만든다. 그래서 import 하는 곳은 카탈로그를 모른다.

타입 단언(`packages/api/src/enums.typecheck.ts`)은 FE 가 라벨이나 선택지를 쓰는 enum 마다 스냅숏의 값 집합과 orval 생성 타입 하나가 같은지 확인한다. orval 생성물과 스냅숏 중 한쪽만 다시 받으면 `pnpm type-check` 가 이 파일에서 실패한다. 본문 칸(`JobContentField`, `BootcampContentField`)은 생성 타입이 없어, 목의 `JOB_CONTENT_FIELDS`·`BOOTCAMP_CONTENT_FIELDS` 칸 이름이 카탈로그 값과 맞는지를 대신 단언한다.

어드민 전용 enum 둘(`AdminContentSortType`, `AdminContentVisibility`)은 공개 카탈로그에 없다. codegen 에 어드민 토큰을 넣지 않으려고 `apps/admin/src/shared/config/labels.tsx` 에 백엔드 `desc` 를 옮겨 두고 출처 Kotlin 파일을 주석으로 적었다. 어드민도 `GET /api/v1/admin/enums` 를 부르지 않는다.

라벨 규칙은 다음과 같다.

1. 문구가 화면에 맞지 않으면 FE 에서 덮지 않는다. 백엔드 Kotlin enum 의 `desc` 를 고쳐 배포한 뒤 codegen 으로 스냅숏을 다시 받는다. 백엔드끼리 띄어쓰기가 다른 곳(채용공고 `모집 중`, 부트캠프 `모집중`)도 그대로 쓴다.
2. 백엔드 enum 에 없는 FE 전용 값만 FE 가 라벨을 정하고, 그때도 같은 뜻의 백엔드 라벨을 빌린다. 사이드·스터디 지원 단계의 `SCRAPPED` 는 `enumLabel('JobApplicationStatus', 'SCRAPPED')`(`apps/web/src/features/application-board/model/stages.ts`)이고, 사이드·스터디의 마감일 없음 표기는 `alwaysOpenLabel`(`apps/web/src/shared/lib/dday.ts`)이 부트캠프의 `BootcampRecruitmentType` 라벨을 쓴다.
3. 어떤 값을 보일지와 순서는 화면이 정한다. 기본은 전체·선언 순서이고, 값을 빼거나 다시 정렬하는 곳은 그 자리에 이유를 주석으로 적는다.
4. 색(tone), `전체` 같은 자리표시 행, "정렬 기준(최신순)" 같은 감싸는 문구는 FE 에 둔다. 안쪽 라벨만 카탈로그에서 온다.
