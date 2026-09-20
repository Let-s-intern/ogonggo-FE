# 디자인 시스템

디자인 시스템의 내용은 스토리북에 있다. 이 문서는 스토리북을 띄우는 법과, 스토리북이 옮겨 적은
원본 스크린샷이 어디 있는지만 적는다.

## 스토리북 띄우기

저장소 루트에서 다음을 친다.

```bash
pnpm storybook
```

`http://localhost:6006/` 이 열린다. 포트가 이미 쓰이고 있으면 다른 포트를 쓸지 물어본다.

안에 Foundations 네 장과 컴포넌트 23 개가 있다.

- Foundations/Colors — 파랑 13 단계, 회색 13 단계, 의미색 네 개
- Foundations/Typography — 타이포 12 단계
- Foundations/Radius — 모서리 반경 여섯 개
- Foundations/Icons — 저장소가 실제로 쓰는 아이콘

색 hex, 글자 크기, 모서리 반경은 스토리가 `getComputedStyle` 로 그 자리에서 읽어 보여준다.
값을 문서에 옮겨 적지 않았으므로 토큰을 고치면 스토리도 같이 바뀐다.

스토리 파일은 `packages/ui/src/foundations/` 와 `packages/ui/src/components/` 에 있고, 토큰
원본은 `packages/ui/src/styles/tokens.css` 한 파일이다.

## 원본 스크린샷

디자인에서 받은 그림. 스토리북의 값은 여기서 옮겨 적은 것이고, 일부러 다르게 넣은 자리는 그
스토리 안에 표시해 두었다.

| 파일                             | 내용                                |
| -------------------------------- | ----------------------------------- |
| `docs/image.png`                 | SECTION 01 Color Parameter System   |
| `docs/image-1.png`               | SECTION 03 Spacing Scale            |
| `docs/image-2.png`               | SECTION 04 Border Radius Scale      |
| `docs/image-3.png`               | SECTION 05 Verified Core Components |
| `docs/asset/v3-1/typography.png` | 타이포 12 단계                      |

`docs/image-1.png` 은 2026-09-21 까지 이 문서에서 `Typography System` 으로 적혀 있었다. 열어
보면 Spacing Scale 이고, 타이포 원본은 `docs/asset/v3-1/typography.png` 에 따로 있다. 네 장을
모두 열어 확인한 뒤 이름표를 고쳤다.

SECTION 02 에 해당하는 그림은 저장소에 없다.
