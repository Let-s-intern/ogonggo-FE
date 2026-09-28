import { CompanyLogo, type LogoBalance } from './CompanyLogo';

/**
 * 8:5 카드에서 로고 넓이와 상한. 시드 로고 32장을 이 값으로 그려 맞췄다.
 *
 * 넓이는 시드에서 가장 긴 로고(토스증권, 8:1)가 폭 80% 상한에 겨우 닿는 크기로 잡는다. 이보다 크면
 * 4:1 넘는 로고가 전부 폭 상한에 걸려 폭이 같아지고, 그러면 높이가 비율만큼 벌어져 짧은 로고(토스,
 * 4:1)가 긴 로고(토스증권)의 두 배 높이로 보인다 — 처음에 0.2 로 잡았다가 실제로 그렇게 보였다.
 */
const CARD_LOGO_BALANCE: LogoBalance = {
  boxAspect: 8 / 5,
  area: 0.13,
  maxWidth: 0.8,
  maxHeight: 0.5,
};

export interface JobThumbnailProps {
  companyName: string;
}

/**
 * 카드 상단 썸네일. 채용공고 자체의 사진은 크롤러가 아예 수집하지 않는 데이터라(어떤 필드에도
 * 없다) 지어내지 않는다 — 대신 실제로 있는 유일한 이미지인 회사 로고(`CompanyLogo`, 없으면
 * 회색 placeholder로 이미 알아서 떨어진다)를 재사용한다. 목업 실측 비율은 4:3보다 낮은(더
 * 납작한) `8:5`에 가깝다.
 *
 * 북마크 버튼은 이 박스가 아니라 `JobCard`가 그린다. 카드 전체가 `<Link>`라 버튼을 그 안에
 * 두면 잘못된 마크업이 되고 누를 때 이동까지 함께 일어난다 — 카드 뿌리에서 링크의 형제로 두고
 * 이 박스의 오른쪽 위에 겹친다(PRD "카드 안의 버튼은 링크 밖에 둔다"). 이 박스는 카드의 첫
 * 자식이고 폭이 카드와 같아서, 겹치는 자리(`right-2 top-2`)가 전과 같은 자리다.
 *
 * D-day는 이 박스 위에 얹지 않는다 — 목업 실측 결과 인기 공고·전체 공고 카드 모두 D-day가
 * 썸네일 "아래" 메타 줄에 있다(`JobCard`).
 *
 * 라운드는 `rounded-lg` — 페이지의 다른 큰 박스(`Card`, `JobInfoGrid`, `ForBusinessBanner`)가
 * 전부 이 값이다. 작은 로고·버튼만 `rounded-md`을 쓴다.
 */
export function JobThumbnail({ companyName }: JobThumbnailProps) {
  return (
    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-lg bg-white shadow-sm">
      <CompanyLogo
        companyName={companyName}
        className="absolute inset-0 h-full w-full p-0 shadow-none"
        balance={CARD_LOGO_BALANCE}
      />
    </div>
  );
}
