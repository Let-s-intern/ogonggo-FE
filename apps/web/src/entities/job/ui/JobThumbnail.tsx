'use client';

import { useState } from 'react';
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
  coverImageUrl?: string;
  logoUrl?: string;
}

/**
 * 카드 상단 썸네일. 공고 대표 이미지(`coverImageUrl`)를 박스에 꽉 채워 그린다. 없거나 불러오지
 * 못하면 그 자리에 회사 로고(`CompanyLogo`)를 그리고, 로고도 없으면 `CompanyLogo` 가 오공고
 * 로고(`Thumbnail` 폴백)로 떨어진다.
 *
 * 로드 실패를 `Thumbnail` 에 맡기지 않는 이유 — `Thumbnail` 은 실패하면 오공고 로고로 바로
 * 떨어진다. 여기서는 그 사이에 회사 로고가 한 단계 더 있다.
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
export function JobThumbnail({ companyName, coverImageUrl, logoUrl }: JobThumbnailProps) {
  const [coverFailed, setCoverFailed] = useState(false);

  return (
    <div className="relative aspect-[8/5] w-full overflow-hidden rounded-lg bg-white shadow-sm">
      {coverImageUrl && !coverFailed ? (
        <img
          src={coverImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setCoverFailed(true)}
        />
      ) : (
        <CompanyLogo
          companyName={companyName}
          logoUrl={logoUrl}
          className="absolute inset-0 h-full w-full p-0 shadow-none"
          balance={CARD_LOGO_BALANCE}
        />
      )}
    </div>
  );
}
