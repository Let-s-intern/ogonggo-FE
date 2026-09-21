import Link from 'next/link';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import type { CompanyPostRow as Row } from '../lib/fetch';

export interface CompanyPostRowProps {
  row: Row;
}

/**
 * 작성한 공고 표 한 줄(v5 PRD 2 절).
 *
 * 첫 칸에 `MyPageListRowCells` 를 쓰지 않는다. 그쪽은 두 번째 칸을 마감일 하나로 고정하는데
 * 이 표의 두 번째 칸은 모집 인원이다 — 앞 칸만 쓰고 뒤 칸을 버릴 수가 없다.
 *
 * 제목만 링크다. 게시되지 않은 공고에는 링크가 없다(`lib/fetch.ts` 의 `href`).
 */
export function CompanyPostRow({ row }: CompanyPostRowProps) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-5">
        <div className="flex items-center gap-4">
          <Thumbnail
            src={row.thumbnailUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md border border-gray-100"
          />
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-500">{row.caption}</p>
            {row.href ? (
              <Link
                href={row.href}
                className="block truncate text-base font-bold text-gray-900 hover:underline"
              >
                {row.title}
              </Link>
            ) : (
              <p className="truncate text-base font-bold text-gray-900">{row.title}</p>
            )}
            {row.meta.length > 0 ? (
              <p className="truncate text-xs text-gray-400">{row.meta.join(' · ')}</p>
            ) : null}
          </div>
        </div>
      </td>
    </tr>
  );
}
