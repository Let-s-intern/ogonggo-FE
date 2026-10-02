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
 * 부트캠프 썸네일. 대표 이미지(`representativeImageUrl`)가 있으면 그것을 박스에 꽉 채우고, 없으면
 * 운영 회사 로고(`logoUrl`)를 흰 바탕에 여백을 두고 잘리지 않게 그린다. 둘 다 없으면 `Thumbnail`의
 * 오공고 로고다.
 *
 * 고용24에서 수집한 과정은 대표 이미지가 늘 비어 있고 훈련기관 로고만 온다(백엔드 응답 설명).
 * 로고를 대표 이미지처럼 `object-cover`로 채우면 글자가 잘려서, 로고일 때만 `object-contain`이다.
 */
export function BootcampThumbnail({
  representativeImageUrl,
  logoUrl,
  className,
  logoClassName,
}: BootcampThumbnailProps) {
  if (representativeImageUrl || !logoUrl) {
    return <Thumbnail src={representativeImageUrl} alt="" className={className} />;
  }
  return (
    <Thumbnail
      src={logoUrl}
      alt=""
      className={cn('bg-white object-contain', className, logoClassName)}
    />
  );
}
