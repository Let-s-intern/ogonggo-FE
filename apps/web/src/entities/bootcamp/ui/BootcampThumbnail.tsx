import { cn } from '@ogonggo/ui';
import { Thumbnail } from '@/shared/ui/Thumbnail';

export interface BootcampThumbnailProps {
  representativeImageUrl?: string;
  logoUrl?: string;
  /** 박스 크기·라운드. 대표 이미지와 로고가 같은 박스를 쓴다. */
  className?: string;
  /** 로고를 그릴 때 박스 안쪽 여백. 박스 크기마다 다르다. */
  logoClassName?: string;
}

/**
 * 부트캠프 썸네일. 대표 이미지(`representativeImageUrl`)가 있으면 그것을 박스 안에 통째로 넣고,
 * 없으면 운영 회사 로고(`logoUrl`)를 흰 바탕에 여백을 두고 그린다. 둘 다 없으면 `Thumbnail`의
 * 오공고 로고다.
 *
 * 대표 이미지는 자르지 않는다(`object-contain`). 박스를 꽉 채우면(`object-cover`) 비율이 다른
 * 이미지는 가장자리가 잘려 글자가 끊긴다. 남는 위아래·양옆은 같은 이미지를 흐리게 깔아 채운다 —
 * 채용공고 카드(`entities/job/ui/JobThumbnail.tsx`)와 같은 방식이다.
 *
 * 고용24에서 수집한 과정은 대표 이미지가 늘 비어 있고 훈련기관 로고만 온다(백엔드 응답 설명).
 */
export function BootcampThumbnail({
  representativeImageUrl,
  logoUrl,
  className,
  logoClassName,
}: BootcampThumbnailProps) {
  if (representativeImageUrl) {
    return (
      <div className={cn('relative overflow-hidden bg-white', className)}>
        <img
          src={representativeImageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
        />
        <Thumbnail
          src={representativeImageUrl}
          alt=""
          className="relative h-full w-full object-contain"
        />
      </div>
    );
  }
  if (!logoUrl) {
    return <Thumbnail alt="" className={className} />;
  }
  return (
    <Thumbnail
      src={logoUrl}
      alt=""
      className={cn('bg-white object-contain', className, logoClassName)}
    />
  );
}
