import Link from 'next/link';
import { Button, Select } from '@ogonggo/ui';
import { isRecruitmentClosed } from '@/shared/lib/dday';
import { MyPageListRowCells } from '@/widgets/mypage-list';
import type { MyApplicationRow as Row } from '../lib/fetch';

export interface MyApplicationRowProps {
  row: Row;
  /** 상태 셀렉트의 선택지. 탭마다 단계 수가 다르다(넷 / 여섯 / 셋). */
  statusOptions: readonly { value: string; label: string }[];
  /** `지원` 인지 `신청` 인지. 부트캠프 탭만 `신청` 이다. */
  verb: string;
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
 */
export function MyApplicationRow({ row, statusOptions, verb }: MyApplicationRowProps) {
  const closed = isRecruitmentClosed(row.recruitmentType, row.recruitmentEndAt, row.closedAt);
  const applyLabel = `${verb}하기`;

  return (
    <tr className="border-t border-gray-100">
      <MyPageListRowCells row={row} />
      <td className="px-4 py-5">
        <Select
          aria-label={`${row.title} 의 나의 ${verb} 상태`}
          defaultValue={row.applicationStatus}
          options={[...statusOptions]}
          disabled
          className="w-full"
        />
      </td>
      <td className="px-4 py-5 text-center">
        {row.href && !closed ? (
          <Button asChild size="sm" className="rounded-md px-4">
            <Link href={row.href}>{applyLabel}</Link>
          </Button>
        ) : (
          <Button size="sm" disabled className="rounded-md px-4">
            {applyLabel}
          </Button>
        )}
      </td>
    </tr>
  );
}
