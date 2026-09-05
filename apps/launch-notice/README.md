# 출시알림 신청 랜딩

2026년 9월 23일 ‘오늘의 공고’ 런칭 전까지만 쓰는 B2B 랜딩이다. 채용 담당자에게 출시 알림과
무료 홍보 신청을 받아 **포켓베이스**에 쌓고, 어드민에서 표로 보거나 CSV 로 내보낸다.

## 런칭 이후 지우는 법

1. 이 폴더(`apps/launch-notice`)를 지운다
2. Vercel 에서 이 앱의 프로젝트를 지운다
3. 서브도메인 DNS 레코드를 지운다
4. `apps/admin/src/pages/launch-notice/` 폴더를 지운다
5. `apps/admin/src/pages/home/ui/HomePage.tsx` 의 import 와 렌더 두 줄을 지운다
6. `.github/workflows/ci.yml` 의 `launch_notice` 줄들을 지운다
7. 포켓베이스 인스턴스를 내린다

**이 앱은 `packages/` 를 가져다 쓰지 않고, 다른 앱도 이 앱을 참조하지 않는다.** 스타일도
폰트도 자기 것만 쓴다(`src/app/landing.css`) — 공유하는 껍데기가 하나라도 생기면 지우는 순간
다른 앱이 깨진다. 어드민의 4~5번이 유일한 예외이고, 그래서 한 폴더와 두 줄이다.

## 환경변수

`.env.example` 참고.

| 이름                        | 무엇            |
| --------------------------- | --------------- |
| `POCKETBASE_URL`            | 포켓베이스 주소 |
| `POCKETBASE_ADMIN_EMAIL`    | 슈퍼유저 계정   |
| `POCKETBASE_ADMIN_PASSWORD` | 그 비밀번호     |

**셋 다 서버에서만 읽는다.** `NEXT_PUBLIC_` 을 붙이지 마라.

값이 없으면 폼은 그려지지만 제출이 500 으로 실패한다. 원인은 서버 로그에 남는다.

어드민은 `VITE_POCKETBASE_URL` 하나만 쓴다(`apps/admin/.env.example`). 그쪽은 주소만 알면
되고, 사람이 화면에서 로그인한다.

## 저장소

포켓베이스에 쌓는다. 구글 시트를 네 번 시도하고 접었다(2026-09-05) — 앱스 스크립트가 웹앱
컨텍스트·시트 ID·배포 권한·접근 권한에서 차례로 막혔고, 마지막은 회사 Workspace 정책이라
설정으로 뚫을 수 없었다. API 키는 애초에 쓰기가 안 된다(`401 API keys are not supported`).

### 띄우기

포켓베이스는 단일 실행 파일이다. 내려받아 실행하면 끝이다.

```bash
./pocketbase superuser upsert <이메일> <비밀번호>
./pocketbase serve
```

### 컬렉션 만들기

```bash
pnpm --filter launch-notice setup-db
```

`.env` 를 읽어 `launch_notice_applications` 컬렉션을 만들거나 필드를 맞춘다. 스키마가
코드에 있으므로(`scripts/setup-pocketbase.mjs`) 새 서버에 배포할 때 손으로 만들 필요가 없다.

규칙은 전부 슈퍼유저 전용이다. 이름·이메일·연락처가 들어가는 컬렉션이라 열어 두지 않는다 —
스크립트가 마지막에 인증 없는 조회가 403 인지 확인한다.

## 손으로 고치는 값

무료 홍보 슬롯은 `src/app/page.tsx` 의 `TAKEN_SLOTS` 다. 자리가 차면 로고를 `public/` 에 넣고
배열에 한 줄 더한다 — 남은 자리 수는 배열 길이에서 계산되므로 문구는 따로 안 고쳐도 된다.

시트에서 실시간으로 세지 않는다. 페이지를 열 때마다 서버 호출이 하나 느는 대가로 얻는 것이
일주일에 두어 번 바뀌는 숫자라서다.

## 개발

```bash
pnpm --filter launch-notice dev     # http://localhost:4100
```
