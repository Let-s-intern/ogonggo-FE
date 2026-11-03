import type { Metadata } from 'next';

export const metadata: Metadata = { title: '기업 정보' };

export default function Page() {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-xl font-bold text-gray-950">기업 정보</h2>
      <p className="text-sm text-gray-500">오늘의 공고에 보이는 기업 정보와 담당자 정보를 관리해요.</p>
    </section>
  );
}
