import { LogoLoader } from '@/shared/ui/LogoLoader';

/**
 * `app/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * 여기만 스켈레톤이 아니라 로고다. 이 파일은 `/`뿐 아니라 자기 `loading.tsx`가 없는 하위
 * 세그먼트의 폴백이기도 한데, 지금 그 대상이 `/`(히어로 + 인기 공고 + 광고 자리 + 공고 목록)와
 * `/calendar`(제목 + 달력 격자)로 레이아웃이 서로 다르다. 한쪽에 맞춘 스켈레톤은 다른 쪽에서
 * 지키지 못할 약속이 되므로, 모양을 예고하지 않는 로고를 쓴다.
 *
 * 목록·상세는 각자 `loading.tsx`를 두고 자기 레이아웃을 닮은 스켈레톤을 쓴다
 * (`app/bootcamps/loading.tsx`, `app/side-studies/loading.tsx`, 상세 셋).
 */
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10">
      <LogoLoader />
    </main>
  );
}
