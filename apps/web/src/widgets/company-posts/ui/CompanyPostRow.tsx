import Link from 'next/link';
import { Badge, Button } from '@ogonggo/ui';
import { computeDday, isDdayUrgent, isRecruitmentClosed } from '@/shared/lib/dday';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { formatDeadline } from '@/widgets/mypage-list';
import {
  PUBLICATION_STATUS_LABELS,
  PUBLICATION_STATUS_TONES,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_TONES,
} from '../model/status';
import { companyPostEditHref } from '../lib/routes';
import type { CompanyPostRow as Row } from '../lib/fetch';
import type { CompanyPostTab } from '../lib/query';

/** 값이 없는 칸. 채용공고의 모집 인원이 늘 이 글자다. */
const EMPTY_CELL = '-';

/**
 * 모집 기간 문구. 두 날짜 모두 시각이 붙은 일시라 `formatDeadline` 이 `2026.01.05(월) 23:59`
 * 로 그려 준다 — 목업의 `2026.00.00(월) 00:00 ~ 00:00(월) 00:00` 자리다.
 *
 * 상시 모집이면 날짜가 없다. `formatDeadline` 이 그때 `상시 모집` 을 돌려준다.
 */
function formatPeriod(row: Row): string {
  if (row.recruitmentType === 'ALWAYS_OPEN') {
    return formatDeadline(row.recruitmentType, row.recruitmentEndAt);
  }
  const start = row.recruitmentStartAt
    ? formatDeadline('PERIOD', row.recruitmentStartAt)
    : undefined;
  const end = row.recruitmentEndAt ? formatDeadline('PERIOD', row.recruitmentEndAt) : undefined;
  if (!start && !end) {
    return EMPTY_CELL;
  }
  return `${start ?? ''} ~ ${end ?? ''}`.trim();
}

export interface CompanyPostRowProps {
  row: Row;
  /** 수정 폼 주소가 탭마다 다르다. 채용공고와 부트캠프는 폼이 둘이다(`lib/routes.ts`). */
  tab: CompanyPostTab;
  onDelete: () => void;
  onClose: () => void;
  /** 이 행의 요청이 도는 중. 메뉴를 잠근다. */
  pending?: boolean;
}

/**
 * 작성한 공고 표 한 줄(v5 PRD 2 절). 칸은 공고 정보 · 모집 인원 · 모집 기간 ·
 * 심사 · 게시 상태 · 관리다.
 *
 * **목업의 `조회수` 열이 없다.** `CompanyJobSummaryResponse` 와
 * `CompanyBootcampSummaryResponse` 에 조회수도 북마크수도 없다 — 그 수치는 사용자용 응답
 * (`UserJobSummaryResponse`) 에만 있다.
 *
 * 첫 칸에 `MyPageListRowCells` 를 쓰지 않는다. 그쪽은 두 번째 칸을 마감일 하나로 고정하는데
 * 이 표의 두 번째 칸은 모집 인원이다 — 앞 칸만 쓰고 뒤 칸을 버릴 수가 없다.
 *
 * 제목만 링크다. 게시되지 않은 공고에는 링크가 없다(`lib/fetch.ts` 의 `href`).
 *
 * **점 세 개 메뉴에 `복사하기` 가 없다.** 목업에는 있지만 기업 공고에 복사 API 가 없다
 * (`lib/mutate.ts` 주석). 대신 목업에 없는 `마감하기` 가 있다 — PRD 2 절 표가 탭마다 마감
 * API(`closeMyJob`·`closeMyBootcamp`) 를 적고 있고, 관리 칸에는 수정 버튼과 이 메뉴뿐이라
 * 마감을 걸 자리가 여기밖에 없다.
 */
export function CompanyPostRow({
  row,
  tab,
  onDelete,
  onClose,
  pending = false,
}: CompanyPostRowProps) {
  const closed = isRecruitmentClosed(row.recruitmentType, row.recruitmentEndAt, row.closedAt);
  /**
   * 마감된 건에는 D-day 를 그리지 않는다. 마감일이 아직 남았는데 손으로 마감한 공고
   * (`closedAt` 만 찍힌 상태) 는 `computeDday` 가 그대로 `D-9` 를 돌려주고, 그러면 같은
   * 행에서 배지는 모집 중이라 하고 메뉴에는 마감하기가 없는 어긋난 화면이 된다.
   */
  const dday = closed ? null : computeDday(row.recruitmentType, row.recruitmentEndAt);
  const urgent = isDdayUrgent(row.recruitmentType, row.recruitmentEndAt);

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

      {/* 채용공고는 목록 응답에 인원이 없어 늘 `-` 다. 열을 빼지 않는 이유는 부트캠프 탭에는
          값이 있고, 백엔드에 인원이 생기면 이 칸의 출처만 갈아 끼우면 되기 때문이다. */}
      <td className="px-4 py-5 text-center text-sm text-gray-500">
        {row.capacity === undefined ? EMPTY_CELL : `${row.capacity}명`}
      </td>

      <td className="px-4 py-5">
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
          <span className="text-sm text-gray-500">{formatPeriod(row)}</span>
        </div>
      </td>

      {/* 심사와 게시를 한 칸에 위아래로 둔다. 열을 둘로 가르면 `공고 정보` 가 가져갈 폭이
          제목 한 줄도 안 되게 줄어든다. 어느 배지가 무엇인지는 `title` 이 말한다. */}
      <td className="px-4 py-5">
        <div className="flex flex-col items-center gap-1">
          {row.reviewStatus ? (
            <Badge
              tone={REVIEW_STATUS_TONES[row.reviewStatus]}
              title="심사 상태"
              className="rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap"
            >
              {REVIEW_STATUS_LABELS[row.reviewStatus]}
            </Badge>
          ) : (
            <span className="text-sm text-gray-500">{EMPTY_CELL}</span>
          )}
          <Badge
            tone={PUBLICATION_STATUS_TONES[row.publicationStatus]}
            title="게시 상태"
            className="rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap"
          >
            {PUBLICATION_STATUS_LABELS[row.publicationStatus]}
          </Badge>
        </div>
      </td>

      <td className="px-4 py-5">
        <div className="flex items-center justify-center gap-1">
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="rounded-md px-4 whitespace-nowrap"
          >
            <Link href={companyPostEditHref(tab, row.id)}>수정하기</Link>
          </Button>

          {/* 여닫기는 `<details>` 라 자바스크립트가 없어도 열린다. v4 의 같은 메뉴와 같다. */}
          <details className="relative">
            <summary
              aria-label={`${row.title} 더보기`}
              className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 [&::-webkit-details-marker]:hidden"
            >
              <span aria-hidden="true" className="icon-[lucide--ellipsis-vertical] block h-4 w-4" />
            </summary>
            <div className="absolute right-0 z-10 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-md">
              <MenuAction label="삭제하기" onClick={onDelete} disabled={pending} />
              {/* 이미 마감한 건에는 그리지 않는다. 다시 눌러도 바뀌는 것이 없고, 부트캠프는
                  409 로 실패한다. */}
              {closed ? null : <MenuAction label="마감하기" onClick={onClose} disabled={pending} />}
            </div>
          </details>
        </div>
      </td>
    </tr>
  );
}

/** 점 세 개 메뉴 한 줄. */
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
