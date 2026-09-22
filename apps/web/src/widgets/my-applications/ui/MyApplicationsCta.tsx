import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import type { MyApplicationTab } from '../lib/query';

/** 탭마다 다른 문구와 버튼. 목업 세 장의 하단 배너 그대로다. */
const BANNERS: Record<
  MyApplicationTab,
  { title: string; description: string; href: string; label: string }
> = {
  jobs: {
    title: '지원할 채용공고를 찾고 있나요?',
    description: '지금 모집 중인 공고를 둘러보고, 원하는 커리어에 한 걸음 더 가까워져 보세요!',
    href: '/',
    label: '채용 공고 보러가기',
  },
  bootcamps: {
    title: '나에게 맞는 교육으로 역량을 키워보세요.',
    description: '관심 있는 교육·부트캠프를 살펴보고, 필요한 실무 역량을 준비해 보세요!',
    href: '/bootcamps',
    label: '교육 · 부트캠프 보러가기',
  },
  'side-studies': {
    title: '새로운 프로젝트를 시작해 보세요.',
    description: '목표와 취향에 딱 맞는 든든한 커리어 메이트들을 만나보세요!',
    href: '/side-studies',
    label: '모집글 보러가기',
  },
};

/**
 * 표 아래 CTA 배너(목업 `docs/asset/v4 마이페이지/지원 신청내역/` 세 장).
 *
 * 사이드·스터디 탭에만 `모집글 작성하기` 가 하나 더 붙는다. v4 때는 그 화면이 없어 비활성
 * 이었고, 지금은 `/mypage/posts/new` 가 있어 그리로 보낸다.
 */
export function MyApplicationsCta({ tab }: { tab: MyApplicationTab }) {
  const banner = BANNERS[tab];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-blue-50 px-8 py-7">
      <div>
        <p className="text-lg font-bold text-gray-900">{banner.title}</p>
        <p className="pt-1 text-sm text-gray-500">{banner.description}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href={banner.href}>{banner.label}</Link>
        </Button>
        {tab === 'side-studies' ? (
          <Button asChild variant="secondary" className="bg-white">
            <Link href="/mypage/posts/new">모집글 작성하기</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
