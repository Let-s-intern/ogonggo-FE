# 출시알림 신청 랜딩

2026년 9월 23일 ‘오늘의 공고’ 런칭 전까지만 쓰는 B2B 랜딩이다. 채용 담당자에게 출시 알림과
무료 홍보 신청을 받아 **구글 스프레드시트**에 쌓는다.

## 런칭 이후 지우는 법

1. 이 폴더(`apps/launch-notice`)를 지운다
2. Vercel 에서 이 앱의 프로젝트를 지운다
3. 서브도메인 DNS 레코드를 지운다
4. `apps/admin/src/pages/home/ui/HomePage.tsx` 의 시트 링크 블록을 지운다
5. `.github/workflows/ci.yml` 의 `launch_notice` 줄들을 지운다
6. 구글 서비스 계정을 지운다 (GCP 콘솔)

그 밖에 손댈 곳이 없어야 한다. **이 앱은 `packages/` 를 가져다 쓰지 않고, 다른 앱도 이 앱을
참조하지 않는다.** 스타일도 폰트도 자기 것만 쓴다(`src/app/landing.css`) — 공유하는 껍데기가
하나라도 생기면 지우는 순간 다른 앱이 깨진다. 4번이 유일한 예외이고, 그래서 한 줄이다.

## 환경변수

`.env.example` 참고. 로컬에서는 `.env` 또는 `.env.local` 에 넣는다.

| 이름                          | 무엇                                          |
| ----------------------------- | --------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | 서비스 계정 JSON 통째로 (한 줄)               |
| `LAUNCH_NOTICE_SHEET_ID`      | 시트 주소의 `/d/` 와 `/edit` 사이 44자 문자열 |

**둘 다 서버에서만 읽는다.** `NEXT_PUBLIC_` 을 붙이면 브라우저 번들에 들어가고, 그러면 개인
키가 그대로 노출된다.

값이 없으면 폼은 그려지지만 제출이 500 으로 실패한다. 원인은 서버 로그에 남는다.

## 시트 연결

**API 키로는 안 된다.** 구글 API 키는 "공개된 자원을 인증 없이 읽는" 용도라 시트에 쓰지
못한다 — `sheets.googleapis.com` 이 append 요청에 `401 API keys are not supported by this
API` 를 준다(2026-09-04 확인). 사람 없이 서버가 쓰려면 주체가 있는 자격증명, 즉 서비스
계정이 필요하다.

1. console.cloud.google.com → 프로젝트 선택 → **API 및 서비스 → 라이브러리** → `Google
Sheets API` 사용 설정
2. **IAM 및 관리자 → 서비스 계정 → 서비스 계정 만들기** (이름은 아무거나, 역할은 주지 않아도
   된다 — 권한은 시트 공유로 준다)
3. 만든 계정 → **키 → 키 추가 → 새 키 만들기 → JSON** → 파일이 받아진다
4. 그 파일 내용을 **한 줄로** `GOOGLE_SERVICE_ACCOUNT_JSON` 에 넣는다
5. 신청을 받을 스프레드시트를 열고, JSON 안의 `client_email`
   (`...@....iam.gserviceaccount.com`) 을 **편집자로 공유**한다. 이 단계를 빠뜨리면
   `Sheets API 403` 이 난다
6. 시트 주소의 `/d/` 와 `/edit` 사이 문자열을 `LAUNCH_NOTICE_SHEET_ID` 에 넣는다

신청은 `출시알림 신청` 이라는 이름의 탭에 쌓인다. **탭은 미리 만들어 둔다** — 없으면
`Sheets API 400 Unable to parse range` 가 난다. 머리글은 비어 있을 때 코드가 알아서 깐다.
첫 탭에 다른 데이터가 있어도 건드리지 않는다.

라이브러리(`googleapis`)를 쓰지 않는다. 이 한 가지 호출을 위해 들이기엔 크고, 필요한 것은
JWT 하나를 만들어 토큰으로 바꾸고 POST 하는 것뿐이라 Node 기본 `crypto` 로 충분하다
(`src/lib/sheets.ts`).

## 손으로 고치는 값

무료 홍보 슬롯은 `src/app/page.tsx` 의 `TAKEN_SLOTS` 다. 자리가 차면 로고를 `public/` 에 넣고
배열에 한 줄 더한다 — 남은 자리 수는 배열 길이에서 계산되므로 문구는 따로 안 고쳐도 된다.

시트에서 실시간으로 세지 않는다. 페이지를 열 때마다 서버 호출이 하나 느는 대가로 얻는 것이
일주일에 두어 번 바뀌는 숫자라서다.

## 개발

```bash
pnpm --filter launch-notice dev     # http://localhost:4100
```
