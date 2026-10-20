import Link from 'next/link';
import { Badge, Button, cn } from '@ogonggo/ui';
import { computeDday, isDdayUrgent, isRecruitmentClosed } from '@/shared/lib/dday';
import { Thumbnail } from '@/shared/ui/Thumbnail';
import { formatDeadline } from '@/widgets/mypage-list';
import copy from '../config/copy.json';
import { companyPostStage, type CompanyPostStage } from '../model/stage';
import { companyPostEditHref } from '../lib/routes';
import type { CompanyPostRow as Row } from '../lib/fetch';
import type { CompanyPostTab } from '../lib/query';
import { CompanyPostStageTrack } from './CompanyPostStageTrack';

/**
 * 모집 기간 문구. 두 날짜 모두 시각이 붙은 일시라 `formatDeadline` 이 `2026.01.05(월) 23:59`
 * 로 그려 준다. 상시 모집이면 날짜가 없고 `formatDeadline` 이 행의 종류에 맞는 문구(채용공고
 * `상시 채용`, 부트캠프 `상시 모집`)를 돌려준다.
 */
function formatPeriod(row: Row): string | undefined {
  if (row.recruitmentType === 'ALWAYS_OPEN') {
    return formatDeadline(row.kind, row.recruitmentType, row.recruitmentEndAt);
  }
  const start = row.recruitmentStartAt
    ? formatDeadline(row.kind, 'PERIOD', row.recruitmentStartAt)
    : undefined;
  const end = row.recruitmentEndAt
    ? formatDeadline(row.kind, 'PERIOD', row.recruitmentEndAt)
    : undefined;
  if (!start && !end) {
    return undefined;
  }
  return `${start ?? ''} ~ ${end ?? ''}`.trim();
}

/** 단계별 안내 한 줄. 문구는 `config/copy.json` 에서 바꾼다. 게시·종료는 따로 할 말이 없다. */
const HINTS: Partial<Record<CompanyPostStage, { text: string; className: string }>> = {
  REVIEWING: { text: copy.stage.reviewing.hint, className: 'text-gray-500' },
  REJECTED: { text: copy.stage.rejected.hint, className: 'text-error' },
};

const CARD_CLASSES: Record<CompanyPostStage, string> = {
  REVIEWING: 'border-gray-200 bg-white',
  REJECTED: 'border-red-200 bg-red-50/40',
  PUBLISHED: 'border-gray-200 bg-white',
  ENDED: 'border-gray-200 bg-gray-50',
};

export interface CompanyPostCardProps {
  row: Row;
  /** 수정 폼 주소가 종류마다 다르다. 채용공고와 부트캠프는 폼이 둘이다(`lib/routes.ts`). */
  tab: CompanyPostTab;
  onDelete: () => void;
  onClose: () => void;
  /** 이 카드의 요청이 도는 중. 메뉴를 잠근다. */
  pending?: boolean;
}

/**
 * 작성한 공고 카드 한 장(B2 시안, `prd-company-mypage-posts.md`). 표 한 줄이던 것을 카드로 바꾸고
 * `심사 · 게시` 배지 둘 대신 `작성 → 검수 → 게시 → 종료` 단계를 보인다.
 *
 * 데스크톱은 공고 정보 · 단계 · 버튼을 가로로 놓고, 모바일은 그 순서로 쌓는다.
 *
 * 제목만 링크다. 게시되지 않은 공고에는 링크가 없다(`lib/fetch.ts` 의 `href`).
 *
 * **점 세 개 메뉴에 `복사하기` 가 없다.** 기업 공고에 복사 API 가 없다(`lib/mutate.ts` 주석).
 * 마감된 공고에는 `마감하기` 가 없다 — 다시 눌러도 바뀌는 것이 없고, 부트캠프는 409 로 실패한다.
 */
export function CompanyPostCard({
  row,
  tab,
  onDelete,
  onClose,
  pending = false,
}: CompanyPostCardProps) {
  const stage = companyPostStage(row);
  /** 단계와 따로 본다. 반려가 종료보다 앞서므로 마감일이 지난 반려 공고는 단계가 `반려` 지만 마감됐다. */
  const closed = isRecruitmentClosed(row.recruitmentType, row.recruitmentEndAt, row.closedAt);
  /**
   * 마감된 건에는 D-day 를 그리지 않는다. 마감일이 아직 남았는데 손으로 마감한 공고(`closedAt` 만
   * 찍힌 상태)는 `computeDday` 가 그대로 `D-9` 를 돌려준다.
   */
  const dday = closed ? null : computeDday(row.recruitmentType, row.recruitmentEndAt);
  const urgent = isDdayUrgent(row.recruitmentType, row.recruitmentEndAt);
  const period = formatPeriod(row);
  const hint = HINTS[stage];

  return (
    <li
      className={cn(
        'grid gap-4 rounded-md border p-4 md:grid-cols-[minmax(0,1fr)_15rem_auto] md:items-center md:gap-6 md:px-6 md:py-5',
        CARD_CLASSES[stage],
      )}
    >
      <div className="flex min-w-0 items-start gap-3 md:items-center md:gap-4">
        <Thumbnail
          src={row.thumbnailUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-md border border-gray-100 md:h-12 md:w-12"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
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
            {row.href ? (
              <Link
                href={row.href}
                className="truncate text-base font-bold text-gray-900 hover:underline"
              >
                {row.title}
              </Link>
            ) : (
              <p className="truncate text-base font-bold text-gray-900">{row.title}</p>
            )}
          </div>
          {row.meta.length > 0 ? (
            <p className="mt-0.5 truncate text-xs text-gray-500">{row.meta.join(' · ')}</p>
          ) : null}
          {period || row.capacity !== undefined ? (
            <p className="mt-0.5 text-xs text-gray-400">
              {[period && `모집 ${period}`, row.capacity !== undefined && `${row.capacity}명`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          {hint ? <p className={cn('mt-2 text-xs', hint.className)}>{hint.text}</p> : null}
        </div>
      </div>

      <CompanyPostStageTrack stage={stage} />

      <div className="flex items-center justify-end gap-1">
        <Button
          asChild
          variant={stage === 'REJECTED' ? 'primary' : 'secondary'}
          size="sm"
          className="rounded-md px-4 whitespace-nowrap"
        >
          <Link href={companyPostEditHref(tab, row.id)}>수정하기</Link>
        </Button>

        {/* 여닫기는 `<details>` 라 자바스크립트가 없어도 열린다. v4 의 같은 메뉴와 같다. */}
        <details data-dropdown className="relative">
          <summary
            aria-label={`${row.title} 더보기`}
            className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 [&::-webkit-details-marker]:hidden"
          >
            <span aria-hidden="true" className="icon-[lucide--ellipsis-vertical] block h-4 w-4" />
          </summary>
          <div className="absolute right-0 z-10 mt-1 w-28 rounded-md border border-gray-200 bg-white py-1 shadow-md">
            <MenuAction label="삭제하기" onClick={onDelete} disabled={pending} />
            {closed ? null : <MenuAction label="마감하기" onClick={onClose} disabled={pending} />}
          </div>
        </details>
      </div>
    </li>
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
