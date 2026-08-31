import Link from 'next/link';
import { Button } from '@ogonggo/ui';

/**
 * `home.png`의 상단 헤더. 채용공고(`/`) 외의 nav·우측 링크는 대상 화면이 없다(PRD 10절) — 진짜
 * 라우팅을 걸지 않도록 `<Link>`/`<a>`가 아닌 비활성 스타일의 `<span>`으로만 둔다. "로그인" 버튼도
 * 같은 이유로 `Button`을 `Link`로 감싸지 않아 클릭해도 아무 일도 일어나지 않는다.
 */
export function SiteHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-stretch justify-between px-6">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-blue-500">오늘의 공고</span>
            <span className="text-xs font-medium text-gray-400">BY LETS CAREER</span>
          </Link>
          <nav className="flex items-stretch gap-6 text-sm font-semibold">
            <Link
              href="/"
              className="flex items-center border-b-2 border-gray-900 text-gray-900"
            >
              채용공고
            </Link>
            <span className="flex items-center text-gray-400">교육·부트캠프</span>
            <span className="flex items-center text-gray-400">사이드·스터디</span>
          </nav>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
          <span>공고 등록</span>
          <span>공고 달력</span>
          <Button size="sm">로그인</Button>
        </div>
      </div>
    </header>
  );
}
