import { Card } from '@ogonggo/ui';

const SECTION_SKELETON_COUNT = 4;

/**
 * `app/side-studies/[postId]/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 * 모양은 `app/bootcamps/[bootcampId]/loading.tsx`와 같고, 정보 그리드 하나에 본문 섹션이
 * 셋(한 줄 소개·모집 상세 내용·지원 자격 및 전형)이라 스켈레톤 개수만 다르다.
 */
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-white px-4 py-10">
      <div className="flex w-full max-w-6xl flex-col gap-4">
        <Card className="h-32 animate-pulse bg-gray-100" />
        {Array.from({ length: SECTION_SKELETON_COUNT }, (_, index) => (
          <Card key={index} className="h-20 animate-pulse bg-gray-100" />
        ))}
      </div>
    </main>
  );
}
