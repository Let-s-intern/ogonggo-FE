import Link from 'next/link';
import { Badge } from '@ogonggo/ui';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';

/**
 * 본문 위의 이동 줄. `산업 리포트 전체 보기` 와 지금 산업을 뺀 다른 산업 리포트들이다. 구매 카드 밖에 둔다 —
 * 카드는 따라오는(`sticky`) 칸이라 길어지면 화면 아래가 잘린다. 눌리는 요소는 링크 하나씩이고, 링크 안에는
 * 글자와 모양만 있다.
 */
export function ReportLinks({ currentSlug }: { currentSlug: string }) {
  const others = INDUSTRY_REPORTS.filter((report) => report.slug !== currentSlug);
  return (
    <nav
      aria-label="산업 리포트 이동"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
    >
      <Link
        href="/reports"
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-500"
      >
        <span aria-hidden="true" className="icon-[lucide--chevron-left] block h-4 w-4" />
        산업 리포트 전체 보기
      </Link>
      <ul className="flex flex-wrap gap-2">
        {others.map((report) => (
          <li key={report.slug}>
            <Link href={`/reports/${report.slug}`} className="group block">
              <Badge className="group-hover:bg-gray-200">{report.label}</Badge>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
