import type { ReactNode } from 'react';

/**
 * 사이드·스터디 레이아웃. `@modal` 슬롯에 모집글 작성 폼을 모달로 띄운다.
 *
 * 목록의 `모집글 쓰기` 는 `/mypage/posts/new` 로 가는 링크이고, `@modal/(..)mypage/posts/new` 가
 * 그 이동을 가로채 목록 위에 모달로 그린다. 마이페이지로 넘어가면 보던 목록을 잃어 흐름이
 * 끊겼다. 새로고침하거나 주소로 바로 들어오면 가로채지 않고 마이페이지 작성 화면이 뜬다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/intercepting-routes.md).
 * `(..)` 인 것은 `@modal` 이 경로 조각이 아니라서 `mypage` 가 `side-studies` 와 같은 높이이기
 * 때문이다. 공고 달력(`app/(site)/calendar/layout.tsx`)과 같은 짜임이다.
 */
export default function SideStudiesLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
