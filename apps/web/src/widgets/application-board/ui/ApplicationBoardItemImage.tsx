import type { ApplicationBoardItem } from '@/features/application-board';
import { CompanyLogo } from '@/entities/job/ui/CompanyLogo';
import { Thumbnail } from '@/shared/ui/Thumbnail';

/**
 * 카드·행 왼쪽의 작은 그림. 채용공고는 회사 로고(`CompanyLogo`), 나머지는 썸네일이다.
 * 공고 썸네일은 배너 이미지라 40px 칸에서 무엇인지 알아볼 수 없다.
 */
export function ApplicationBoardItemImage({
  item,
  className,
}: {
  item: ApplicationBoardItem;
  className: string;
}) {
  return item.logo ? (
    <CompanyLogo
      companyName={item.logo.companyName}
      logoUrl={item.logo.logoUrl}
      className={className}
    />
  ) : (
    <Thumbnail src={item.thumbnailUrl} alt="" className={className} />
  );
}
