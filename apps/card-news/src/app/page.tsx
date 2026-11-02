import { redirect } from 'next/navigation';
import { StartScreen } from '@/components/StartScreen';

/**
 * 시작 화면. `?jobId=` 로 열면(오공고 웹의 어드민 전용 카드뉴스 버튼) 그 공고 하나의 문서를 편집
 * 화면에서 연다 — 남은 편집본이 없으면 거기서 초안을 만든다.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string | string[] }>;
}) {
  const { jobId } = await searchParams;
  if (typeof jobId === 'string' && /^\d+$/.test(jobId)) {
    redirect(`/edit/job-${Number(jobId)}`);
  }
  return <StartScreen />;
}
