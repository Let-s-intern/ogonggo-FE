export interface AttachedImagesProps {
  /** 글 응답의 `images`. 첨부 순서대로 그린다. */
  images: readonly { id: string; url: string }[];
}

/**
 * 글 본문 아래 첨부 사진 줄(시안 `v13 취준고민/상세.webp`, `모바일 상세.webp`). 취준고민과
 * 사이드·스터디 상세가 같이 쓴다.
 *
 * PC 는 한 줄 3칸 같은 폭이다. 1~2장이어도 칸 폭은 3칸 기준이고 왼쪽부터 채운다 — 장수에 따라
 * 사진이 커졌다 작아졌다 하지 않는다. 모바일은 세로로 쌓는다. 칸 비율은 시안의 PC 8:5, 모바일 4:3 이다.
 *
 * 사진은 잘라 채우지 않고 칸 안에 통째로 보인다(`object-contain`, 회색 바탕). 사용자가 올린 캡처가
 * 대부분이라 잘리면 내용이 사라진다. 누르면 원본을 새 탭으로 연다.
 *
 * 사진이 없으면 아무것도 그리지 않는다. `img` 를 쓰는 이유는 `CoverImageField` 와 같다.
 */
export function AttachedImages({ images }: AttachedImagesProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-1 gap-2 md:grid-cols-3">
      {images.map((image, index) => (
        <li key={image.id}>
          <a
            href={image.url}
            target="_blank"
            rel="noopener"
            aria-label={`첨부 사진 ${index + 1} 원본 보기`}
            className="block aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 md:aspect-[8/5]"
          >
            {/* oxlint-disable-next-line no-img-element */}
            <img src={image.url} alt="" className="size-full object-contain" />
          </a>
        </li>
      ))}
    </ul>
  );
}
