import { LogoLoader } from '@/shared/ui/LogoLoader';

/**
 * `app/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 *
 * 여기만 스켈레톤이 아니라 로고다. 이 파일은 자기 `loading.tsx`가 없는 하위 세그먼트의
 * 폴백이고, 지금 그 대상은 `/calendar` 하나뿐이다. 그 화면은 `app/calendar/**`를 맡은 쪽이
 * 만들고 있어 여기서 모양을 예고할 수 없다 — 어긋난 스켈레톤은 지키지 못할 약속이므로,
 * 모양을 말하지 않는 로고를 쓴다. 나중에 `app/calendar/loading.tsx`가 생기면 이 파일은 새
 * 세그먼트가 추가될 때까지 아무 화면에도 쓰이지 않는 안전망으로 남는다.
 *
 * 홈·목록·상세는 각자 `loading.tsx`를 두고 자기 레이아웃을 닮은 스켈레톤을 쓴다
 * (`app/(home)/loading.tsx`, `app/bootcamps/loading.tsx`, `app/side-studies/loading.tsx`,
 * 상세 셋).
 */
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-10">
      <LogoLoader />
    </main>
  );
}
