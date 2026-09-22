import Link from 'next/link';
import { Badge, cn } from '@ogonggo/ui';
import type { ApplicationBoardItem } from '@/features/application-board';
import { computeDday, isDdayUrgent, isRecruitmentClosed } from '@/shared/lib/dday';
import { Thumbnail } from '@/shared/ui/Thumbnail';

export interface ApplicationBoardCardProps {
  item: ApplicationBoardItem;
  /**
   * 칸에서 빼기. 넘기지 않으면 `X` 자체를 그리지 않는다 — **옮길 수 없는 단계의 카드에는
   * 아무 조작도 없다**(PRD 결정 기록).
   */
  onRemove?: () => void;
  /** 이동 요청이 도는 중. 같은 카드를 두 번 누르는 것을 막는다. */
  removing?: boolean;
}

/**
 * 칸 안의 카드 한 장(목업 `docs/asset/v7 스크랩한 공고 칸반/image.png`).
 * 회사 로고 · 회사명 / 제목 / `인턴 · 마케팅 · 경력 무관` · `D-1` 이다.
 *
 * 썸네일이 없으면 오공고 로고로 떨어진다(`shared/ui/Thumbnail.tsx`). 회색 빈 네모를 두지
 * 않는 이유는 그쪽 주석에 있다 — 빈 네모는 "못 불러왔다" 와 "원래 없다" 를 구분해 주지 않는다.
 *
 * 마감된 건은 D-day 자리에 회색 `마감` 배지다. `entities/job/ui/JobCard.tsx` 와
 * `widgets/mypage-list/ui/MyPageListRowCells.tsx` 가 이미 같은 판단을 한다 — 배지를 통째로
 * 빼면 그 자리가 아무 말도 하지 않는다.
 *
 * 카드 전체가 링크이고, 칸에서 빼는 `X` 는 그 링크 **밖의 형제**다 — 링크 안에 버튼을 두면
 * 잘못된 마크업이고 누를 때 상세로 이동까지 함께 일어난다. `entities/job/ui/JobCard.tsx` 의
 * 북마크 버튼과 같은 모양이다.
 */
export function ApplicationBoardCard({ item, onRemove, removing }: ApplicationBoardCardProps) {
  const dday = computeDday(item.recruitmentType, item.recruitmentEndAt);
  const urgent = isDdayUrgent(item.recruitmentType, item.recruitmentEndAt);
  const closed = isRecruitmentClosed(item.recruitmentType, item.recruitmentEndAt, item.closedAt);

  return (
    <div className="relative">
      <Link href={item.href} className="block rounded-xl bg-white p-4">
        <div className={cn('flex items-center gap-2', onRemove && 'pr-6')}>
          <Thumbnail
            src={item.thumbnailUrl}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg border border-gray-100"
          />
          <p className="truncate text-sm font-semibold text-gray-600">{item.caption}</p>
        </div>
        <p className="line-clamp-2 pt-3 text-[15px] font-bold text-gray-900">{item.title}</p>
        <div className="flex items-center justify-between gap-2 pt-2">
          <p className="truncate text-xs text-gray-400">{item.meta.join(' · ')}</p>
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
        </div>
      </Link>
      {onRemove ? (
        <button
          type="button"
          aria-label={`${item.title} 칸에서 빼기`}
          disabled={removing}
          onClick={onRemove}
          className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center text-gray-400 disabled:text-gray-200"
        >
          <span aria-hidden="true" className="icon-[lucide--x] block h-5 w-5" />
        </button>
      ) : null}
    </div>
  );
}
