import { NotFoundState } from '@/shared/ui/NotFoundState';

/**
 * `(site)` 그룹 안에서 `notFound()`가 불린 자리를 대신한다 — 지금은 `/jobs/{없는 id}`,
 * `/bootcamps/{없는 id}`, `/side-studies/{없는 id}`, `/notices/{없는 id}`가 여기로 온다.
 *
 * 헤더와 푸터는 `(site)/layout.tsx`가 이미 달고 있고 `not-found.tsx`는 그 레이아웃 안쪽에서
 * 렌더된다. 여기서 또 달면 헤더가 두 개 나온다 — 루트 `app/not-found.tsx`가 그 버그를 냈다.
 * 그룹 밖의 없는 주소는 루트 파일이 헤더·푸터를 직접 달고 받는다.
 */
export default function NotFound() {
  return <NotFoundState />;
}
