import Link from 'next/link';
import { Badge } from '@ogonggo/ui';
import { INDUSTRY_REPORTS } from '@/shared/config/industryReports';

/**
 * 구매 카드 맨 아래의 이동 길. `산업 리포트 전체 보기` 와 지금 산업을 뺀 다른 산업 리포트들이다. 눌리는 요소는
 * 링크 하나씩이고, 링크 안에는 글자와 모양만 있다.
 */
export function ReportLinks({ currentSlug }: { currentSlug: string }) {
  const others = INDUSTRY_REPORTS.filter((report) => report.slug !== currentSlug);
  return (
    <nav aria-label="다른 산업 리포트" className="flex flex-col gap-3">
      <Link
        href="/reports"
        className="flex items-center justify-between text-sm font-semibold text-gray-900 hover:text-blue-500"
      >
        산업 리포트 전체 보기
        <span aria-hidden="true" className="icon-[lucide--chevron-right] block h-4 w-4" />
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
