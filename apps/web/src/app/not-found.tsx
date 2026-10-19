import { NotFoundState } from '@/shared/ui/NotFoundState';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

/**
 * 어떤 라우트에도 맞지 않는 주소(`/없는-주소`)를 받는다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/not-found.md).
 *
 * `(site)` 그룹 안에서 `notFound()`가 불린 경우(`/jobs/{없는 id}` 등)는 여기로 오지 않고
 * `(site)/not-found.tsx`가 받는다. 그쪽은 그룹 레이아웃이 헤더·푸터를 이미 달아 주므로 본문만
 * 그린다 — 여기서 쓰던 이 파일을 그대로 거기서 쓰면 헤더가 두 번 나왔다.
 *
 * 이 파일은 그룹 밖이라 그룹 레이아웃의 껍데기를 물려받지 못한다. 그래서 헤더와 푸터를 직접 단다.
 */
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <NotFoundState />
      <SiteFooter />
    </>
  );
}
