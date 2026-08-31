# PRD: 홈 화면 · 채용공고 상세페이지

- 상태: Draft
- 작성일: 2026-08-31
- 대상: `apps/web` (대국민 서비스)
- 관련 이슈: [#4](https://github.com/Let-s-intern/ogonggo-FE/issues/4)
- 백엔드: `ogonggo-api-user` ([ogonggo-BE](https://github.com/Let-s-intern/ogonggo-crawler) — 저장소 이전 전 이름 ogonggo-BE)

## 1. 배경과 목표

`apps/web`에 두 화면을 만든다.

1. **홈 화면** — 채용공고 목록. `docs/design-system.md`의 "오늘의 공고" 카드(제목, 회사명, 지역)가
   기준 화면이다.
2. **채용공고 상세페이지** — 공고 하나의 전체 내용과 원문 이동 버튼.

이 작업 전, `GET /api/v1/jobs`(목록)와 `GET /api/v1/jobs/{jobId}`(상세)를 대상으로 `ogonggo-api-user`를
로컬에 띄우고 `packages/api`에서 `orval` codegen이 실제로 도는지 확인했다. 아래 4절이 그 결과다.

## 2. API 계약 (확인 완료)

출처: `ogonggo-BE/ogonggo-api-user/.../job/presentation/UserJobApi.kt`, 로컬에서 띄운
`GET /v3/api-docs` 응답 (`info.title: "Ogonggo User API"`, `paths` 17개 확인).

### 2.1 목록 — `GET /api/v1/jobs`

| 파라미터 | 타입 | 기본값 | 비고 |
|---|---|---|---|
| `page` | int, ≥1 | 1 | 1-based |
| `size` | int, 1~100 | 10 | |
| `sort` | `LATEST` \| `VIEW_COUNT` | `LATEST` | 조회수순은 동률이면 최신순 |

응답 `data`는 `PageResponse<UserJobSummaryResponse>`:

```ts
interface UserJobSummaryResponse {
  id: number
  companyName: string
  title: string
  employmentType: 'FULL_TIME' | 'CONTRACT' | 'INTERN' | 'PART_TIME' | 'ETC'
  experienceType: 'NEWCOMER' | 'EXPERIENCED' | 'BOTH' | 'IRRELEVANT'
  experienceMinYears: number | null
  experienceMaxYears: number | null
  educationLevel: 'ANY' | 'HIGH_SCHOOL' | 'ASSOCIATE' | 'BACHELOR' | 'MASTER' | 'DOCTORATE'
  region: string | null
  recruitmentType: 'PERIOD' | 'ALWAYS_OPEN'
  recruitmentStartAt: string | null   // LocalDateTime
  recruitmentEndAt: string | null
  closedAt: string | null
  bookmarked: boolean
  viewCount: number
  bookmarkCount: number
  commentCount: number
}
```

### 2.2 상세 — `GET /api/v1/jobs/{jobId}`

`UserJobSummaryResponse`의 모든 필드 + 본문 필드:

```ts
companyAndTeamIntroduction: string | null
responsibilities: string | null
qualifications: string | null
preferredQualifications: string | null
compensation: string | null
benefits: string | null
hiringProcess: string | null
sourceUrl: string | null
```

호출 시 서버가 비동기로 조회수 이벤트를 발행한다 (`JobViewedEvent`) — 상세 응답의 `viewCount`에는
이번 조회가 반영되지 않는다. 404는 `JOB_NOT_FOUND`.

### 2.3 원문 이동 기록 — `POST /api/v1/jobs/{jobId}/source-url-clicks` (2차 스코프)

상세 페이지의 "원문 확인" 버튼을 누른 사실만 기록한다. 같은 사용자가 여러 번 눌러도 항상 성공.
MVP 범위에는 넣지 않고, 버튼 자체(2.2의 `sourceUrl`로 새 탭 이동)만 먼저 낸다.

### 2.4 스코프 밖

- `GET /api/v1/jobs/calendar` — 달력 뷰, 이번 PRD 범위 아님
- `/api/v1/job-bookmarks/**` — 북마크 토글, 이번 PRD 범위 아님 (목록/상세 응답의 `bookmarked` 필드는
  표시만 하고 상호작용은 다음 이슈)
- 검색/필터 — 백엔드에 파라미터 자체가 없다 (`page`/`size`/`sort`뿐). 검색이 필요하면 백엔드에
  먼저 요청해야 한다.

## 3. 막힌 지점 — 인증 (중요)

**`GET /api/v1/jobs`, `GET /api/v1/jobs/{jobId}` 모두 인증이 필요하다.** 익명 접근이 401을 받는 것을
실제로 확인했다:

```
$ curl http://localhost:3000/api/v1/jobs   # apps/web dev 서버 → 프록시 → 백엔드
{"status":401,"code":"UNAUTHORIZED","message":"리소스 접근 권한이 없습니다."}
```

`UserSecurityConfiguration.kt`: `GET /api/v1/jobs`, `/api/v1/jobs/**`는 `authenticated()`로
막혀 있다. 로그인은 렛츠커리어 액세스 토큰을 오공고 토큰으로 교환하는 방식뿐이다
(`docs/architecture/authentication.md` 참고, `POST /api/v1/auth/letscareer`).

**이게 왜 문제인가:** "홈 화면"이라는 이름과 달리, 지금 백엔드 계약대로면 로그인하지 않은 사용자는
채용공고를 한 건도 볼 수 없다. 채용 게시판 제품에서 비로그인 탐색을 허용할지는 일반적으로 제품
결정 사항이고, 이 저장소 문서 어디에도 결정된 바가 없다 (`docs/architecture/authentication.md` 8절
"아직 정하지 않은 것"에도 이 항목은 없음 — 즉 논의 자체가 안 된 상태로 보인다).

**제안하는 두 갈래:**

1. **지금 계약대로 간다** — 홈 화면 진입 자체가 로그인을 요구한다. 그러면 이 이슈보다 로그인 플로우
   (렛츠커리어 OAuth → 토큰 교환)가 먼저 필요하다. 이번 PRD 범위를 넘는 별도 이슈가 된다.
2. **비로그인 목록/상세 조회를 백엔드에 요청한다** — `GET /api/v1/jobs`류를 `permitAll`로 열고,
   개인화 필드(`bookmarked`)만 로그인 시에만 채우는 방식. 흔한 채용 게시판 패턴과도 맞는다.

**이번 PRD는 2번을 전제로 화면을 설계하되, 실제로 백엔드가 열려 있지 않은 지금은 로컬 개발을
`packages/api`의 MSW mock(6절)으로 진행한다.** 1번으로 갈지 2번으로 갈지는 팀 결정이 필요하다 —
이 문서만으로 조용히 확정하지 않는다.

## 4. Codegen 확인 (완료, 수정 포함)

로컬에서 `ogonggo-api-user`를 띄우고(Docker, 4-1 참고) `orval`로 실제 codegen을 돌렸다.
`useGetJobs`, `useGetJob` react-query 훅이 정상 생성되고 `pnpm type-check`을 통과한다.

과정에서 실제 버그 두 개를 고쳤다 (이 브랜치에 포함):

- **`packages/api/src/lib/http-client.ts`의 mutator 시그니처가 틀렸었다.** orval의 fetch 클라이언트는
  생성된 코드에서 `httpClient(url, init)`처럼 두 인자로 부르는데, 기존 구현은 `{ url, params, ...init }`
  객체 하나를 받는 axios 스타일이었다. 모든 생성 함수에서 타입 에러가 났다 — 이제 두 인자 시그니처로
  고쳤다.
- **`mock: true`가 요구하는 `@faker-js/faker`가 의존성에 없었다.** `packages/api`에 devDependency로
  추가했다.

### 4.1 로컬에서 백엔드 띄우기 (겪은 문제와 해결)

이 머신에는 이미 포트 3306/6379(렛츠커리어 로컬 MySQL·Redis)와 8080(렛츠커리어 서버 자체, Java
프로세스)이 떠 있어서 `ogonggo-BE`의 기본 `docker-compose.yml`과 그대로 충돌한다. `ogonggo-BE/`에
커밋하지 않는 `docker-compose.override.yml`로 호스트 포트만 옮겨 피했다:

```yaml
services:
  mysql:
    ports: !override ["3307:3306"]
  redis:
    ports: !override ["6380:6379"]
  ogonggo-api-user:
    ports: !override ["18080:8080"]
```

(`!override`가 없으면 Compose가 base 파일의 포트 목록에 이 값을 **추가**만 해서, base의 `8080:8080`이
여전히 남아 충돌한다 — 처음에 이걸로 한 번 실패했다.)

`apps/web`은 `next.config.ts`의 `rewrites()`로 `/api/**`를 백엔드로 프록시한다
(`OGONGGO_USER_API_ORIGIN` 환경변수, 기본값 `http://localhost:8080`). `packages/api`의
`httpClient`는 base URL을 모르고 항상 상대 경로로 호출하므로 — Vite(`apps/admin`)와
Next(`apps/web`)가 서로 다른 방식으로 env를 읽는 문제를 피하려고 각 앱의 dev 서버 프록시에
맡겼다. `apps/admin/vite.config.ts`에도 같은 패턴으로 `/api` 프록시를 미리 넣어뒀다
(관리자 백엔드는 이번에 띄우지 않음).

### 4.2 생성 코드를 커밋할지 (미정 — 팀 결정 필요)

`.gitignore`가 `**/src/generated/`를 이미 막고 있다 (베이스 스캐폴드 때부터). 즉 지금 구조는 매
개발자·CI가 실행 시점에 백엔드(또는 스펙 파일)에 접근해 `pnpm codegen`을 돌려야 타입이 채워진다.

- **커밋 안 함(현재 상태)** — 저장소가 깨끗하지만, 백엔드 없이는 `apps/web`을 타입체크·빌드할 수 없다.
- **커밋함** — CI·다른 개발자가 백엔드 없이도 동작하지만, PR마다 생성 코드 diff가 크게 낀다.

이번 PRD는 결정하지 않는다. 홈 화면 구현 이슈에서 먼저 결정하고 시작하는 걸 제안한다.

## 5. 화면 설계 (FSD)

```
apps/web/src/
├── entities/job/
│   ├── model/types.ts       UserJobSummary, UserJobDetail (generated 타입을 도메인 이름으로 재노출)
│   └── ui/
│       ├── JobBadge.tsx     고용형태·경력·학력 pill (Badge 재사용)
│       └── JobMeta.tsx      회사명·지역·마감 표시 한 줄
├── widgets/
│   ├── job-list/ui/JobList.tsx        페이지네이션 포함 목록
│   └── job-detail/ui/JobDetailView.tsx 상세 본문 섹션 구성
├── views/
│   ├── home/ui/HomePage.tsx           widgets/job-list 조합 (기존 placeholder 교체)
│   └── job-detail/ui/JobDetailPage.tsx widgets/job-detail 조합
└── app/
    ├── page.tsx                      → views/home
    └── jobs/[jobId]/page.tsx         → views/job-detail (신규 라우트)
```

- 데이터 페칭은 Server Component에서 `@ogonggo/api`가 감싼 fetch로 (홈: 목록, 상세: 단건).
  로그인 세션 판단(3절 결정 이후)이 붙기 전까지는 MSW mock으로 개발한다.
- `packages/ui`의 `Card`, `Badge`, `Button`, `Avatar`를 그대로 쓴다 — 새 프리미티브는 만들지 않는다.
- 정렬(`LATEST`/`VIEW_COUNT`) 토글은 이번 MVP에 넣는다 (백엔드가 이미 지원). 검색·필터는 3.4절대로
  범위 밖.

## 6. 로컬 개발 — 인증 없이 진행하는 법

3절 결정이 나기 전까지, `packages/api/src/mocks/handlers.ts`에 `getJobsMock`/`getJobMock`
(orval `mock: true`가 이미 생성해 둔 faker 기반 핸들러)을 채워 넣고 MSW로 개발한다. 실제 인증
플로우가 붙거나 백엔드가 목록을 `permitAll`로 열면 그때 실제 API로 전환한다.

## 7. Out of scope

- 로그인 플로우 자체 (렛츠커리어 OAuth 연동) — 3절 결정에 따라 별도 이슈
- 북마크 토글, 원문 이동 기록 API 연동
- 검색/필터, 달력 뷰
- `apps/admin` 쪽 변경

## 8. Acceptance criteria

- [ ] `/` 에서 채용공고 목록이 카드로 보인다 (제목, 회사명, 지역, 고용형태, 마감 표시)
- [ ] 정렬(최신순/조회수순) 전환이 동작한다
- [ ] 페이지네이션이 동작한다 (백엔드 `pageInfo` 기준)
- [ ] 카드 클릭 시 `/jobs/[jobId]`로 이동한다
- [ ] 상세 페이지에 회사소개·자격요건·우대사항·보상·복지·채용절차가 있는 필드만 표시된다
  (`null`인 섹션은 숨긴다)
- [ ] 상세 페이지에 원문 이동 버튼이 있다 (`sourceUrl`이 있을 때만, 새 탭)
- [ ] 두 화면 모두 로딩/빈 목록/404(상세) 상태를 처리한다
- [ ] `pnpm type-check`, `pnpm lint`, `pnpm build`(apps/web) 통과

## 9. 열린 질문

1. 비로그인 채용공고 열람을 허용할지 (3절) — **블로킹.**
2. `packages/api`의 생성 코드를 커밋할지 (4.2절)
3. 목록 카드에 즐겨찾기(북마크) 아이콘을 지금 넣고 비활성 처리만 할지, 아예 다음 이슈로 미룰지
