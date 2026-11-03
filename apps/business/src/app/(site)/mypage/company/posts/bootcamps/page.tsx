import type { Metadata } from 'next';

export const metadata: Metadata = { title: '부트캠프' };

export default function Page() {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-xl font-bold text-gray-950">부트캠프</h2>
      <p className="text-sm text-gray-500">교육 · 부트캠프 공고가 작성부터 종료까지 어디쯤 있는지 확인해요.</p>
    </section>
  );
}
