import type { ReactNode } from 'react';

/**
 * 지원 · 신청 관리 레이아웃. `@modal` 슬롯에 칸반 카드의 상세를 모달로 띄운다.
 *
 * 공고 달력(`app/(site)/calendar/layout.tsx`)과 같은 가로채기 라우트다. 카드가 `item.href`
 * (`/jobs/[id]`·`/bootcamps/[id]`·`/side-studies/[id]`)로 이동하면 `@modal/(..)(..)*` 가
 * 가로채 이 화면 위에 그린다. `(..)(..)` 인 것은 `scraps` 에서 두 단계 올라가야 루트이기 때문이다
 * — `(site)` 는 경로 조각이 아니다.
 */
export default function MyScrapsLayout({
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
