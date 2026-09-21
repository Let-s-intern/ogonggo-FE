import type { ReactNode } from 'react';

/**
 * 공고 달력 레이아웃. `@modal` 슬롯에 공고 상세를 모달로 띄운다
 * (`docs/asset/v6 공고달력/공고 상세 모달.png`).
 *
 * 달력 안에서 `/jobs/[id]` 로 가는 링크는 `@modal/(..)jobs/[jobId]` 가 가로채 달력 위에 모달로
 * 그린다. 주소는 `/jobs/[id]` 로 바뀌므로 그대로 공유되고, 새로고침하거나 주소로 바로 들어오면
 * 가로채지 않고 원래 상세 화면이 뜬다(node_modules/next/dist/docs/01-app/03-api-reference/
 * 03-file-conventions/intercepting-routes.md). `(..)` 인 것은 `@modal` 이 경로 조각이 아니라서
 * `jobs` 가 `calendar` 와 같은 높이이기 때문이다.
 */
export default function CalendarLayout({
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
