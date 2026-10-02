import type { BootcampDetail } from '@/entities/bootcamp/model/types';
import { Thumbnail } from '@/shared/ui/Thumbnail';

export interface BootcampPhotosProps {
  images: BootcampDetail['images'];
}

/**
 * 상세에서만 보여 주는 사진(`images`). 고용24에서 수집한 과정은 훈련기관 소개 화면의 사진이
 * 들어 있고, 그 밖의 과정은 빈 배열이다. 순서는 `displayOrder`다.
 *
 * 값이 없으면 섹션을 통째로 그리지 않는다 — `BootcampCurriculum`과 같은 규칙이다.
 *
 * 사진의 비율이 제각각이다(실서버 기준 정사각 로고, 4:3 시설 사진, 세로 배너가 섞인다). 4:3 칸에
 * `object-contain`으로 넣어 어느 쪽도 잘리지 않게 한다. 칸 크기가 먼저 정해져 있어 사진이 늦게
 * 떠도 아래 섹션이 밀리지 않는다. 모바일은 가로로 넘긴다.
 */
export function BootcampPhotos({ images }: BootcampPhotosProps) {
  if (images.length === 0) {
    return null;
  }

  const ordered = [...images].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900">시설 사진</h2>
      <ul className="-mx-4 mt-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
        {ordered.map((image) => (
          <li key={image.url} className="w-[220px] shrink-0 snap-start md:w-auto">
            <figure className="flex flex-col gap-2">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-50">
                <Thumbnail
                  src={image.url}
                  alt={image.caption ?? ''}
                  className="h-full w-full object-contain"
                />
              </div>
              {image.caption ? (
                <figcaption className="text-sm text-gray-600">{image.caption}</figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}
