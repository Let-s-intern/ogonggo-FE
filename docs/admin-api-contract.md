# 어드민 콘솔 API 명세

> 작성일: 2026-09-10
> 대상 백엔드: `ogonggo-BE/ogonggo-api-admin`
> 근거: `packages/api/src/mocks/admin/` 의 MSW 핸들러
> 관련 PRD: `.claude/tasks/todo/prd-admin-console.md`
> 스펙 대조: 2026-09-18, `ogonggo-api-admin` 의 `/v3/api-docs` 와 2·3·5·6 절. 각 절 끝의
> "목과 백엔드 스펙의 차이" 에 남은 차이를 적었다
> 목 기록: 2026-09-21, 1·4·7 절. **대조가 아니라 목 핸들러가 하는 일을 옮겨 적은 것이다** —
> 이 셋은 백엔드가 없어 대조할 상대가 없다
> 스펙 대조: 2026-09-23, 8 절. 배포된 `ogonggo-api-admin` 의 `/v3/api-docs` 와 대조하고 목
> 핸들러를 스펙에 맞춰 고쳤다

## 이 문서가 무엇인가

어드민 콘솔 화면이 MSW 목데이터 위에서 먼저 만들어졌다. **목 핸들러가 그대로 계약이다.**
이 문서는 그 핸들러를 읽고 옮겨 적은 것이고, 백엔드는 이대로 구현하면 화면을 고치지 않고
붙는다.

구현 순서를 정할 때 쓸 수 있도록 각 항목에 **어떤 화면의 어떤 조작이 부르는지**와 **어떻게
동작해야 하는지**를 함께 적었다. 응답 모양만 맞고 동작이 다르면 화면은 그려지지만 쓸 수 없다 —
예를 들어 목록이 `keyword` 를 받아 두고 무시하면 검색 상자가 도는 것처럼 보이면서 결과가
바뀌지 않는다.

## 공통

**호스트.** `admin.ogonggo.co.kr` (운영), 로컬은 `http://localhost:4001`. 프런트는 상대 경로로
부르고 각 앱의 dev 서버가 `/api/**` 를 백엔드로 프록시한다
(`apps/admin/vite.config.ts` 의 `server.proxy`).

**메뉴와 경로.** 검수 대기와 반려 보관은 화면상 광고 메뉴 아래(`/ads/review`, `/ads/rejections`)에
있다. API 경로는 `/api/v1/admin/review-queue` 그대로다 — 화면 묶음이 바뀌었다고 API 를 옮기면
백엔드가 메뉴 구성 변화를 따라다니게 된다.

**경로 접두사.** 모두 `/api/v1/admin/` 아래다. 크롤러가 쓰는 `/api/v1/internal/` 과 섞지 않는다 —
`internal` 은 API 키를 쓰고(`InternalApiKeyAuthenticationFilter.kt`) `admin` 은 관리자 토큰을
검증해(`AdminAuthenticationFilter.kt`) 인증 방식이 다르다.

**인증.** 요청마다 `Authorization: Bearer <액세스 토큰>` 을 보낸다. 관리자도 사용자 API 의
로그인으로 토큰을 받고, 어드민 API 는 발급하지 않고 검증만 한다. `AdminAuthenticationFilter` 가
서명·만료·`type=access` 를 확인하고 `AdminAuthService` 가 요청마다 역할과 상태를 읽어,
`UserRole.ADMIN` 이면서 `ACTIVE` 인 계정만 통과한다. 콘솔 안에서의 추가 권한 구분은 없다.

| 상황                                 | 응답               |
| ------------------------------------ | ------------------ |
| 토큰 없음, 서명·만료·종류 불일치     | 401 `UNAUTHORIZED` |
| 유효한 토큰이지만 활성 관리자가 아님 | 403 `FORBIDDEN`    |

역할은 토큰에 없어 요청마다 조회한다. 역할을 회수하면 액세스 토큰이 만료되기 전이라도 다음
요청부터 막힌다. `ADMIN` 역할은 콘솔이나 API 로 부여하지 않고 운영자가 DB 에서 직접 바꾼다.
자세한 내용은 `ogonggo-BE/docs/architecture/authentication.md` 7-3 절.

`AdminSecurityConfiguration.kt` 의 `anyRequest().denyAll()` 은 위 두 접두사와 헬스 체크·Swagger
어디에도 걸리지 않은 경로만 받는다. `/api/v1/admin/**` 는 그 앞에서 관리자 권한으로 열려 있다.

**성공 응답 봉투.** 사용자 API 와 같다.

```json
{ "status": 200, "message": "OK", "data": {} }
```

**오류 응답 봉투.**

```json
{ "status": 404, "code": "NOT_FOUND", "message": "채용공고를 찾을 수 없습니다." }
```

`message` 는 화면에 그대로 보여줄 수 있는 한국어여야 한다. 화면이 오류 문구를 따로 만들지
않는다.

**목록 응답.** 페이지를 나누는 목록은 전부 같은 모양이다.

```json
{
  "items": [],
  "pageInfo": { "pageNum": 1, "pageSize": 20, "totalElements": 137, "totalPages": 7 }
}
```

`page` 는 1부터 세고 기본 `size` 는 20이다. **마지막 페이지를 넘어가는 `page` 는 빈 `items` 를
준다.** 마지막 페이지로 되돌리지 않는다 — 주소창의 `page=99` 가 조용히 3으로 바뀌면 운영자는
자기가 어디를 보고 있는지 알 수 없다.

**빈 필터 값.** 프런트는 값이 빈 필터를 아예 보내지 않는다. 서버도 빈 문자열이 오면 "전체"로
다뤄야 하고, 빈 값으로 걸러 0건을 내면 안 된다.

**검색.** `keyword` 는 대소문자를 무시한 부분 일치다. 대상 칸은 항목마다 아래에 적었다.

---

## 한눈에 보기

| #   | 페이지                       | 조작                          | 메서드 · 경로                                | 동작                               |
| --- | ---------------------------- | ----------------------------- | -------------------------------------------- | ---------------------------------- |
| 1   | `/` 대시보드                 | 진입                          | `GET /dashboard/summary`                     | 처리할 일·오늘 유입 숫자를 한 번에 |
| 2   | `/content/jobs`              | 진입·검색·필터·정렬·페이지    | `GET /jobs`                                  | 목록. 파라미터를 실제로 반영       |
| 3   | `/content/jobs`              | 노출 토글                     | `PATCH /jobs/{id}`                           | `visibility` 만 바꿈               |
| 4   | `/content/jobs/{id}`         | 진입                          | `GET /jobs/{id}`                             | 상세                               |
| 5   | `/content/jobs/{id}`         | 운영 값 수정 → 저장           | `PATCH /jobs/{id}`                           | 노출·검수 상태                     |
| 6   | `/content/jobs/{id}`         | 내용 수정 → 저장              | `PATCH /jobs/{id}`                           | 제목·본문 칸                       |
| 7   | `/content/jobs/{id}`         | 삭제 → 문구 입력              | `DELETE /jobs/{id}`                          | 삭제 후 목록으로                   |
| 8   | `/content/bootcamps`         | 진입·검색·필터·정렬·페이지    | `GET /bootcamps`                             | 목록. **채용공고와 같은 파라미터** |
| 9   | `/content/bootcamps`         | 노출 토글                     | `PATCH /bootcamps/{id}`                      | `visibility` 만 바꿈               |
| 10  | `/content/bootcamps/{id}`    | 진입                          | `GET /bootcamps/{id}`                        | 상세                               |
| 11  | `/content/bootcamps/{id}`    | 운영 값 수정 → 저장           | `PATCH /bootcamps/{id}`                      | 노출·검수 상태                     |
| 12  | `/content/bootcamps/{id}`    | 내용 수정 → 저장              | `PATCH /bootcamps/{id}`                      | 제목·본문 칸                       |
| 13  | `/content/bootcamps/{id}`    | 삭제                          | `DELETE /bootcamps/{id}`                     | 삭제 후 목록으로                   |
| 14  | `/content/side-studies`      | 진입·검색·필터·정렬·페이지    | `GET /side-studies`                          | 목록                               |
| 15  | `/content/side-studies/{id}` | 진입                          | `GET /side-studies/{id}`                     | 상세                               |
| 16  | `/content/side-studies/{id}` | 삭제                          | `DELETE /side-studies/{id}`                  | 삭제 후 목록으로                   |
| 17  | `/ads/review`                | 진입                          | `GET /review-queue`                          | 검수 대기 전체 (페이지 없음)       |
| —   | `/ads/review`                | 이전·다음 (버튼 또는 `A`/`D`) | 없음                                         | 화면 안에서만 이동한다             |
| 18  | `/ads/review`                | Space·Backspace 후 저장하기   | `PATCH /review-queue/{type}/{id}`            | 판정. 반려는 사유 필수             |
| 19  | `/ads/review`                | 되돌리기                      | `PATCH /review-queue/{type}/{id}/undo`       | 대기로 되돌림                      |
| 20  | `/ads/review`                | 내용 수정 → 저장              | `PATCH /jobs/{id}` · `PATCH /bootcamps/{id}` | 6·12와 같은 API                    |
| 21  | `/ads/rejections`            | 진입·검색·필터                | `GET /rejections`                            | 반려 기록 목록                     |
| 22  | `/ads/rejections`            | 사유 수정 → 저장              | `PATCH /rejections/{type}/{id}`              | 사유 교체. 비울 수 없음            |
| 23  | `/members/users`             | 진입·검색·필터·페이지         | `GET /members/users`                         | 목록                               |
| 24  | `/members/users/{id}`        | 진입                          | `GET /members/users/{id}`                    | 상세 + 활동                        |
| 25  | `/members/companies`         | 진입·검색·필터·페이지         | `GET /members/companies`                     | 목록                               |
| 26  | `/members/companies/{id}`    | 진입                          | `GET /members/companies/{id}`                | 상세 + 등록 공고                   |
| 27  | `/support/notices`           | 진입·페이지                   | `GET /notices`                               | 목록. 본문은 싣지 않음             |
| 28  | `/support/notices`           | 행 클릭                       | `GET /notices/{id}`                          | 본문을 받아 수정 폼을 연다         |
| 29  | `/support/notices`           | 새 공지 → 저장                | `POST /notices`                              | 등록                               |
| 30  | `/support/notices`           | 수정 폼 → 저장                | `PATCH /notices/{id}`                        | 보낸 값만 수정                     |
| 31  | `/support/notices`           | 수정 폼 → 삭제                | `DELETE /notices/{id}`                       | 소프트 삭제                        |

지면(`/placements`)과 통계(`/stats`)는 만들지 않는다. 메뉴에 회색 비활성으로 자리만 있다.

---

## 1. 대시보드

### `GET /api/v1/admin/dashboard/summary`

**부르는 곳** — `admin.ogonggo.co.kr/` 진입. 대시보드 화면이 부르는 API 는 이것 하나다.

**쿼리 파라미터** — 없다. 필터·검색·정렬·페이지를 하나도 받지 않는다. 기간은 아래 "기간 기준"
으로 서버가 정한다.

**응답 `data`**

```json
{
  "todo": { "jobsPendingReview": 15 },
  "intake": {
    "jobsCrawledToday": 10,
    "bootcampsCrawledToday": 0,
    "jobsSubmittedToday": 2,
    "newMembersThisWeek": 5
  }
}
```

**동작**

숫자를 한 요청으로 준다. 카드마다 나누면 로딩이 다섯으로 쪼개져 그 사이 화면이 계속 흔들린다.

`jobsPendingReview` 는 채용공고와 부트캠프를 **합한** 수다. 둘 다 비즈니스 회원이 올린다.
`reviewStatus = PENDING` 인 것만 센다.

`intake` 는 크롤링분과 비즈니스 등록분을 나눠 센다 — 합치면 "크롤링이 멈춘 것"과 "그날 아무도
안 올린 것"을 구분할 수 없다.

**기간 기준.** 칸마다 다르다.

| 칸                      | 기간                        |
| ----------------------- | --------------------------- |
| `jobsPendingReview`     | 없다. 남아 있는 전부를 센다 |
| `jobsCrawledToday`      | 오늘 00:00 이후 등록분      |
| `bootcampsCrawledToday` | 오늘 00:00 이후 등록분      |
| `jobsSubmittedToday`    | 오늘 00:00 이후 등록분      |
| `newMembersThisWeek`    | 지금부터 7×24시간 전까지    |

`jobsPendingReview` 에 기간을 걸지 않는 이유는 이것이 **남은 일**을 세는 숫자이기 때문이다.
어제 들어온 검수 대기가 오늘 0시에 사라지면 운영자는 그 건을 영영 보지 못한다.

`...Today` 셋은 **그날 자정부터**다. 목은 브라우저의 `setHours(0, 0, 0, 0)` 으로 자르므로 로컬
자정이고, 백엔드는 KST 자정이어야 한다 — UTC 자정으로 자르면 한국 시간 오전 9시 이전에 등록된
건이 통째로 "어제"로 빠진다.

`newMembersThisWeek` 는 **달력 주가 아니라 최근 7일 이동 창이다.** 월요일에 0으로 돌아가지
않는다. 아래 카드 링크가 `joinedWithinDays=7d` 로 목록을 여는데, 그 필터와 계산이 같아야
숫자와 목록 건수가 맞는다. 일반 회원과 비즈니스 회원을 합한다.

**404 를 주지 않는다.** 집계라 셀 것이 없으면 0 이다. 빈 대시보드를 404 로 알리면 운영자는
화면이 고장 난 것으로 읽는다.

**카드 링크** — 각 숫자는 조건이 걸린 목록으로 간다. 서버가 관여하지 않지만 필터 파라미터가
아래 목록 API 와 맞아야 한다.

| 카드               | 이동                                 |
| ------------------ | ------------------------------------ |
| 검수 대기          | `/ads/review`                        |
| 크롤링 채용공고    | `/content/jobs?source=CRAWLER`       |
| 크롤링 부트캠프    | `/content/bootcamps`                 |
| 비즈니스 등록 공고 | `/content/jobs?source=COMPANY`       |
| 이번 주 신규 회원  | `/members/users?joinedWithinDays=7d` |

크롤링 부트캠프만 필터 없이 목록 전체를 연다(`DashboardPage.tsx`). 부트캠프 목록도 `source`
필터를 받으므로 채용공고와 맞추는 편이 낫지만, 지금 화면이 그렇게 하지 않는다.

---

## 2. 콘텐츠 · 채용공고

### `GET /api/v1/admin/jobs`

**부르는 곳** — `/content/jobs` 진입, 검색·필터·정렬·페이지 변경.

**쿼리 파라미터**

| 이름                | 값                                  | 비고                        |
| ------------------- | ----------------------------------- | --------------------------- |
| `page`              | 1부터                               | 기본 1                      |
| `size`              | 정수                                | 기본 20                     |
| `keyword`           | 문자열                              | **제목 + 회사명** 부분 일치 |
| `visibility`        | `VISIBLE` · `HIDDEN`                |                             |
| `source`            | `CRAWLER` · `COMPANY`               |                             |
| `reviewStatus`      | `PENDING` · `APPROVED` · `REJECTED` | 크롤링 수집분은 `null`      |
| `recruitmentStatus` | `RECRUITING` · `CLOSED`             | **파생값** — 아래 참고      |
| `sort`              | `REGISTERED_AT` · `VIEW_COUNT`      | 기본 `REGISTERED_AT`        |

**응답 `data.items[]`**

```json
{
  "id": 693,
  "title": "2026년 8월 한국후지필름 VMD 경력사원 채용",
  "companyName": "한국후지필름",
  "employmentType": "CONTRACT",
  "experienceType": "EXPERIENCED",
  "educationLevel": "ANY",
  "recruitmentType": "PERIOD",
  "recruitmentStartAt": "2026-09-08",
  "recruitmentEndAt": "2026-09-14",
  "region": "서울 본사",
  "closedAt": null,
  "viewCount": 3254,
  "bookmarkCount": 196,
  "commentCount": 20,
  "visibility": "HIDDEN",
  "source": "COMPANY",
  "reviewStatus": "PENDING",
  "recruitmentStatus": "RECRUITING",
  "registeredAt": "2026-09-10T10:48:00Z"
}
```

**동작**

**본문 칸을 목록 응답에 싣지 않는다.** 한 페이지가 수백 KB 가 된다. 상세에서만 준다.

정렬 기본은 등록일 역순. `VIEW_COUNT` 는 조회 수 내림차순이고 동률이면 등록일 역순으로
되돌린다 — 기준이 하나뿐이면 같은 조회 수 행들의 순서가 요청마다 달라진다.

필터는 전부 AND 다.

`visibility` 는 백엔드 `JobPublicationStatus` 네 값을 **둘로 접어서** 준다. `PUBLISHED` 만
`VISIBLE` 이고 나머지(`DRAFT`·`HIDDEN`·`ARCHIVED`)는 `HIDDEN` 이다. 어드민이 구분해야 하는
것은 "지금 사용자에게 보이는가" 하나다.

**`recruitmentStatus` 는 저장된 칸이 아니라 파생값이다.** `Job` 엔티티에는 모집 상태 enum 이
없고 `closedAt`(마감 처리 일시)·`recruitmentEndAt`(모집 종료 일시)·`recruitmentType`(기간/상시)만
있다. 셋에서 이렇게 계산한다.

1. `closedAt` 이 있으면 `CLOSED`
2. `recruitmentType` 이 `ALWAYS_OPEN` 이거나 `recruitmentEndAt` 이 없으면 `RECRUITING`
3. `recruitmentEndAt` 이 지났으면 `CLOSED`, 아니면 `RECRUITING`

종료일이 없는 기간 채용을 모집 중으로 보는 것이 2번이다. 값이 없다고 닫힌 것으로 보면 수집이
덜 된 공고가 통째로 마감으로 나간다.

**값은 둘뿐이다.** 부트캠프의 `BootcampStatus` 에는 `DRAFT`(임시저장)도 있지만 어드민은 쓰지
않는다 — 운영자가 콘솔에서 만들 수 있는 상태가 아니고, 필터로 남겨 두면 골라도 늘 0 건이다.

`reviewStatus` 는 **크롤링 수집분에서 `null`** 이다. 크롤링은 우리가 고른 사이트에서 긁어오는
것이라 사람이 한 건씩 통과시킬 대상이 아니다. `source = CRAWLER` 이면서 `reviewStatus` 가
값을 갖는 상태가 있으면 안 된다.

### `GET /api/v1/admin/jobs/{jobId}`

**부르는 곳** — `/content/jobs/{id}` 진입.

**응답 `data`** — 목록 항목에 본문 칸을 더한 것.

```json
{
  "companyAndTeamIntroduction": "...",
  "responsibilities": "...",
  "qualifications": "...",
  "preferredQualifications": "...",
  "compensation": "...",
  "benefits": "...",
  "hiringProcess": "...",
  "sourceUrl": "https://recruit.lotte.co.kr/..."
}
```

**동작** — 없는 id 는 404. 본문 칸은 비어 있을 수 있다(크롤러가 못 읽어 온 경우). 화면은 값이
있는 칸만 그린다.

### `PATCH /api/v1/admin/jobs/{jobId}`

**부르는 곳** — 목록의 노출 토글, 상세의 "운영 값 수정" 저장, 상세와 검수 화면의 "내용 수정"
저장.

**요청 본문** — 모두 선택. **넘어온 칸만 바꾼다.**

```json
{
  "visibility": "VISIBLE",
  "reviewStatus": "APPROVED",
  "title": "고친 제목",
  "fields": { "responsibilities": "고친 본문", "compensation": "" }
}
```

**동작**

**부분 수정이다.** 세 값을 늘 함께 보내게 하면 화면이 안 건드린 값까지 되돌려 쓰게 되고,
그 사이 다른 곳에서 바뀐 값이 조용히 덮인다.

`fields` 는 **허용 목록에 있는 칸만** 받는다. 목록 밖의 키는 버린다 — 요청이 아무 키나 실어
`id` 나 `viewCount` 를 덮어쓰는 일을 막는다.

허용 칸: `companyAndTeamIntroduction` `responsibilities` `qualifications`
`preferredQualifications` `compensation` `benefits` `hiringProcess`

`fields` 의 빈 문자열은 **그 칸을 비우라는 뜻**이다. 화면이 빈 칸을 그리지 않는다.

`title` 이 빈 문자열이면 400. 제목 없는 공고는 목록에서 집을 수 없다.

**`source` 는 고칠 수 없다.** `UpdateAdminJobRequest` 에 칸이 없고 보내도 버린다. 화면의 운영 값
수정에도 등록 경로 칸이 없다.

**`reviewStatus` 는 `APPROVED` · `PENDING` 만 받는다.** `REJECTED` 는 400 `BAD_REQUEST`
(`[reviewStatus] 반려는 검수 화면에서 사유와 함께 처리해 주세요.`) 다. 반려는 사유가 있어야 해서
검수 화면(`PATCH /review-queue/{type}/{id}`) 에서만 한다. 운영 값 수정 화면은 바꾼 값만 보내므로
이미 반려된 글을 저장해도 `REJECTED` 가 나가지 않는다.

**`reviewStatus` 가 `REJECTED` 가 아니게 되면 반려 기록을 지운다.** 남겨 두면 반려 보관에
허용된 건이 섞인다.

**크롤링 수집분도 내용을 고칠 수 있다.** 크롤러가 원문 구조를 잘못 읽어 오는 일이 있고,
그때 고칠 방법이 없으면 그 공고는 통째로 내리는 수밖에 없다.

**응답** — 고쳐진 공고 전체.

### `DELETE /api/v1/admin/jobs/{jobId}`

**부르는 곳** — 상세의 "삭제" → 확인 문구 입력 → 삭제.

**동작** — 없는 id 는 404. 삭제하면 반려 기록의 그 항목도 함께 정리하되, **반려 보관 목록에서는
행을 남긴다**(`contentExists: false`). "반려하고 지웠다"는 것도 기록이고, 행이 조용히 사라지면
무엇이 어떻게 됐는지 알 수 없다.

화면은 삭제 후 목록으로 돌아간다. `replace` 로 이동해 뒤로 가기가 없는 글의 상세로 돌아가지
않게 한다.

실제 구현에서 **soft delete 로 둘지는 백엔드가 정한다.** 화면은 어느 쪽이든 같다. 다만 확인
문구 입력이 되돌리기를 대신하고 있으므로, 되돌릴 길이 생긴다면 화면에도 그것을 붙이는 편이
낫다.

**응답** — `SuccessResponseUnit`. `data` 에 쓸 값이 없다.

### 목과 백엔드 스펙의 차이

목 핸들러(`packages/api/src/mocks/admin/content.ts`) 의 응답은 생성 모델
`AdminJobSummaryResponse`, `AdminJobDetailResponse` 로 맞췄다. 그 과정에서 목에서 뺀 칸과, 목이
아직 스펙과 다르게 동작하는 곳이다.

| 항목                                                     | 백엔드 스펙                                                                                                                                                                             | 목                                                        |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `bookmarked`, `experienceMinYears`, `experienceMaxYears` | 목록·상세 응답에 없다                                                                                                                                                                   | 뺐다. 상세 화면의 경력 칸은 `experienceType` 만 보여 준다 |
| `recruitmentStatus`                                      | `RECRUITING` · `CLOSED` 둘                                                                                                                                                              | 있던 `UPCOMING` 을 뺐다. 화면의 "모집 예정" 필터도 뺐다   |
| `reviewStatus` (크롤링 수집분)                           | 생성 모델은 선택 칸이고 실제 응답은 `null` 을 싣는다                                                                                                                                    | 칸을 싣지 않는다. 화면은 둘 다 "해당 없음" 으로 그린다    |
| `PATCH` 의 노출 규칙                                     | 승인하면 곧바로 노출, 검수 대기로 되돌리면 비노출. 기업회원 공고는 승인 전 `VISIBLE` 불가(409 `REVIEW_NOT_APPROVED`), 크롤링 수집분은 검수 상태 변경 불가(409 `CONTENT_NOT_REVIEWABLE`) | 노출과 검수 상태를 따로 바꾼다                            |
| `DELETE`                                                 | 소프트 삭제. 반려 기록을 지우지 않고 반려 보관에 `contentExists=false` 로 남긴다                                                                                                        | 배열에서 빼고 반려 기록도 지운다                          |
| 없는 id                                                  | 404 `JOB_NOT_FOUND`                                                                                                                                                                     | 404 `NOT_FOUND`                                           |

---

## 3. 콘텐츠 · 부트캠프

### `GET /api/v1/admin/bootcamps`

**부르는 곳** — `/content/bootcamps` 진입, 검색·필터·정렬.

**쿼리** — **채용공고와 같다.** `page` `size` `sort` `visibility` `source` `reviewStatus` 에
`keyword`(**과정명 + 운영사**)와 `status` 가 더 있다.

`status` 는 부트캠프의 모집 상태(`BootcampStatus`)이고 어드민이 쓰는 값은
`RECRUITING` · `CLOSED` 둘이다. 백엔드에는 `DRAFT` 도 있지만 화면에서 다루지 않는다.

**응답 `data.items[]`** — 부트캠프 요약 + `registeredAt` `visibility` `source` `reviewStatus`.

**동작**

**칸과 필터를 채용공고와 같게 맞춘다.** 비즈니스 회원은 부트캠프도 올리므로 노출·등록 경로·검수
상태가 똑같이 있다. 한쪽에만 칸을 빼 두면 같은 일을 하러 두 화면을 오갈 때 조작이 달라진다.

모집 상태의 이름만 다르다. 부트캠프는 저장된 칸(`status`)이고 채용공고는 파생값
(`recruitmentStatus`)이다. 화면에서는 둘 다 "모집 상태" 로 같은 뱃지를 쓴다.

모집 상태는 노출 여부(`visibility`)와 다른 것이라 합치면 안 된다 — 모집이 끝난 과정을 지면에
남겨 둘 수도, 모집 중인데 내릴 수도 있다.

`source` 와 `reviewStatus` 규칙은 채용공고와 같다. 크롤링 수집분의 `reviewStatus` 는 `null` 이다.

### `GET /api/v1/admin/bootcamps/{bootcampId}`

**응답** — 요약 + `content` `eligibilityAndSelectionProcess` `applicationMethod`
`applicationUrl` `managerEmail` `inquiryUrl` `publicationStartAt` `publicationEndAt` `sourceUrl`
`partners[]` `curriculums[]`. `tuitionAmount` `capacity` 는 요약에 이미 있다.

### `PATCH /api/v1/admin/bootcamps/{bootcampId}`

**부르는 곳** — 상세와 검수 화면의 "내용 수정" 저장.

**부르는 곳** — 목록의 노출 토글, 상세의 "운영 값 수정" 저장, 상세와 검수 화면의 "내용 수정"
저장.

**요청** — `title` `fields` `visibility` `reviewStatus`. **채용공고와 같다.** `source` 는
스펙(`UpdateAdminBootcampRequest`) 에 없다.

허용 칸: `content` `eligibilityAndSelectionProcess`

**동작** — 채용공고의 `PATCH` 와 규칙이 같다. 부분 수정이고, `source` 는 버리고, `reviewStatus` 의
`REJECTED` 는 400 이고, 반려가 풀리면 반려 기록도 지운다.

커리큘럼과 파트너사는 구조가 있는 값이라 이 API 로 고치지 않는다.

### `DELETE /api/v1/admin/bootcamps/{bootcampId}`

채용공고 삭제와 같다.

### 목과 백엔드 스펙의 차이

목의 응답은 생성 모델 `AdminBootcampSummaryResponse`, `AdminBootcampDetailResponse` 로 맞췄다.
채용공고 절의 `reviewStatus`, `PATCH` 요청, `DELETE` 차이는 부트캠프도 같다. 그 밖의 차이다.

| 항목                 | 백엔드 스펙                                                        | 목                                                                                |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| 모집 상태            | 저장된 `status` 를 그대로 준다. 계산한 `recruitmentStatus` 는 없다 | 계산해 싣던 `recruitmentStatus` 를 뺐다. 목록·상세 화면은 `status` 를 보여 준다   |
| 모집 상태 필터       | 쿼리 `status`. `DRAFT` 는 400                                      | 쿼리 이름을 `recruitmentStatus` 에서 `status` 로 바꿨다. `DRAFT` 도 거르기만 한다 |
| `bookmarked`         | 없다                                                               | 뺐다                                                                              |
| 요약의 상세 칸       | 요약 응답에 `applicationMethod` 등 상세 칸이 없다                  | 사용자 픽스처에서 따라오던 상세 칸을 목록 응답에서 뺐다                           |
| `PATCH` 의 `content` | 비울 수 없다. 빈 문자열이면 400                                    | 빈 문자열이면 칸을 비운다                                                         |
| 없는 id              | 404 `BOOTCAMP_NOT_FOUND`                                           | 404 `NOT_FOUND`                                                                   |

---

## 4. 콘텐츠 · 사이드·스터디

**이 도메인은 백엔드에 아직 없다.** `ogonggo-core` 의 `StudyPackage.kt` 는 주석 하나뿐이다.
아래 칸이 그 도메인이 가져야 할 칸이고, 목은 사용자 웹의 사이드·스터디 픽스처에 등록일을
얹어 쓴다.

### `GET /api/v1/admin/side-studies`

**부르는 곳** — `/content/side-studies` 진입, 검색·필터·정렬·페이지 변경.

**쿼리 파라미터**

| 이름      | 값                             | 비고                               |
| --------- | ------------------------------ | ---------------------------------- |
| `page`    | 1부터                          | 기본 1                             |
| `size`    | 정수                           | 기본 20                            |
| `keyword` | 문자열                         | **제목 + 모집장 닉네임** 부분 일치 |
| `kind`    | `SIDE_PROJECT` · `STUDY`       |                                    |
| `sort`    | `REGISTERED_AT` · `VIEW_COUNT` | 기본 `REGISTERED_AT`               |

`keyword` 가 보는 칸은 `title` 과 `authorNickname` 둘이다. 본문(`content`)은 보지 않는다.

**응답 `data.items[]`** — 사이드·스터디 항목 + `registeredAt`.

```json
{
  "id": 1,
  "kind": "SIDE_PROJECT",
  "operationType": "ONLINE",
  "authorNickname": "문서정리봇",
  "title": "개발자 회고 모아보는 큐레이션 서비스 팀원 구합니다",
  "positions": ["프론트엔드", "백엔드"],
  "techStack": ["React", "TypeScript", "Spring"],
  "recruitmentStartAt": "2026-09-09T00:00:00Z",
  "recruitmentEndAt": "2026-10-17T00:00:00Z",
  "capacity": 5,
  "appliedCount": 2,
  "closed": false,
  "viewCount": 412,
  "commentCount": 3,
  "registeredAt": "2026-08-30T14:20:00Z"
}
```

**동작**

필터는 AND 다. `kind` 는 정확히 일치하는 것만 남긴다.

정렬 기본은 등록일 역순. `VIEW_COUNT` 는 조회 수 내림차순이고 동률이면 등록일 역순으로
되돌린다 — 기준이 하나뿐이면 같은 조회 수 행들의 순서가 요청마다 달라진다. 채용공고·부트캠프와
같은 `sort` 값을 쓴다.

**`registeredAt` 은 모집 시작·마감과 다른 값이다.** 글이 올라온 시각이고, 목록의 기본 정렬
기준이다.

페이지는 1부터 세고 마지막을 넘어가면 빈 `items` 를 준다(공통 규칙). `page`·`size` 가 정수가
아니거나 1 보다 작으면 기본값으로 되돌린다.

**목은 목록에도 상세 칸을 그대로 싣는다.** 채용공고·부트캠프는 목록에서 본문 칸을 빼는데
(2·3절), 사이드·스터디 목은 사용자 픽스처를 그대로 넘겨 `content`·`shortDescription`·
`eligibility` 까지 함께 나간다. 백엔드는 다른 둘과 같이 **목록에서 본문을 빼는 편이 맞다** —
화면이 목록에서 쓰는 칸은 위 예시가 전부다.

`bookmarked` 는 사용자 화면의 칸이라 어드민에서는 뜻이 없다. 목이 사용자 픽스처를 공유해 남아
있을 뿐이고, 백엔드 응답에는 넣지 않는다.

### `GET /api/v1/admin/side-studies/{postId}`

**부르는 곳** — `/content/side-studies/{id}` 진입.

**응답** — 목록 항목 + `recruitmentStartAt` `contactMethod` `expectedDuration`(선택)
`shortDescription` `content` `eligibility`(선택) `applicationUrl`(선택).

**동작** — 읽기 전용이다. **내용 수정은 없다** — 사용자가 쓴 모집 글이라 운영자가 고치지
않는다. 문제가 있으면 지운다.

없는 `postId` 는 404 `NOT_FOUND`, `message` 는 `사이드·스터디 글을 찾을 수 없습니다.`

### `DELETE /api/v1/admin/side-studies/{postId}`

**부르는 곳** — 상세 화면의 삭제. 제목을 그대로 입력해야 열린다.

**응답** — `data` 는 지운 id 하나뿐이다. 화면은 값을 쓰지 않고 목록으로 되돌아간다.

```json
{ "id": 12 }
```

없는 `postId` 는 404 `NOT_FOUND`, `message` 는 목록·상세와 같은
`사이드·스터디 글을 찾을 수 없습니다.`

**삭제의 의미는 아직 정해지지 않았다.** 목은 배열에서 빼기만 해서 새로고침하면 되돌아온다.
지우는 것인지 감추는 것인지, 작성자에게 알리는지, 되돌릴 수 있는지가 전부 열려 있다
(아래 "넘길 때 함께 정할 것"). 화면은 어느 쪽이든 같지만, 되돌릴 길이 생기면 화면에도 붙인다.

---

## 5. 광고 · 검수 대기

### `GET /api/v1/admin/review-queue`

**부르는 곳** — `/content/review` 진입.

**응답 `data`** — 배열. **페이지를 나누지 않는다.**

```json
[
  {
    "type": "JOB",
    "id": 693,
    "title": "...",
    "companyName": "한국후지필름",
    "registeredAt": "2026-09-10T10:48:00Z",
    "sourceUrl": "https://...",
    "meta": [
      { "label": "고용 형태", "value": "계약직" },
      { "label": "지역", "value": "서울 본사" },
      { "label": "모집 마감", "value": "2026-09-14" }
    ],
    "sections": [{ "field": "responsibilities", "label": "주요 업무", "body": "..." }]
  }
]
```

**동작**

**대상은 `source = COMPANY` 이고 `reviewStatus = PENDING` 인 채용공고와 부트캠프뿐이다.**
비즈니스 회원(기업회원)이 올린 공고만 검수한다.

**크롤러 수집분은 이 큐에 오지 않는다.** 크롤러가 등록하는 공고는 등록 시점에 게시 상태가 되고
`reviewStatus` 는 `null` 이다(BE `3467f4a`, LC-3352). 같은 공고를 다시 수집해도 게시 상태를
건드리지 않는다 — 전에는 승인·반려된 것을 검수 대기로 되돌리고 게시 중이면 숨겼다.

**서버가 종류 차이를 미리 없앤다.** 채용공고는 본문 칸이 일곱 개고 부트캠프는 소개와
커리큘럼인데, 검수하는 사람이 보는 것은 "제목·회사·본문·원문"으로 같다. 화면이
`type === 'JOB'` 으로 갈라지기 시작하면 키보드 흐름이 종류마다 어긋난다.

`meta[].value` 는 **한국어로 풀어서** 준다(`CONTRACT` 가 아니라 `계약직`). 화면은 `meta` 를
그대로 그리므로, 화면에서 풀려면 어떤 칸이 enum 이고 어떤 칸이 이미 평문인지 알아야 하고
그러면 종류별 분기가 다시 생긴다.

`sections[].field` 는 **콘텐츠의 실제 칸 이름**이다. 검수 화면에서 본문을 고칠 때 이 이름으로
`PATCH /jobs/{id}` 에 되돌려 보낸다. 고칠 수 없는 섹션(부트캠프 커리큘럼처럼 구조가 있는 값)은
빈 문자열로 준다.

**정렬은 등록일 오래된 순이다.** 밀린 것부터 처리하는 것이 큐의 뜻이고, 최신순이면 오래된
건이 영영 아래에 남는다.

페이지를 나누지 않는 이유는 운영자가 `A`/`D` 로 앞뒤를 오가기 때문이다. 경계에서 다음 페이지를
기다리면 흐름이 끊긴다. 큐가 수백 건이 되면 그때 나눈다.

### `PATCH /api/v1/admin/review-queue/{type}/{id}`

`{type}` 은 `job` · `bootcamp`.

**부르는 곳** — 검수 화면에서 전부 판정한 뒤 "저장하기". **판정 하나마다 부르지 않는다** —
화면이 모아 두었다가 순차로 보낸다.

**요청**

```json
{ "decision": "REJECTED", "reason": "급여 조건이 비어 있습니다. 채우고 다시 등록해 주세요." }
```

**동작**

`decision` 이 `REJECTED` 인데 `reason` 이 비어 있으면 **400**. 사유 없는 반려는 올린 사람이
무엇을 고쳐야 하는지 알 수 없어 같은 글이 다시 올라온다. 화면에서도 막지만 서버도 막아야
한다 — 화면만 막으면 규칙이 화면에만 있게 된다.

`APPROVED` 면 반려 기록을 지운다. `REJECTED` 면 반려 기록을 남긴다(같은 대상을 다시 반려하면
사유만 교체).

**사유는 올린 회원에게 전달되어야 한다.** 그 경로(메일·알림)는 백엔드가 정한다. 목은 기록만
하고 보내지 않는다.

**응답** — `{ "type": "JOB", "id": 693, "reviewStatus": "REJECTED", "remaining": 14 }`
(`AdminReviewDecisionResponse`)

### `PATCH /api/v1/admin/review-queue/{type}/{id}/undo`

**부르는 곳** — 화면의 "되돌리기". 저장 전에는 화면 안에서만 처리되므로 **저장한 뒤 되돌릴 때**
쓰인다.

**동작** — `reviewStatus` 를 `PENDING` 으로 되돌리고 반려 기록을 지운다.

**응답** — 판정과 같은 `AdminReviewDecisionResponse`. `reviewStatus` 는 `PENDING` 이다.

키 하나로 통과되는 화면이라 오조작이 실제로 일어난다. 되돌릴 길이 없으면 운영자는 매 건 손을
멈추고 확인하게 되고, 그러면 키보드 흐름을 만든 이유가 사라진다.

### 목과 백엔드 스펙의 차이

목(`packages/api/src/mocks/admin/review.ts`) 의 응답·요청은 생성 모델
`AdminReviewItemResponse`, `DecideReviewRequest`, `AdminReviewDecisionResponse` 로 맞췄다.

| 항목                         | 백엔드 스펙                                                                           | 목                                          |
| ---------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------- |
| 되돌리기 응답 `reviewStatus` | 있다                                                                                  | 없던 것을 더했다                            |
| `decision` 값                | 스키마 enum 은 `PENDING` · `APPROVED` · `REJECTED`, 설명은 `APPROVED` 또는 `REJECTED` | `REJECTED` 가 아니면 모두 승인으로 처리한다 |
| 판정과 노출                  | 승인하면 곧바로 노출, 반려하면 비노출. 되돌리면 비노출                                | 노출을 바꾸지 않는다                        |
| 크롤링 수집분                | 409 `CONTENT_NOT_REVIEWABLE`                                                          | 거르지 않는다                               |
| 없는 대상                    | 404 `JOB_NOT_FOUND` 또는 `BOOTCAMP_NOT_FOUND`                                         | 404 `NOT_FOUND`                             |

`meta` 와 `sections` 의 라벨은 스펙이 정하지 않는 값이다. 2026-09-18 로컬 백엔드 응답에서는
채용공고 `meta` 가 고용 형태·경력·지역·모집 마감, 부트캠프 `meta` 가 진행 방식·수강료·교육 기간·모집
마감이고 부트캠프 `content` 섹션 라벨이 "상세 내용" 이었다. 목은 채용공고 고용 형태·지역·모집 마감,
부트캠프 프로그램 유형·진행 방식·수강료, 섹션 라벨 "소개" 를 그대로 둔다.

---

## 6. 광고 · 반려 보관

### `GET /api/v1/admin/rejections`

**쿼리** — `page` `size`, `keyword`(**제목 + 회사명 + 사유**), `type`(`JOB` · `BOOTCAMP`).

**응답 `data.items[]`**

```json
{
  "type": "JOB",
  "id": 512,
  "title": "Content Specialist (Editing)",
  "companyName": "뱅크",
  "reason": "급여 조건이 비어 있습니다. 채우고 다시 등록해 주세요.",
  "rejectedAt": "2026-09-06T02:34:00Z",
  "reasonUpdatedAt": "2026-09-10T07:26:00Z",
  "contentExists": true
}
```

**동작**

**반려 기록은 콘텐츠의 `reviewStatus` 와 별도 테이블이다.** 사유는 콘텐츠의 속성이 아니라
"운영자가 올린 사람에게 보낸 말"이고, 같은 글이 고쳐져 다시 올라오면 새 판정과 새 사유가
붙는다.

정렬은 **최근 반려가 먼저**다. 보관함은 방금 무엇을 돌려보냈는지 확인하러 오는 곳이다.

`contentExists` 는 그 콘텐츠가 아직 남아 있는지다. 반려 후 삭제된 건도 목록에 남기고 이 값으로
표시한다.

`keyword` 가 **사유까지** 뒤진다. "급여" 로 검색해 같은 이유로 돌려보낸 건들을 모아 보는 것이
이 화면의 쓰임이다.

### `PATCH /api/v1/admin/rejections/{type}/{id}`

**부르는 곳** — 목록 행의 "사유 수정" → 저장.

**요청** — `{ "reason": "고친 사유" }`

**동작** — 빈 사유는 **400**. 지우는 길은 없다.

`reasonUpdatedAt` 을 갱신한다. 화면이 반려일 아래에 "사유 수정 …" 으로 함께 보여준다.

**고친 사유도 올린 회원에게 다시 전달되어야 한다.** 급하게 보낸 사유가 불친절했거나 사실과
달랐을 때 다시 설명할 길이 이것뿐이다.

**응답** — 고친 반려 기록 한 건(`AdminRejectionResponse`). 목록 항목과 같은 모양이고
`contentExists` 를 포함한다.

### 목과 백엔드 스펙의 차이

목(`packages/api/src/mocks/admin/rejections.ts`) 의 응답·요청은 생성 모델
`AdminRejectionResponse`, `UpdateRejectionReasonRequest` 로 맞췄다.

| 항목                           | 백엔드 스펙                  | 목                                                                  |
| ------------------------------ | ---------------------------- | ------------------------------------------------------------------- |
| 사유 수정 응답 `contentExists` | 있다                         | 없던 것을 더했다                                                    |
| 삭제된 콘텐츠의 반려 기록      | 남기고 `contentExists=false` | 콘텐츠를 삭제할 때 반려 기록도 지워서 `false` 인 행이 생기지 않는다 |
| 없는 반려 기록                 | 404 `REJECTION_NOT_FOUND`    | 404 `NOT_FOUND`                                                     |

---

## 7. 회원

일반 회원과 비즈니스 회원은 백엔드에서 같은 `users` 테이블을 `UserRole`(`USER` · `COMPANY`)로
나눈 것이지만, 목록 칸이 서로 달라 화면과 API 가 둘로 갈린다.

**네 API 가 전부 읽기다.** 콘솔은 회원 상태를 바꾸지 않는다 — 제재는 운영자가 DB 쿼리로 걸고
화면은 결과만 보여준다. 상태를 바꾸는 API 를 만들지 않는다.

### `GET /api/v1/admin/members/users`

**부르는 곳** — `/members/users` 진입, 검색·필터·페이지 변경.

**쿼리 파라미터**

| 이름               | 값                                   | 비고                          |
| ------------------ | ------------------------------------ | ----------------------------- |
| `page`             | 1부터                                | 기본 1                        |
| `size`             | 정수                                 | 기본 20                       |
| `keyword`          | 문자열                               | **닉네임 + 이메일** 부분 일치 |
| `status`           | `ACTIVE` · `WITHDRAWN` · `SUSPENDED` |                               |
| `joinedWithinDays` | `7d` · `30d` · `90d`                 | 가입 기간                     |

**정렬 파라미터는 없다.** 가입일 내림차순 하나로 고정이고 화면에도 정렬 컨트롤이 없다.

**응답 `data.items[]`**

```json
{
  "id": 1,
  "nickname": "취준생김씨",
  "email": "minsu.kim@example.com",
  "joinedAt": "2026-09-19T08:12:00Z",
  "status": "ACTIVE",
  "lastAccessedAt": "2026-09-21T01:40:00Z"
}
```

**동작**

필터는 전부 AND 다. `status` 는 정확히 일치하는 것만 남긴다.

`joinedWithinDays` 는 **지금부터 7·30·90×24시간 전까지의 이동 창**이다. 달력 주나 달이 아니다.
대시보드의 `newMembersThisWeek` 가 `7d` 와 같은 계산이어야 카드 숫자와 목록 건수가 맞는다.

**세 값 밖의 `joinedWithinDays` 는 거르지 않고 전체를 준다.** 목이 그렇게 한다. 모르는 값으로
0건을 내면 운영자는 그 기간에 가입자가 없다고 읽는다.

`lastAccessedAt` 은 한 번도 접속하지 않은 회원에게 **칸 자체가 없다.** `null` 이 아니다.

정렬은 `joinedAt` 내림차순. 페이지는 1부터 세고 마지막을 넘어가면 빈 `items` 를 준다(공통
규칙). `page`·`size` 가 정수가 아니거나 1 보다 작으면 기본값으로 되돌린다.

### `GET /api/v1/admin/members/users/{memberId}`

**부르는 곳** — `/members/users/{id}` 진입.

**응답** — 목록 항목 + 활동.

```json
{
  "bookmarkedJobs": [{ "id": 1, "title": "...", "companyName": "...", "viewCount": 100 }],
  "bookmarkedBootcamps": [
    { "id": 1, "title": "...", "companyName": "...", "status": "RECRUITING" }
  ],
  "authoredSideStudies": [
    {
      "id": 1,
      "title": "...",
      "kind": "STUDY",
      "appliedCount": 5,
      "capacity": 8,
      "closed": false,
      "viewCount": 100
    }
  ]
}
```

**동작**

기본 정보와 활동을 **한 요청으로** 준다. 셋으로 나누면 화면이 세 번 흔들린다.

**탈퇴 회원은 세 배열이 모두 비어 있다.** 탈퇴하면 작성 글과 북마크가 지워지는 것이 이
서비스의 전제다.

없는 `memberId` 는 404 `NOT_FOUND`, `message` 는 `회원을 찾을 수 없습니다.`

### `GET /api/v1/admin/members/companies`

**부르는 곳** — `/members/companies` 진입, 검색·필터·페이지 변경.

**쿼리 파라미터** — 일반 회원 목록과 같다. `keyword` 의 대상 칸만 다르다.

| 이름               | 값                                   | 비고                            |
| ------------------ | ------------------------------------ | ------------------------------- |
| `page`             | 1부터                                | 기본 1                          |
| `size`             | 정수                                 | 기본 20                         |
| `keyword`          | 문자열                               | **회사명 + 담당자명** 부분 일치 |
| `status`           | `ACTIVE` · `WITHDRAWN` · `SUSPENDED` |                                 |
| `joinedWithinDays` | `7d` · `30d` · `90d`                 | 가입 기간                       |

**`managerEmail` 은 검색 대상이 아니다.** 일반 회원은 이메일로 찾는데 비즈니스 회원은 찾지
못한다. 목이 그렇게 하고 있을 뿐 의도한 차이가 아니므로, 백엔드에 넘길 때 담당자 이메일을
넣을지 정한다.

**정렬 파라미터는 없다.** 가입일 내림차순 고정이다.

**응답 `data.items[]`** — `id` `companyName` `businessRegistrationNumber` `managerName`
`managerEmail` `jobPostingCount` `joinedAt` `status`.

**동작** — `jobPostingCount` 는 그 회사가 등록한 채용공고 수다. 게시 상태를 가리지 않는다.
**아래 상세가 주는 `jobs` 배열의 길이와 반드시 같아야 한다** — 목록은 7건인데 상세는 0건인
상태가 되면 화면이 조인을 제대로 하는지 확인할 수 없다. 목은 두 곳에서 같은 조건
(`source = COMPANY` 이고 회사명이 같은 공고)으로 세어 이 성질을 지킨다.

페이지 규칙은 일반 회원 목록과 같다.

### `GET /api/v1/admin/members/companies/{memberId}`

**부르는 곳** — `/members/companies/{id}` 진입.

**응답** — 목록 항목 + `jobs[]`.

```json
{
  "jobs": [
    {
      "id": 512,
      "title": "...",
      "visibility": "VISIBLE",
      "reviewStatus": "PENDING",
      "registeredAt": "2026-08-20T09:00:00Z",
      "viewCount": 873
    }
  ]
}
```

**동작**

**목은 회사명으로 잇는다.** `source = COMPANY` 이면서 `companyName` 이 그 회원의 회사명과
똑같은 공고를 모은다. 픽스처에 회사 id 가 없어서 그렇게 했을 뿐이고, **백엔드에는 외래키가
있을 자리이므로 회원 id(`companyId`)로 잇는다.** 회사명은 동명이거나 표기가 바뀌면 어긋난다.

`jobs` 는 정렬 파라미터도 페이지도 없다. 한 회사의 공고 전부를 그대로 준다. 화면은 이 배열에서
검수 대기 건수와 노출 중 건수를 직접 세어 요약으로 보여준다.

없는 `memberId` 는 404 `NOT_FOUND`, `message` 는 `비즈니스 회원을 찾을 수 없습니다.`

---

## 8. 고객 지원 · 공지사항

**백엔드가 있다.** 아래는 배포된 `ogonggo-api-admin` 의 `/v3/api-docs`(2026-09-23 조회)와
`ogonggo-BE` 의 공지 도메인을 읽고 적은 것이고, 목 핸들러(`packages/api/src/mocks/admin/notices.ts`)를
거기에 맞췄다. 다른 절과 순서가 반대다 — 이 절만 목이 스펙을 따라갔다.

**공지는 노출 여부 하나로 관리한다.** 게시 기간(`publicationStartAt`·`publicationEndAt`)과
`active` 는 백엔드가 생기기 전 화면이 지어낸 칸이고 실제 스키마에 없다.

**본문은 Lexical EditorState JSON 문자열이다.** 백엔드는 JSON 으로 읽히는지와 200,000자
이하인지만 본다(`LexicalEditorStateValidator`). 어드민 화면은 편집기 없이 평문 칸을 두고
저장·조회 때 변환한다(`.claude/tasks/memos/결정-어드민-공지-본문-에디터-2026-09-23.md`).

### `GET /api/v1/admin/notices`

**부르는 곳** — `/support/notices` 진입, 페이지 이동.

**쿼리 파라미터** — `page`(기본 1), `size`(기본 20, 1~100), `keyword`, `visibility`, `pinned`.
**화면은 `page` 만 보낸다.** 공지가 수십 건을 넘지 않아 검색 상자와 필터 줄을 두지 않았다.

**응답 `data`** — `items` 와 `pageInfo`. 목록에는 본문이 없다.

```json
{
  "items": [
    {
      "id": 1,
      "title": "개인정보 처리방침 개정 안내",
      "pinned": true,
      "visibility": "VISIBLE",
      "registeredAt": "2026-09-20T04:11:17Z",
      "updatedAt": "2026-09-21T04:11:17Z"
    }
  ],
  "pageInfo": { "pageNum": 1, "pageSize": 20, "totalElements": 4, "totalPages": 1 }
}
```

**동작**

**정렬은 고정된 것이 먼저, 그다음 최신순이다.** 서버가 정렬해서 준다 — 화면은 받은 순서를
그대로 그린다.

**`visibility` 로 거르지 않는다.** 비노출 공지도 목록에 그대로 나오고 화면이 뱃지로 구분한다.
운영자 화면이라 내려간 공지도 보여야 한다. 삭제된 공지는 나오지 않는다.

`keyword` 는 제목에서 대소문자를 가리지 않는 부분 일치다. 필터는 모두 AND 로 묶이고, 보내지
않거나 빈 값을 보내면 그 조건을 적용하지 않는다.

### `GET /api/v1/admin/notices/{noticeId}`

**부르는 곳** — 목록 행 클릭. **목록에 본문이 없어서 반드시 부른다.** 행의 값으로 폼을 채우던
예전 화면과 달라진 점이다.

**응답 `data`** — 목록 요약에 `content` 가 붙은 모양이다.

```json
{
  "id": 1,
  "title": "개인정보 처리방침 개정 안내",
  "content": "{\"root\":{\"type\":\"root\",\"children\":[]}}",
  "pinned": true,
  "visibility": "VISIBLE",
  "registeredAt": "2026-09-20T04:11:17Z",
  "updatedAt": "2026-09-21T04:11:17Z"
}
```

없거나 삭제된 `noticeId` 는 404 `NOTICE_NOT_FOUND`, `message` 는 `공지사항을 찾을 수 없습니다.`

### `POST /api/v1/admin/notices` · `PATCH /api/v1/admin/notices/{noticeId}`

**부르는 곳** — "새 공지" 저장, 수정 폼 저장.

**요청** — `title` `content` `pinned` `visibility`. `POST` 는 넷 다 필수고, `PATCH` 는 모두
선택이라 보낸 값만 바뀐다. 화면은 폼이 네 칸을 모두 들고 있어 `PATCH` 에도 넷을 모두 보낸다.

**응답** — 둘 다 상세와 같은 모양을 돌려준다. `POST` 는 201, `PATCH` 는 200.

**동작**

검증에 걸리면 400 `BAD_REQUEST` 와 한국어 `message`.

| 조건                  | 문구                                         |
| --------------------- | -------------------------------------------- |
| 제목이 비었음         | `제목을 입력해 주세요.`                      |
| 제목이 255자 초과     | 필드 이름이 붙은 검증 문구                   |
| 본문이 JSON 이 아님   | `에디터 내용 JSON 형식이 올바르지 않습니다.` |
| 본문이 200,000자 초과 | `본문 JSON은 200000자 이하여야 합니다.`      |

**상단 고정은 개수를 제한하지 않는다.** 여러 공지를 동시에 고정할 수 있고, 고정을 새로 걸어도
다른 공지가 풀리지 않는다(`Notice.pin`). 예전 목이 검사하던 "동시에 하나만" 과 풀린 공지를
알려 주던 `unpinnedNoticeTitle` 은 백엔드에 없어서 화면·목·이 문서에서 모두 지웠다.

`visibility` 가 `VISIBLE` 이면 곧바로 사용자에게 노출된다. 노출과 고정은 별개라 비노출 공지를
고정해 두면 다시 노출할 때 고정된 채로 나온다.

없는 `noticeId` 로 `PATCH` 하면 404 `NOTICE_NOT_FOUND`.

### `DELETE /api/v1/admin/notices/{noticeId}`

**부르는 곳** — 수정 폼의 삭제. 문구를 그대로 입력해야 열린다(`ConfirmDelete`).

**동작** — 소프트 삭제다. 목록과 상세에서 사라지고, 같은 id 를 다시 지워도 성공하며 최초 삭제
일시를 유지한다. 응답 `data` 는 없다.

한 번도 없던 `noticeId` 는 404 `NOTICE_NOT_FOUND`.

### 목과 백엔드 스펙의 차이

목은 위 동작을 그대로 흉내 낸다. 남은 차이는 두 가지다.

**길이 제한을 검사하지 않는다.** 제목 255자와 본문 200,000자는 목이 통과시킨다. 화면에서 그
길이를 칠 일이 없어 두지 않았다.

**`id` 를 목이 정한다.** 배열에서 가장 큰 `id` 에 1 을 더한다. 목을 다시 띄우면 처음부터
시작하므로 실서버의 `id` 와 이어지지 않는다.

---

## 넘길 때 함께 정할 것

**삭제를 soft delete 로 둘지.** 화면은 어느 쪽이든 같지만, 되돌릴 길이 생기면 화면에도 붙이는
편이 낫다.

**반려 사유를 올린 회원에게 어떻게 보낼지.** 메일인지 알림인지. 목은 기록만 하고 보내지 않는다.

**비즈니스 회원과 공고를 잇는 키.** 목은 회사명으로 잇지만 백엔드에는 `companyId` 가 있을
자리다.

**`ADMIN` 역할을 주는 경로.** 인증 자체는 붙었다(위 "공통"의 인증). 남은 것은 역할을 누가
어떻게 주느냐로, 지금은 운영자가 DB 에서 `users.role` 을 직접 바꾼다 — 부여 API 도 화면도 없고
부여 이력·감사 기록은 미정이다(`ogonggo-BE/docs/architecture/authentication.md` 8절).
