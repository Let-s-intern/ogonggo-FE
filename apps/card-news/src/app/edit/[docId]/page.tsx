import { CardEditor } from '@/components/CardEditor';

/** 편집 화면. 문서는 이 브라우저에 남은 것을 id 로 연다(`job-<공고 번호>` 는 없으면 새로 만든다). */
export default async function Page({ params }: { params: Promise<{ docId: string }> }) {
  const { docId } = await params;
  return <CardEditor docId={decodeURIComponent(docId)} />;
}
