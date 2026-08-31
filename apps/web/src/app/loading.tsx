import { Card } from '@ogonggo/ui';

const SKELETON_COUNT = 5;

/**
 * `app/loading.tsx`는 같은 세그먼트의 `page.tsx`를 Suspense 경계로 감싸
 * 데이터 요청이 끝나기 전까지 이 폴백을 보여준다
 * (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md).
 */
export default function Loading() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-gray-50 px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-3">
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <Card key={index} className="h-24 animate-pulse bg-gray-100" />
        ))}
      </div>
    </main>
  );
}
