import Link from 'next/link';
import { Button } from '@ogonggo/ui';

/**
 * 표 아래 CTA 배너(목업 `작성한 사이드 프로젝트 스터디 모집글.png` 하단).
 *
 * 문구와 버튼이 `지원·신청 내역` 의 사이드·스터디 탭 배너와 같다. 그쪽
 * (`widgets/my-applications/ui/MyApplicationsCta.tsx`) 을 가져다 쓰지 않는 이유는 위젯이
 * 다른 위젯을 임포트하지 않기 때문이다(`widgets/README.md`). 그쪽은 탭마다 다른 세 벌을
 * 들고 있고 이쪽은 한 벌뿐이라, 한 곳으로 합치려면 탭 개념이 없는 이 화면까지 그 표를
 * 알아야 한다.
 */
export function MyPostsCta() {
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
