import type { Metadata } from 'next';
import { BizPage } from '@/widgets/free-promotion';

/**
 * 출시 기념 무료 홍보 이벤트. 기준은 `apps/web/src/app/biz/page.tsx` 다. web `/biz` 도 그대로 신청을 받는다.
 *
 * 콜드메일 링크가 `utm_*` 쿼리를 달고 들어오므로 정식 주소는 쿼리 없는 `/free-promotion` 하나로 둔다.
 */
export const metadata: Metadata = {
  title: '출시 기념 무료 홍보 이벤트',
  description:
    "'오늘의 공고' 출시를 기념해 기업별 1회 채용공고를 인스타그램 또는 직무별 오픈채팅방에서 무료로 홍보해드립니다.",
  alternates: { canonical: '/free-promotion' },
  openGraph: {
    title: "'오늘의 공고' 출시 기념 무료 홍보 이벤트",
    description:
      '기업별 1회, 인스타그램 @letscareer.job 또는 직무별 오픈채팅방 1곳에 채용공고를 무료로 홍보합니다.',
    url: '/free-promotion',
  },
};

export default function Page() {
  return <BizPage />;
}
