import { cn } from '@ogonggo/ui';

export interface AuthorAvatarProps {
  /** 프로필 사진 주소. 백엔드는 프로필이 없는 작성자에게 `null` 을 보낸다. */
  src?: string | null;
  /** 크기·모서리. 바탕(회색) 과 사진 채우기는 여기서 정한다. */
  className?: string;
}

/**
 * 작성자 아바타 — 사진이 있으면 사진, 없으면 회색 사각형(`v13 취준고민/상세.webp`). 시안은 사진 자리를
 * 회색 사각형으로 그린다. PRD 결정 5 의 "프로필 사진이 없으면 회색 기본 아바타" 가 이것이다.
 *
 * `Thumbnail` 을 쓰지 않는다. 그쪽 폴백은 오공고 로고라 사진이 없는 모든 작성자가 로고로 보인다.
 * 사진을 불러오지 못하면 `alt` 가 비어 있어 깨진 그림 표시 없이 바탕의 회색만 남는다.
 *
 * 글자 옆의 장식이라 스크린 리더에는 숨긴다 — 닉네임이 바로 옆에 있다.
 */
export function AuthorAvatar({ src, className }: AuthorAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn('block h-6 w-6 shrink-0 overflow-hidden rounded-sm bg-gray-300', className)}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}
    </span>
  );
}
