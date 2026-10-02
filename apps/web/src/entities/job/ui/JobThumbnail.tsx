'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@ogonggo/ui';
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

/**
 * 썸네일이 사진이 아니라 로고인지 가르는 기준. 크롤러가 원문의 대표 이미지(og:image)를 썸네일로
 * 넣는데, 그리팅 공고는 그 자리가 회사 프로필 아이콘이다 — KOROT 100x101, 에코마케팅 500x500
 * (2026-09-30). 8:5 박스를 꽉 채우면 몇 배로 늘어나고 위아래가 잘려 뿌옇게 큰 글자가 된다.
 * 폭이 이보다 작거나 가로세로 비가 이보다 정사각형에 가까우면 로고로 본다. 4:3 사진(1.33)은
 * 사진으로 남는다.
 */
const MIN_PHOTO_WIDTH = 300;
const MIN_PHOTO_ASPECT = 1.2;

type CoverState = 'pending' | 'photo' | 'logo' | 'failed';

function judgeCover(img: HTMLImageElement): CoverState {
  const { naturalWidth: width, naturalHeight: height } = img;
  if (width === 0 || height === 0) {
    return 'failed';
  }
  return width >= MIN_PHOTO_WIDTH && width / height >= MIN_PHOTO_ASPECT ? 'photo' : 'logo';
}

const BOX_CLASS =
  'relative aspect-[8/5] w-full overflow-hidden rounded-lg bg-white shadow-sm transition-shadow group-hover:shadow-lg';

export interface JobThumbnailProps {
  companyName: string;
  coverImageUrl?: string;
  logoUrl?: string;
}

/**
 * 카드 상단 썸네일. 공고 대표 이미지(`coverImageUrl`)를 박스 안에 통째로 그린다. 없거나 불러오지
 * 못하면 그 자리에 회사 로고(`CompanyLogo`)를 그리고, 로고도 없으면 `CompanyLogo` 가 오공고
 * 로고(`Thumbnail` 폴백)로 떨어진다.
 *
 * 로드 실패를 `Thumbnail` 에 맡기지 않는 이유 — `Thumbnail` 은 실패하면 오공고 로고로 바로
 * 떨어진다. 여기서는 그 사이에 회사 로고가 한 단계 더 있다.
 *
 * 썸네일이 작거나 정사각형에 가까우면 사진이 아니라 로고로 보고 로고 규칙으로 작게 그린다
 * (`MIN_PHOTO_WIDTH`). 그래서 불러온 뒤에야 어느 쪽인지 정해진다.
 *
 * 대표 이미지는 자르지 않는다(`object-contain`). 전에는 박스를 꽉 채웠는데(`object-cover`) 비율이
 * 8:5 와 다르면 가장자리가 잘렸다 — GS건설(600x297)은 로고가 가장자리까지 차 있어 "GS건" 까지만
 * 보였다(2026-10-02). 남는 위아래·양옆은 같은 이미지를 흐리게 깔아 채운다. 사진은 이어져 보이고,
 * 흰 바탕 로고 이미지는 흰 바탕으로 보인다.
 *
 * 서버가 그린 이미지는 하이드레이션 전에 이미 뜨거나 실패할 수 있고, 그러면 `onLoad`·`onError` 가
 * 불리지 않는다. 마운트 직후 `complete` 면 한 번 더 판정한다 — 수집된 주소에 `%PUBLIC_URL%` 처럼
 * 채워지지 않은 값이 실제로 섞여 있다(LG 공고, 2026-09-30).
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
  const [cover, setCover] = useState<CoverState>('pending');
  const coverRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = coverRef.current;
    if (img?.complete) {
      setCover(judgeCover(img));
    }
  }, [coverImageUrl]);

  if (coverImageUrl && (cover === 'pending' || cover === 'photo')) {
    return (
      <div className={BOX_CLASS}>
        {cover === 'photo' ? (
          <img
            src={coverImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
          />
        ) : null}
        <img
          ref={coverRef}
          src={coverImageUrl}
          alt=""
          // 사진인지 가리기 전에는 숨긴다. 로고로 판정되면 크게 번쩍였다가 작아진다.
          className={cn(
            'absolute inset-0 h-full w-full object-contain',
            cover === 'pending' && 'opacity-0',
          )}
          onLoad={(event) => setCover(judgeCover(event.currentTarget))}
          onError={() => setCover('failed')}
        />
      </div>
    );
  }

  return (
    <div className={BOX_CLASS}>
      <CompanyLogo
        companyName={companyName}
        // 썸네일이 로고였으면 진짜 로고를 먼저 쓰고, 없으면 그 썸네일을 로고처럼 그린다.
        logoUrl={cover === 'logo' ? (logoUrl ?? coverImageUrl) : logoUrl}
        className="absolute inset-0 h-full w-full p-0 shadow-none"
        balance={CARD_LOGO_BALANCE}
      />
    </div>
  );
}
