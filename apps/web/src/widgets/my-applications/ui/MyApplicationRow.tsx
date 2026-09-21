import Link from 'next/link';
import { Button, Select } from '@ogonggo/ui';
import { PLACEHOLDER_NOTICE } from '@/features/my-applications/model/placeholder';
import { isRecruitmentClosed } from '@/shared/lib/dday';
import { MyPageListRowCells } from '@/widgets/mypage-list';
import type { MyApplicationRow as Row } from '../lib/fetch';

export interface MyApplicationRowProps {
  row: Row;
  /** 상태 셀렉트의 선택지. 탭마다 단계 수가 다르다(넷 / 여섯 / 셋). */
  statusOptions: readonly { value: string; label: string }[];
  /** `지원` 인지 `신청` 인지. 부트캠프 탭만 `신청` 이다. */
  verb: string;
  /**
   * 상태를 바꿀 수 있는 행이면 준다. 저장할 API 가 없는 탭은 넘기지 않고, 그러면 셀렉트가
   * 비활성으로 그려진다 — 눌리는데 아무 일도 안 일어나는 컨트롤을 두지 않는다(PRD 3 절).
   */
  onStatusChange?: (applicationStatus: string) => void;
  /** 지울 수 있는 행이면 준다. 없으면 점 세 개 메뉴가 비활성으로 그려진다. */
  onDelete?: () => void;
  /** 이 행의 요청이 도는 중. 컨트롤을 잠근다. */
  pending?: boolean;
}

/**
 * 표 한 줄(PRD 3 절, 목업 `docs/asset/v4 마이페이지/지원 신청내역/`). 앞 두 칸(모집글 정보 ·
 * 마감일) 은 스크랩 표와 같은 `MyPageListRowCells` 가 그리고, 뒤 두 칸이 이 화면 것이다.
 *
 * 마감된 건은 지원 버튼이 눌리지 않는다. 마감한 공고에 지원할 수는 없고, 목업도 그 줄의
 * 버튼을 회색으로 그린다.
 *
 * 갈 곳이 없는 행(하드코딩한 두 탭) 도 버튼이 눌리지 않는다. 상세 화면이 없어 보낼 데가
 * 없는데 누를 수 있게 두면 고장으로 읽힌다 — PRD 가 상태 셀렉트와 삭제에 대해 정한 것과 같은
 * 판단이다.
 *
 * 목업 행 우측의 `삭제하기` 팝오버는 점 세 개 메뉴로 연다. 목업에는 뜬 상태만 있고 무엇을
 * 눌러 여는지가 그려져 있지 않아, `작성한 모집글` 화면이 쓰는 것과 같은 점 세 개로 뒀다
 * (PRD 4 절). 여닫기는 `<details>` 라 자바스크립트가 없어도 열린다.
 */
export function MyApplicationRow({
  row,
  statusOptions,
  verb,
  onStatusChange,
  onDelete,
  pending = false,
}: MyApplicationRowProps) {
  const closed = isRecruitmentClosed(row.recruitmentType, row.recruitmentEndAt, row.closedAt);
  const applyLabel = `${verb}하기`;

  return (
    <tr className="border-t border-gray-100">
      <MyPageListRowCells row={row} />
      <td className="px-4 py-5">
        <Select
          aria-label={`${row.title} 의 나의 ${verb} 상태`}
          value={row.applicationStatus}
          options={[...statusOptions]}
          disabled={!onStatusChange || pending}
          title={onStatusChange ? undefined : PLACEHOLDER_NOTICE}
          onChange={(event) => onStatusChange?.(event.currentTarget.value)}
          className="w-full"
        />
      </td>
      <td className="px-4 py-5">
        <div className="flex items-center justify-center gap-1">
          {row.href && !closed ? (
            <Button asChild size="sm" className="rounded-md px-4 whitespace-nowrap">
              <Link href={row.href}>{applyLabel}</Link>
            </Button>
          ) : (
            <Button size="sm" disabled className="rounded-md px-4 whitespace-nowrap">
              {applyLabel}
            </Button>
          )}

          {onDelete ? (
            <details className="relative">
              <summary
                aria-label={`${row.title} 더보기`}
                className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 [&::-webkit-details-marker]:hidden"
              >
                <span
                  aria-hidden="true"
                  className="icon-[lucide--ellipsis-vertical] block h-4 w-4"
                />
              </summary>
              <div className="absolute right-0 z-10 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-md">
                <button
                  type="button"
                  disabled={pending}
                  onClick={onDelete}
                  className="block w-full px-3 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-50 disabled:text-gray-300"
                >
                  삭제하기
                </button>
              </div>
            </details>
          ) : (
            /* 저장할 곳이 없는 탭. 메뉴를 감추지 않고 비활성으로 남긴다 — 자리가 통째로
               비면 "이 화면에는 삭제가 없다" 로 읽히는데, 사실은 준비 중이다. */
            <button
              type="button"
              disabled
              aria-label={`${row.title} 더보기`}
              title={PLACEHOLDER_NOTICE}
              className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-md text-gray-300"
            >
              <span aria-hidden="true" className="icon-[lucide--ellipsis-vertical] block h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
