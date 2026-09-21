import Link from 'next/link';
import { Button } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/shared/lib/placeholderNotice';
import { formatDeadline } from '@/widgets/mypage-list';
import type { MyPostRow as Row } from '../lib/fetch';

/** 값이 없는 칸. 목업 첫 행(임시저장) 의 인원·기간·조회수가 전부 이 글자다. */
const EMPTY_CELL = '-';

/**
 * 모집 기간 문구. 두 날짜 모두 `YYYY-MM-DD` 라 `formatDeadline` 이 시각 없이 그려 준다 —
 * 마감일 칸과 형식이 같아야 같은 화면 안에서 날짜가 두 모양으로 보이지 않는다.
 *
 * 목업은 `2026.00.00(월) 00:00 ~ 00:00(월) 00:00` 인데 그 `00:00` 은 자리표시자다.
 * 백엔드가 주는 것은 날짜뿐이라 시각을 그리지 않는다(`widgets/mypage-list/lib/deadline.ts`
 * 가 같은 이유로 그렇게 한다).
 */
function formatPeriod(startDate?: string, endDate?: string): string {
  const start = startDate ? formatDeadline('PERIOD', startDate) : undefined;
  const end = endDate ? formatDeadline('PERIOD', endDate) : undefined;
  if (!start && !end) {
    return EMPTY_CELL;
  }
  return `${start ?? ''} ~ ${end ?? ''}`.trim();
}

export interface MyPostRowProps {
  row: Row;
}

/**
 * 작성한 모집글 표 한 줄(PRD 4 절, 목업 `docs/asset/v4 마이페이지/작성한 모집글/`).
 * 칸은 모집글 정보 · 모집 인원 · 모집 기간 · 조회수 · 관리 다섯이다.
 *
 * 첫 칸에 `MyPageListRowCells` 를 쓰지 않는다. 그쪽은 썸네일과 작성자 줄을 앞세우고 두 번째
 * 칸을 마감일로 고정하는데, 이 표에는 썸네일도 작성자도 없고 두 번째 칸이 모집 인원이다.
 *
 * `수정하기` 는 눌리지 않는다. 모집글 작성·수정 화면이 PRD 5 절이라 아직 없고, 없는 경로로
 * 보내면 404 다 — `widgets/my-applications/ui/MyApplicationsCta.tsx` 의 `모집글 작성하기` 와
 * 같은 이유다.
 */
export function MyPostRow({ row }: MyPostRowProps) {
  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-5">
        <div className="min-w-0">
          <Link
            href={`/side-studies/${row.postId}`}
            className="block truncate text-base font-bold text-gray-900 hover:underline"
          >
            {row.title}
          </Link>
          {row.meta.length > 0 ? (
            <p className="truncate pt-1 text-xs text-gray-400">{row.meta.join(' · ')}</p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-5 text-center text-sm text-gray-500">
        {row.capacity === undefined ? EMPTY_CELL : `${row.applicationCount}/${row.capacity}`}
      </td>
      <td className="px-4 py-5 text-center text-sm text-gray-500">
        {formatPeriod(row.recruitmentStartDate, row.recruitmentEndDate)}
      </td>
      <td className="px-4 py-5 text-center text-sm text-gray-500">{row.viewCount}</td>
      <td className="px-4 py-5">
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            disabled
            title={PLACEHOLDER_NOTICE}
            className="rounded-md px-4 whitespace-nowrap"
          >
            수정하기
          </Button>
        </div>
      </td>
    </tr>
  );
}
