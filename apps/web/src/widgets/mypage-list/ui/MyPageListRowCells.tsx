import Link from 'next/link';
import { Badge } from '@ogonggo/ui';
import { computeDday, isDdayUrgent, isRecruitmentClosed } from '@/shared/lib/dday';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { formatDeadline } from '../lib/deadline';
import type { MyPageListRow } from '../model/row';

/**
 * 표 한 행의 앞 두 칸 — 공고 정보와 마감일. 뒤따르는 칸(상태 셀렉트·버튼) 은 화면마다 달라
 * 호출부가 `<tr>` 안에 이어 그린다.
 *
 * 마감된 건은 D-day 자리에 회색 `마감` 배지다. `entities/job/ui/JobCard.tsx` 가 목록 카드에서
 * 하는 것과 같은 판단이고 이유도 같다 — 배지를 통째로 빼면 그 자리가 아무 말도 하지 않는다.
 *
 * 제목만 링크다. 행 전체를 링크로 감싸면 뒤 칸의 셀렉트와 버튼이 그 안에 들어간다. 갈 곳이
 * 없는 행(하드코딩한 지원 내역) 은 제목이 그냥 글자다 — 눌리는데 아무 일도 안 일어나는 링크를
 * 두지 않는다.
 */
export function MyPageListRowCells({ row }: { row: MyPageListRow }) {
  const dday = computeDday(row.recruitmentType, row.recruitmentEndAt);
  const urgent = isDdayUrgent(row.recruitmentType, row.recruitmentEndAt);
  const closed = isRecruitmentClosed(row.recruitmentType, row.recruitmentEndAt, row.closedAt);

  return (
    <>
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
      <td className="px-4 py-5">
        <div className="flex items-center justify-center gap-3">
          {dday ? (
            <Badge
              tone={urgent ? 'urgent' : 'main'}
              className="rounded-full px-2 py-0.5 text-xs font-bold"
            >
              {dday}
            </Badge>
          ) : closed ? (
            <Badge tone="neutral" className="rounded-full px-2 py-0.5 text-xs font-bold">
              마감
            </Badge>
          ) : null}
          <span className="text-sm whitespace-nowrap text-gray-500">
            {formatDeadline(row.recruitmentType, row.recruitmentEndAt)}
          </span>
        </div>
      </td>
    </>
  );
}
