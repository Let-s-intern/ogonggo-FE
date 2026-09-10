# 어드민 콘솔 API 명세

> 작성일: 2026-09-10
> 대상 백엔드: `ogonggo-BE/ogonggo-api-admin`
> 근거: `packages/api/src/mocks/admin/` 의 MSW 핸들러
> 관련 PRD: `.claude/tasks/todo/prd-admin-console.md`

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

**경로 접두사.** 모두 `/api/v1/admin/` 아래다. 크롤러가 쓰는 `/api/v1/internal/` 과 섞지 않는다 —
`internal` 은 API 키를 쓰고(`InternalApiKeyAuthenticationFilter.kt`) `admin` 은 관리자 세션을
쓸 자리라 인증 방식이 다르다.

**인증.** `UserRole.ADMIN` 을 가진 계정만. 콘솔 안에서의 추가 권한 구분은 없다. 지금
`AdminSecurityConfiguration.kt` 는 `/api/v1/internal/**` 외 전부를 `denyAll()` 로 닫고 있어,
이 API 들을 열려면 관리자 인증이 함께 붙어야 한다.

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

| #   | 페이지                       | 조작                        | 메서드 · 경로                                | 동작                               |
| --- | ---------------------------- | --------------------------- | -------------------------------------------- | ---------------------------------- |
| 1   | `/` 대시보드                 | 진입                        | `GET /dashboard/summary`                     | 처리할 일·오늘 유입 숫자를 한 번에 |
| 2   | `/content/jobs`              | 진입·검색·필터·정렬·페이지  | `GET /jobs`                                  | 목록. 파라미터를 실제로 반영       |
| 3   | `/content/jobs`              | 노출 토글                   | `PATCH /jobs/{id}`                           | `visibility` 만 바꿈               |
| 4   | `/content/jobs/{id}`         | 진입                        | `GET /jobs/{id}`                             | 상세                               |
| 5   | `/content/jobs/{id}`         | 운영 값 수정 → 저장         | `PATCH /jobs/{id}`                           | 노출·등록 경로·검수 상태           |
| 6   | `/content/jobs/{id}`         | 내용 수정 → 저장            | `PATCH /jobs/{id}`                           | 제목·본문 칸                       |
| 7   | `/content/jobs/{id}`         | 삭제 → 문구 입력            | `DELETE /jobs/{id}`                          | 삭제 후 목록으로                   |
| 8   | `/content/bootcamps`         | 진입·검색·필터·정렬         | `GET /bootcamps`                             | 목록                               |
| 9   | `/content/bootcamps/{id}`    | 진입                        | `GET /bootcamps/{id}`                        | 상세                               |
| 10  | `/content/bootcamps/{id}`    | 내용 수정 → 저장            | `PATCH /bootcamps/{id}`                      | 제목·본문·노출                     |
| 11  | `/content/bootcamps/{id}`    | 삭제                        | `DELETE /bootcamps/{id}`                     | 삭제 후 목록으로                   |
| 12  | `/content/side-studies`      | 진입·검색·필터              | `GET /side-studies`                          | 목록                               |
| 13  | `/content/side-studies/{id}` | 진입                        | `GET /side-studies/{id}`                     | 상세                               |
| 14  | `/content/side-studies/{id}` | 삭제                        | `DELETE /side-studies/{id}`                  | 삭제 후 목록으로                   |
| 15  | `/content/review`            | 진입                        | `GET /review-queue`                          | 검수 대기 전체 (페이지 없음)       |
| 16  | `/content/review`            | Space·Backspace 후 저장하기 | `PATCH /review-queue/{type}/{id}`            | 판정. 반려는 사유 필수             |
| 17  | `/content/review`            | 되돌리기                    | `PATCH /review-queue/{type}/{id}/undo`       | 대기로 되돌림                      |
| 18  | `/content/review`            | 내용 수정 → 저장            | `PATCH /jobs/{id}` · `PATCH /bootcamps/{id}` | 5·10과 같은 API                    |
| 19  | `/content/rejections`        | 진입·검색·필터              | `GET /rejections`                            | 반려 기록 목록                     |
| 20  | `/content/rejections`        | 사유 수정 → 저장            | `PATCH /rejections/{type}/{id}`              | 사유 교체. 비울 수 없음            |
| 21  | `/members/users`             | 진입·검색·필터              | `GET /members/users`                         | 목록                               |
| 22  | `/members/users/{id}`        | 진입                        | `GET /members/users/{id}`                    | 상세 + 활동                        |
| 23  | `/members/companies`         | 진입·검색·필터              | `GET /members/companies`                     | 목록                               |
| 24  | `/members/companies/{id}`    | 진입                        | `GET /members/companies/{id}`                | 상세 + 등록 공고                   |
| 25  | `/support/inquiries`         | 진입·검색·필터              | `GET /inquiries`                             | 목록                               |
| 26  | `/support/inquiries/{id}`    | 진입                        | `GET /inquiries/{id}`                        | 상세                               |
| 27  | `/support/inquiries/{id}`    | 답변 저장                   | `PATCH /inquiries/{id}`                      | 답변 필수. 상태 함께 바뀜          |
| 28  | `/support/notices`           | 진입                        | `GET /notices`                               | 전체 (페이지 없음)                 |
| 29  | `/support/notices`           | 새 공지 → 저장              | `POST /notices`                              | 고정은 하나만                      |
| 30  | `/support/notices`           | 행 클릭 → 저장              | `PUT /notices/{id}`                          | 고정은 하나만                      |

지면(`/placements`)과 통계(`/stats`)는 만들지 않는다. 메뉴에 회색 비활성으로 자리만 있다.

---

## 1. 대시보드

### `GET /api/v1/admin/dashboard/summary`

**부르는 곳** — `admin.ogonggo.co.kr/` 진입.

**응답 `data`**

```json
{
  "todo": { "jobsPendingReview": 15, "unansweredInquiries": 8 },
  "intake": {
    "jobsCrawledToday": 10,
    "bootcampsCrawledToday": 0,
    "jobsSubmittedToday": 2,
    "newMembersThisWeek": 5
  }
}
```

**동작**

숫자를 한 요청으로 준다. 카드마다 나누면 로딩이 여섯으로 쪼개져 그 사이 화면이 계속 흔들린다.

`jobsPendingReview` 는 채용공고와 부트캠프를 **합한** 수다. 둘 다 비즈니스 회원이 올린다.
`reviewStatus = PENDING` 인 것만 센다.

`unansweredInquiries` 는 `RECEIVED` + `IN_PROGRESS` 다. `ANSWERED` 는 세지 않는다.

`intake` 는 **오늘 00:00 이후** 등록된 것이다. 크롤링분과 비즈니스 등록분을 나눠 센다 —
합치면 "크롤링이 멈춘 것"과 "그날 아무도 안 올린 것"을 구분할 수 없다.

`newMembersThisWeek` 는 최근 7일 안에 가입한 일반 + 비즈니스 회원이다.

**카드 링크** — 각 숫자는 조건이 걸린 목록으로 간다. 서버가 관여하지 않지만 필터 파라미터가
아래 목록 API 와 맞아야 한다.

| 카드               | 이동                                                |
| ------------------ | --------------------------------------------------- |
| 검수 대기 공고     | `/content/jobs?reviewStatus=PENDING&source=COMPANY` |
| 미답변 문의        | `/support/inquiries?status=unanswered`              |
| 크롤링 채용공고    | `/content/jobs?source=CRAWLER`                      |
| 비즈니스 등록 공고 | `/content/jobs?source=COMPANY`                      |
| 이번 주 신규 회원  | `/members/users?joinedWithinDays=7d`                |

---

## 2. 콘텐츠 · 채용공고

### `GET /api/v1/admin/jobs`

**부르는 곳** — `/content/jobs` 진입, 검색·필터·정렬·페이지 변경.

**쿼리 파라미터**

| 이름           | 값                                  | 비고                        |
| -------------- | ----------------------------------- | --------------------------- |
| `page`         | 1부터                               | 기본 1                      |
| `size`         | 정수                                | 기본 20                     |
| `keyword`      | 문자열                              | **제목 + 회사명** 부분 일치 |
| `visibility`   | `VISIBLE` · `HIDDEN`                |                             |
| `source`       | `CRAWLER` · `COMPANY`               |                             |
| `reviewStatus` | `PENDING` · `APPROVED` · `REJECTED` |                             |
| `sort`         | `REGISTERED_AT` · `VIEW_COUNT`      | 기본 `REGISTERED_AT`        |

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
  "bookmarked": false,
  "viewCount": 3254,
  "bookmarkCount": 196,
  "commentCount": 20,
  "visibility": "HIDDEN",
  "source": "COMPANY",
  "reviewStatus": "PENDING",
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
  "source": "COMPANY",
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

**`source` 를 `CRAWLER` 로 바꾸면 `reviewStatus` 를 `null` 로 지운다.** 검수는 외부에서 올라온
글에만 있는 개념이라, 등록 경로가 크롤링인데 검수 상태가 남으면 목록의 검수 필터가 이상한
행을 집는다. 반대로 `COMPANY` 로 바꿨는데 검수 상태가 없으면 `PENDING` 으로 넣는다.

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

---

## 3. 콘텐츠 · 부트캠프

### `GET /api/v1/admin/bootcamps`

**부르는 곳** — `/content/bootcamps` 진입, 검색·필터·정렬.

**쿼리** — `page` `size` `sort`(채용공고와 같음), `keyword`(**과정명 + 운영사**),
`status`(`DRAFT` · `RECRUITING` · `CLOSED`).

**응답 `data.items[]`** — 부트캠프 요약 + `registeredAt` `source` `visibility` `reviewStatus`.

**동작**

`status` 는 **모집 상태**다. 노출 여부(`visibility`)와 다른 것이고 둘을 합치면 안 된다 —
모집이 끝난 과정을 지면에 남겨 둘 수도, 모집 중인데 내릴 수도 있다.

부트캠프도 비즈니스 회원이 올릴 수 있어 `source` 와 `reviewStatus` 를 갖는다. 규칙은 채용공고와
같다.

### `GET /api/v1/admin/bootcamps/{bootcampId}`

**응답** — 요약 + `content` `eligibilityAndSelectionProcess` `partners[]` `curriculums[]`
`applicationUrl` `sourceUrl` `managerEmail` `tuitionAmount` `capacity`.

### `PATCH /api/v1/admin/bootcamps/{bootcampId}`

**부르는 곳** — 상세와 검수 화면의 "내용 수정" 저장.

**요청** — `title` `fields` `visibility`.

허용 칸: `content` `eligibilityAndSelectionProcess`

**동작** — 채용공고의 `PATCH` 와 같다. 커리큘럼과 파트너사는 구조가 있는 값이라 이 API 로
고치지 않는다.

### `DELETE /api/v1/admin/bootcamps/{bootcampId}`

채용공고 삭제와 같다.

---

## 4. 콘텐츠 · 사이드·스터디

### `GET /api/v1/admin/side-studies`

**쿼리** — `page` `size` `sort`, `keyword`(**제목 + 모집장 닉네임**),
`kind`(`SIDE_PROJECT` · `STUDY`).

**응답 `data.items[]`** — 사이드·스터디 항목 + `registeredAt`.

**동작**

**이 도메인은 백엔드에 아직 없다.** `ogonggo-core` 의 `StudyPackage.kt` 는 주석 하나뿐이다.
이 API 의 칸이 그 도메인이 가져야 할 칸이다.

`registeredAt` 은 모집 시작·마감과 다른 값이다 — 글이 올라온 시각이고, 목록 정렬 기준이다.

### `GET /api/v1/admin/side-studies/{postId}` · `DELETE /api/v1/admin/side-studies/{postId}`

상세와 삭제. **내용 수정은 없다** — 사용자가 쓴 모집 글이라 운영자가 고치지 않는다. 문제가
있으면 지운다.

---

## 5. 콘텐츠 · 검수 대기

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

### `PATCH /api/v1/admin/review-queue/{type}/{id}/undo`

**부르는 곳** — 화면의 "되돌리기". 저장 전에는 화면 안에서만 처리되므로 **저장한 뒤 되돌릴 때**
쓰인다.

**동작** — `reviewStatus` 를 `PENDING` 으로 되돌리고 반려 기록을 지운다.

키 하나로 통과되는 화면이라 오조작이 실제로 일어난다. 되돌릴 길이 없으면 운영자는 매 건 손을
멈추고 확인하게 되고, 그러면 키보드 흐름을 만든 이유가 사라진다.

---

## 6. 콘텐츠 · 반려 보관

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

---

## 7. 회원

### `GET /api/v1/admin/members/users`

**쿼리** — `page` `size`, `keyword`(**닉네임 + 이메일**), `status`(`ACTIVE` · `WITHDRAWN` ·
`SUSPENDED`), `joinedWithinDays`(`7d` · `30d` · `90d`).

**응답 `data.items[]`** — `id` `nickname` `email` `joinedAt` `status` `lastAccessedAt`.

**동작** — 가입일 역순. `lastAccessedAt` 은 한 번도 접속하지 않았으면 없다.

### `GET /api/v1/admin/members/users/{memberId}`

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

콘솔은 회원 상태를 **바꾸지 않는다.** 제재는 운영자가 DB 쿼리로 걸고 화면은 결과만 보여준다.
상태를 바꾸는 API 를 만들지 않는다.

### `GET /api/v1/admin/members/companies`

**쿼리** — `page` `size`, `keyword`(**회사명 + 담당자명**), `status`, `joinedWithinDays`.

**응답 `data.items[]`** — `id` `companyName` `businessRegistrationNumber` `managerName`
`managerEmail` `jobPostingCount` `joinedAt` `status`.

**동작** — `jobPostingCount` 는 그 회사가 등록한 채용공고 수다. 게시 상태를 가리지 않는다.
**아래 상세가 주는 `jobs` 배열의 길이와 반드시 같아야 한다** — 목록은 7건인데 상세는 0건인
상태가 되면 화면이 조인을 제대로 하는지 확인할 수 없다.

### `GET /api/v1/admin/members/companies/{memberId}`

**응답** — 목록 항목 + `jobs[]`.

```json
{
  "jobs": [
    {
      "id": 512,
      "title": "...",
      "visibility": "VISIBLE",
      "reviewStatus": "PENDING",
      "registeredAt": "2026-08-20T...",
      "viewCount": 873
    }
  ]
}
```

**동작** — 목에서는 회사명으로 잇는다. **백엔드에는 외래키가 있을 자리이므로 `companyId` 로
바꾼다.** 화면은 이 배열에서 검수 대기 건수와 노출 중 건수를 직접 세어 요약으로 보여준다.

---

## 8. 고객 지원 · 문의

### `GET /api/v1/admin/inquiries`

**쿼리** — `page` `size`, `keyword`(**제목 + 작성자명**),
`status`(`RECEIVED` · `IN_PROGRESS` · `ANSWERED` · **`unanswered`**),
`category`(`SERVICE` · `JOB_POSTING` · `ACCOUNT` · `ADVERTISEMENT` · `ETC`).

**응답 `data.items[]`** — `id` `title` `authorName` `authorEmail` `category` `status` `createdAt`.

**동작**

**`status=unanswered` 는 특별한 값이다.** `RECEIVED` + `IN_PROGRESS` 를 뜻하고, 대시보드의
"미답변 문의" 카드가 이 값으로 링크해 온다. 드롭다운에는 없는 값이라 화면이 그 사실을 안내
문구로 알린다.

접수일 역순. 본문과 답변은 목록에 싣지 않는다.

### `GET /api/v1/admin/inquiries/{inquiryId}`

**응답** — 목록 항목 + `content` `answer` `answeredAt`.

### `PATCH /api/v1/admin/inquiries/{inquiryId}`

**부르는 곳** — 상세의 "답변 저장", "처리중으로 저장".

**요청** — `{ "answer": "…", "status": "IN_PROGRESS" }` (`status` 는 선택)

**동작**

빈 답변은 **400**. 실수로 저장을 눌러 답변이 사라지는 것을 막는 유일한 장치다.

`status` 를 주지 않으면 `ANSWERED` 로 바꾼다. 답변만 저장하고 상태는 그대로 두고 싶을 때가
있어 따로 받는다.

`answeredAt` 을 갱신한다.

**답변은 한 번 쓰면 수정만 되고 지워지지 않는다.** 지우는 API 를 만들지 않는다.

이 저장이 **대시보드의 미답변 수를 함께 바꾼다.** 화면은 저장 성공 시 문의와 대시보드 캐시를
모두 무효화한다.

---

## 9. 고객 지원 · 공지사항

### `GET /api/v1/admin/notices`

**부르는 곳** — `/support/notices` 진입.

**응답 `data`** — 배열. **페이지를 나누지 않는다.** 공지는 수십 건을 넘지 않고 고정 순서가
한눈에 보여야 한다.

```json
{
  "id": 1,
  "title": "개인정보 처리방침 개정 안내",
  "content": "...",
  "publicationStartAt": "2026-09-08",
  "publicationEndAt": "2026-10-08",
  "pinned": true,
  "active": true,
  "createdAt": "2026-09-07T..."
}
```

**동작** — 고정된 것이 먼저, 그다음 작성일 역순.

### `POST /api/v1/admin/notices` · `PUT /api/v1/admin/notices/{noticeId}`

**부르는 곳** — "새 공지" 저장, 목록 행 클릭 → 수정 저장.

**요청** — `title` `content` `publicationStartAt` `publicationEndAt`(선택) `pinned` `active`.

**동작**

검증. 어긋나면 400 과 화면에 그대로 보여줄 한국어 `message`.

| 조건             | 문구                                 |
| ---------------- | ------------------------------------ |
| 제목 없음        | `제목을 입력해 주세요.`              |
| 본문 없음        | `본문을 입력해 주세요.`              |
| 게시 시작일 없음 | `게시 시작일을 입력해 주세요.`       |
| 종료일 < 시작일  | `게시 종료일이 시작일보다 빠릅니다.` |

**상단 고정은 동시에 하나뿐이다.** `pinned: true` 로 저장하면 먼저 고정돼 있던 공지의 고정을
푼다. **그리고 무엇이 풀렸는지 응답에 실어 준다.**

```json
{ "notice": {}, "unpinnedNoticeTitle": "개인정보 처리방침 개정 안내" }
```

풀린 것이 없으면 `null`. 조용히 풀지 않는 이유는, 운영자가 새 공지를 고정한 뒤 앞의 공지가
왜 내려갔는지 모르는 상태가 되기 때문이다.

`pinned: false` 로 저장할 때는 아무것도 풀지 않는다.

`publicationEndAt` 이 없으면 무기한이다.

**본문 형식은 아직 정하지 않았다.** 지금은 평문이고 화면도 `textarea` 로 받는다. 마크다운이나
리치 텍스트로 정해지면 이 칸의 타입이 아니라 에디터가 바뀐다.

---

## 넘길 때 함께 정할 것

**삭제를 soft delete 로 둘지.** 화면은 어느 쪽이든 같지만, 되돌릴 길이 생기면 화면에도 붙이는
편이 낫다.

**반려 사유를 올린 회원에게 어떻게 보낼지.** 메일인지 알림인지. 목은 기록만 하고 보내지 않는다.

**비즈니스 회원과 공고를 잇는 키.** 목은 회사명으로 잇지만 백엔드에는 `companyId` 가 있을
자리다.

**문의를 누가 넣는지.** 로그인 회원만인지 비로그인도 되는지에 따라 `authorName` 의 필수 여부가
갈린다.

**관리자 인증.** `AdminSecurityConfiguration.kt` 가 지금 `/api/v1/internal/**` 외 전부를
`denyAll()` 로 닫고 있다. 이 API 들을 열려면 관리자 세션이 먼저 필요하다.
