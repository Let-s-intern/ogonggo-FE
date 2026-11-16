import { cn } from '@ogonggo/ui';
import { NOTICE_CATEGORY_META, type NoticeCategory } from '../model/categories';

/** 최근 공지 표시(`N`). 공지사항 시안의 파란 원이다. */
export function NewNoticeMark({ className }: { className?: string }) {
  return (
    <span
      aria-label="새 글"
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-500',
        className,
      )}
    >
      N
    </span>
  );
}

/** 카테고리 아이콘 상자. 카테고리 칸과 썸네일 없는 추천 카드가 쓴다. */
export function NoticeCategoryIcon({
  category,
  className,
  iconClassName,
}: {
  category: NoticeCategory;
  className?: string;
  iconClassName?: string;
}) {
  const meta = NOTICE_CATEGORY_META[category];
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center', meta.tone, className)}
    >
      <span className={cn(meta.icon, 'block', iconClassName)} />
    </span>
  );
}

/**
 * 추천 카드의 그림. 운영자가 올린 썸네일이 있으면 그것을, 없으면 카테고리 아이콘을 크게 그린다. 칸 크기가 먼저
 * 정해져 있어 그림이 늦게 떠도 아래 글이 밀리지 않는다.
 */
export function NoticeThumbnail({
  category,
  thumbnailUrl,
}: {
  category: NoticeCategory;
  thumbnailUrl?: string;
}) {
  return (
    <div className="aspect-[422/220] w-full overflow-hidden rounded-xl bg-gray-50">
      {thumbnailUrl ? (
        // 운영자가 올린 주소를 그대로 쓴다. 도메인이 정해져 있지 않아 `next/image` 대신 `img` 다.
        // oxlint-disable-next-line no-img-element
        <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <NoticeCategoryIcon
          category={category}
          className="h-full w-full"
          iconClassName="h-14 w-14"
        />
      )}
    </div>
  );
}
