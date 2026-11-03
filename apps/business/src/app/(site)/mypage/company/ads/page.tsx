import type { Metadata } from 'next';

export const metadata: Metadata = { title: '광고' };

export default function Page() {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-xl font-bold text-gray-950">광고</h2>
      <p className="text-sm text-gray-500">신청부터 성과까지 한 곳에서 확인해요.</p>
    </section>
  );
}
