import Link from 'next/link';
import { Badge, Button } from '@ogonggo/ui';
import { computeDday, isDdayUrgent } from '@/shared/lib/dday';
import { EMPTY_CELL, MenuAction, type MyPostRowProps, formatPeriod } from './MyPostRow';

/**
 * 작성한 모집글의 모바일 카드(`docs/asset/v10 mobile/작성한 모집글.png`). 데스크톱 표의 한 행
 * (`MyPostRow`)과 같은 값을 카드로 쌓는다. 표는 다섯 칸이라 360px 폭에서 글자가 세로로 꺾였다.
 *
 * 맨 위는 D-day 또는 `마감` 배지와 점 세 개 메뉴, 가운데는 제목·메타·모집 기간, 아래는
 * 조회수·모집 인원과 버튼이다. 임시저장 글은 배지 없이 값 자리를 `-` 로 두고 버튼만 파랗다.
 */
export function MyPostCard({
  row,
  onDelete,
  onCopy,
  onClose,
  onReopen,
  pending = false,
}: MyPostRowProps) {
  const draft = row.status === 'DRAFT';
  const closed = row.recruitmentStatus === 'CLOSED';
  const dday = draft || closed ? null : computeDday('PERIOD', row.recruitmentEndDate);
  const urgent = isDdayUrgent('PERIOD', row.recruitmentEndDate);

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex min-h-8 items-start justify-between gap-2">
        <div className="flex gap-1">
          {dday ? (
            <Badge
              tone={urgent ? 'urgent' : 'main'}
              className="rounded-md px-2 py-1 text-xs font-bold"
            >
              {dday}
            </Badge>
          ) : closed ? (
            <Badge tone="neutral" className="rounded-md px-2 py-1 text-xs font-bold">
              마감
            </Badge>
          ) : null}
          {row.status === 'HIDDEN' ? (
            <Badge tone="neutral" className="rounded-md px-2 py-1 text-xs font-bold">
              비공개
            </Badge>
          ) : null}
        </div>
        <details className="relative -mr-2">
          <summary
            aria-label={`${row.title} 더보기`}
            className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md text-gray-400 [&::-webkit-details-marker]:hidden"
          >
            <span aria-hidden="true" className="icon-[lucide--ellipsis-vertical] block h-5 w-5" />
          </summary>
          <div className="absolute right-0 z-10 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-md">
            <MenuAction label="삭제하기" onClick={onDelete} disabled={pending} />
            <MenuAction label="복사하기" onClick={onCopy} disabled={pending} />
            {row.recruitmentStatus === 'RECRUITING' ? (
              <MenuAction label="마감하기" onClick={onClose} disabled={pending} />
            ) : null}
            {row.recruitmentStatus === 'CLOSED' ? (
              <MenuAction label="재모집하기" onClick={onReopen} disabled={pending} />
            ) : null}
          </div>
        </details>
      </div>

      <Link
        href={`/side-studies/${row.postId}`}
        className="mt-2 line-clamp-2 text-base font-bold text-gray-900"
      >
        {row.title}
      </Link>
      {row.meta.length > 0 ? (
        <p className="pt-1 text-sm text-gray-400">{row.meta.join(' · ')}</p>
      ) : null}
      {draft ? null : (
        <p className="pt-0.5 text-sm text-gray-400">
          {formatPeriod(row.recruitmentStartDate, row.recruitmentEndDate)}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
        <p className="flex gap-4 text-sm text-gray-500">
          <span>조회수 {draft ? EMPTY_CELL : row.viewCount}</span>
          <span>
            모집 인원{' '}
            {draft || row.capacity === undefined
              ? EMPTY_CELL
              : `${row.applicationCount}/${row.capacity}`}
          </span>
        </p>
        <Button
          asChild
          variant={row.continueWriting ? 'primary' : 'secondary'}
          size="sm"
          className={
            row.continueWriting ? 'w-30 shrink-0' : 'w-30 shrink-0 border-blue-500 text-blue-500'
          }
        >
          <Link href={`/mypage/posts/${row.postId}/edit`}>
            {row.continueWriting ? '이어서 작성' : '수정하기'}
          </Link>
        </Button>
      </div>
    </li>
  );
}
