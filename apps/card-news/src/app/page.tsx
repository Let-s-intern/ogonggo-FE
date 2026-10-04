import { CardEditor } from '@/components/CardEditor';

/** `?jobId=` 로 열면 그 공고를 고른 채로 시작한다(오공고 웹의 어드민 전용 카드뉴스 버튼). */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string | string[] }>;
}) {
  const { jobId } = await searchParams;
  const initialJobId = typeof jobId === 'string' && /^\d+$/.test(jobId) ? Number(jobId) : undefined;
  return <CardEditor initialJobId={initialJobId} />;
}
