import Link from 'next/link';
import { Button } from '@ogonggo/ui';

/**
 * 칸반 아래 CTA 배너(목업 `docs/asset/v7 스크랩한 공고 칸반/` 여섯 장).
 *
 * **탭을 옮겨도 문구가 같다.** v4 의 `지원·신청 내역` 배너는 탭마다 달랐는데(채용 공고 ·
 * 교육 · 모집글) v7 목업은 세 탭 모두 같은 모집글 배너를 그린다. 목업을 따른다.
 *
 * `모집글 작성하기` 는 v4 때 없던 화면이라 비활성이었다. 지금은 `/mypage/posts/new` 가 있어
 * 그리로 보낸다 — `작성한 모집글` 화면의 같은 버튼(`widgets/my-posts/ui/MyPostsCta.tsx`) 과
 * 같은 곳이다.
 */
export function ApplicationBoardCta() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-blue-50 px-8 py-7">
      <div>
        <p className="text-lg font-bold text-gray-900">새로운 프로젝트를 시작해 보세요.</p>
        <p className="pt-1 text-sm text-gray-500">
          목표와 취향에 딱 맞는 든든한 커리어 메이트들을 만나보세요!
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/side-studies">모집글 보러가기</Link>
        </Button>
        <Button asChild variant="secondary" className="bg-white">
          <Link href="/mypage/posts/new">모집글 작성하기</Link>
        </Button>
      </div>
    </div>
  );
}
