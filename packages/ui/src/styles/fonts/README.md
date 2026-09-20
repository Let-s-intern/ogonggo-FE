# 폰트 파일

## PretendardVariable.woff2

| 항목 | 값 |
|---|---|
| 버전 | Pretendard 1.3.9 |
| 받은 곳 | `https://unpkg.com/pretendard@1.3.9/dist/web/variable/woff2/PretendardVariable.woff2` |
| 크기 | 2,057,688 바이트 |
| 무게 축 | `font-weight: 45 920` |
| 라이선스 | SIL Open Font License 1.1 |

npm `pretendard` 패키지를 의존성으로 넣지 않고 파일만 받아 둔다. 패키지 전체는 97MB 이고
그 중 우리가 쓰는 것은 이 한 파일뿐이다.

## 이 한 부를 가리키는 곳

저장소가 가진 프리텐다드는 이 파일 하나뿐이다. 복사본은 없다. 세 곳이 모두 이 파일을 가리킨다.

| 쓰는 곳 | 방식 | 거는 파일 |
|---|---|---|
| `apps/web` | `next/font/local` | `apps/web/src/app/layout.tsx` |
| `apps/admin` | `@font-face` | `apps/admin/src/app/index.css` |
| 스토리북 | `@font-face` | `packages/ui/.storybook/preview.css` |

빌드 산출물(`apps/web/.next/`, `apps/admin/dist/`)에는 번들러가 해시를 붙여 복사한 파일이
생긴다. 그것들은 `.gitignore` 대상이라 저장소에 들어가지 않는다.

`@font-face` 두 곳의 패밀리 이름은 `../tokens.css` 의 `--font-sans` 가 부르는
`'Pretendard Variable'` 과 같다. `next/font/local` 은 패밀리 이름을 정하게 해주지 않아
web 에서만 이름이 다르다 — 자세한 사정은 `layout.tsx` 의 주석에 적었다.

버전을 올릴 때는 위 URL 의 버전 번호만 바꿔 같은 자리에 받고, 이 표의 버전과 크기를 함께 고친다.
