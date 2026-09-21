import Link from 'next/link';
import { Badge, Button } from '@ogonggo/ui';
import { computeDday, isDdayUrgent } from '@/shared/lib/dday';
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
  /** 행 우측 점 세 개 메뉴가 부르는 것들. 목업에는 앞 둘만 있고 뒤 둘은 PRD 4 절의 표에 있다. */
  onDelete: () => void;
  onCopy: () => void;
  onClose: () => void;
  onReopen: () => void;
  /** 이 행의 요청이 도는 중. 메뉴를 잠근다. */
  pending?: boolean;
}

/**
 * 작성한 모집글 표 한 줄(PRD 4 절, 목업 `docs/asset/v4 마이페이지/작성한 모집글/`).
 * 칸은 모집글 정보 · 모집 인원 · 모집 기간 · 조회수 · 관리 다섯이다.
 *
 * 첫 칸에 `MyPageListRowCells` 를 쓰지 않는다. 그쪽은 썸네일과 작성자 줄을 앞세우고 두 번째
 * 칸을 마감일로 고정하는데, 이 표에는 썸네일도 작성자도 없고 두 번째 칸이 모집 인원이다.
 *
 * **`status` 세 값이 행 모양을 가른다.**
 *
 * | `status` | 인원·기간·조회수 | 버튼 | 제목 옆 |
 * |---|---|---|---|
 * | `DRAFT` | 전부 `-` | `이어서 작성하기` | 임시저장 배지 |
 * | `PUBLISHED` | 값 | `수정하기` | 없음 |
 * | `HIDDEN` | 값 | `수정하기` | 비공개 배지 |
 *
 * 임시저장 글은 아직 모집이 시작되지 않아 백엔드가 기간·인원·모집 상태를 주지 않고
 * (`recruitmentStatus` 는 `null`), 조회수는 0 으로 온다. **그 0 을 그대로 그리지 않는다** —
 * 목업 첫 행이 조회수까지 `-` 이고, 게시된 적 없는 글의 "조회수 0" 은 세어 본 결과처럼
 * 읽힌다. 세 칸을 함께 비우는 판단의 근거는 `continueWriting` 이다(생성 타입 설명:
 * `DRAFT` 글의 `continueWriting` 은 `true`).
 *
 * `수정하기`·`이어서 작성하기` 는 둘 다 눌리지 않는다. 모집글 작성·수정 화면이 PRD 5 절이라
 * 아직 없고, 없는 경로로 보내면 404 다 —
 * `widgets/my-applications/ui/MyApplicationsCta.tsx` 의 `모집글 작성하기` 와 같은 이유다.
 */
export function MyPostRow({
  row,
  onDelete,
  onCopy,
  onClose,
  onReopen,
  pending = false,
}: MyPostRowProps) {
  const draft = row.status === 'DRAFT';
  const closed = row.recruitmentStatus === 'CLOSED';
  const dday = closed ? null : computeDday('PERIOD', row.recruitmentEndDate);
  const urgent = isDdayUrgent('PERIOD', row.recruitmentEndDate);

  return (
    <tr className="border-t border-gray-100">
      <td className="px-4 py-5">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={`/side-studies/${row.postId}`}
              className="truncate text-base font-bold text-gray-900 hover:underline"
            >
              {row.title}
            </Link>
            {draft ? (
              <Badge tone="neutral" className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
                임시저장
              </Badge>
            ) : null}
            {row.status === 'HIDDEN' ? (
              <Badge tone="neutral" className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold">
                비공개
              </Badge>
            ) : null}
          </div>
          {row.meta.length > 0 ? (
            <p className="truncate pt-1 text-xs text-gray-400">{row.meta.join(' · ')}</p>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-5 text-center text-sm text-gray-500">
        {draft || row.capacity === undefined
          ? EMPTY_CELL
          : `${row.applicationCount}/${row.capacity}`}
      </td>
      <td className="px-4 py-5">
        {draft ? (
          <p className="text-center text-sm text-gray-500">{EMPTY_CELL}</p>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {dday ? (
              <Badge
                tone={urgent ? 'urgent' : 'main'}
                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
              >
                {dday}
              </Badge>
            ) : closed ? (
              <Badge
                tone="neutral"
                className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap"
              >
                모집 마감
              </Badge>
            ) : null}
            <span className="text-sm text-gray-500">
              {formatPeriod(row.recruitmentStartDate, row.recruitmentEndDate)}
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-5 text-center text-sm text-gray-500">
        {draft ? EMPTY_CELL : row.viewCount}
      </td>
      <td className="px-4 py-5">
        <div className="flex items-center justify-center gap-1">
          {/* 목업의 임시저장 행만 파란 버튼이고 나머지는 흰 버튼이다. */}
          <Button
            variant={row.continueWriting ? 'primary' : 'secondary'}
            size="sm"
            disabled
            title={PLACEHOLDER_NOTICE}
            className="rounded-md px-4 whitespace-nowrap"
          >
            {row.continueWriting ? '이어서 작성하기' : '수정하기'}
          </Button>

          {/* 여닫기는 `<details>` 라 자바스크립트가 없어도 열린다. 지원·신청 내역의 같은 메뉴와 같다. */}
          <details className="relative">
            <summary
              aria-label={`${row.title} 더보기`}
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 [&::-webkit-details-marker]:hidden"
            >
              <span aria-hidden="true" className="icon-[lucide--ellipsis-vertical] block h-4 w-4" />
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-md">
              <MenuAction label="삭제하기" onClick={onDelete} disabled={pending} />
              <MenuAction label="복사하기" onClick={onCopy} disabled={pending} />
              {/* 임시저장 글에는 `recruitmentStatus` 가 없다. 아직 모집이 시작되지 않아 마감할
                  것도 다시 열 것도 없어 두 줄 다 그리지 않는다. */}
              {row.recruitmentStatus === 'RECRUITING' ? (
                <MenuAction label="마감하기" onClick={onClose} disabled={pending} />
              ) : null}
              {row.recruitmentStatus === 'CLOSED' ? (
                <MenuAction label="재모집하기" onClick={onReopen} disabled={pending} />
              ) : null}
            </div>
          </details>
        </div>
      </td>
    </tr>
  );
}

/** 점 세 개 메뉴 한 줄. 넷이 같은 모양이라 여기 한 번만 적는다. */
function MenuAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block w-full px-3 py-1.5 text-left text-sm whitespace-nowrap text-gray-600 hover:bg-gray-50 disabled:text-gray-300"
    >
      {label}
    </button>
  );
}
