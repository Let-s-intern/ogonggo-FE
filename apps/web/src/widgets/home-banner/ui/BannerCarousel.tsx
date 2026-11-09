'use client';

import { useEffect, useState } from 'react';
import { cn } from '@ogonggo/ui';
import type { AdvertisementExposureResponse } from '@ogonggo/api';
import { TrackedLink } from '@/shared/analytics/TrackedLink';
import type { BannerPlacement } from '../model/placement';

/** 여럿일 때 다음 배너로 넘기는 간격. */
const ROTATE_MS = 5000;

export interface BannerCarouselProps {
  /** 서버가 정한 순서 그대로. 비어 있으면 부르지 않는다(`HomeBannerSlot`). */
  banners: AdvertisementExposureResponse[];
  placement: BannerPlacement;
  /**
   * `wide` 는 홈의 가로 배너(PC 1200×120, md 부터)이고 `side` 는 공고 상세 사이드바의 세로 배너(PC 400×500)다.
   * `side` 는 사이드바가 본문 옆에 서는 lg 부터 세로 소재이고, 그 아래(사이드바가 본문 아래로 내려간다)는 홈과 같은
   * 모바일 소재(750×200)다.
   */
  variant?: 'wide' | 'side';
}

const FRAME_CLASS = {
  wide: 'aspect-[750/200] rounded-xl md:aspect-[1200/120] md:rounded-2xl',
  side: 'aspect-[750/200] rounded-xl lg:aspect-[400/500]',
} as const;

/**
 * 가로 배너 한 자리. PC(md 이상)는 1200×120, 모바일은 750×200 비율이다. BE 노출에는 이미지가 하나(`imageUrl`)뿐이라
 * 두 폭에 같은 이미지를 `object-cover` 로 채운다(모바일 이미지 칸은 BE 에 요청함).
 *
 * 여럿이면 5초마다 넘기고 아래 점으로 고른다. 마우스를 올리거나 초점이 안에 있으면 멈추고, 움직임 줄이기를
 * 켠 사람에게는 넘기지 않는다(점으로만 넘긴다). 무작위 하나 대신 넘기기를 고른 이유는 운영자가 정한 순서가
 * 그대로 보이고, 서버 렌더와 하이드레이션이 같은 배너(첫 번째)로 시작해 어긋나지 않기 때문이다.
 *
 * 배너는 모두 그려 두고 보이는 것만 남긴다. 숨은 배너는 `inert` 라 탭 이동과 스크린 리더에서 빠진다.
 *
 * 외부 주소는 새 탭, 사이트 안 경로는 같은 탭이다(BE 에 새 탭 칸이 없다). 누르면 `banner_click` 을 GTM·PostHog 로
 * 보낸다 — 마케팅 명세(`shared/analytics/dataLayer.ts`)에 아직 없는 이벤트라 GTM 쪽 태그는 마케팅팀이 더해야 한다.
 *
 * `광고` 표시는 배너가 `adLabel` 일 때만 붙는다. 오공고 자체 홍보 배너는 광고주가 따로 없어 붙이지 않고,
 * 돈을 받고 싣는 배너는 광고임을 밝혀야 해서 운영자가 켠다.
 */
export function BannerCarousel({ banners, placement, variant = 'wide' }: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const timer = window.setInterval(() => setCurrent((index) => (index + 1) % count), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused]);

  return (
    <section
      aria-label="오공고 배너"
      aria-roledescription={count > 1 ? '캐러셀' : undefined}
      data-banner-placement={placement}
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div className={cn('grid w-full overflow-hidden bg-gray-50', FRAME_CLASS[variant])}>
        {banners.map((banner, index) => {
          const active = index === current;
          const external = /^https?:\/\//.test(banner.linkUrl);
          const newTab = external;
          return (
            <div
              key={banner.id}
              role={count > 1 ? 'group' : undefined}
              aria-roledescription={count > 1 ? '슬라이드' : undefined}
              aria-label={count > 1 ? `${index + 1} / ${count}` : undefined}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                'relative col-start-1 row-start-1 transition-opacity duration-500 motion-reduce:transition-none',
                active ? 'opacity-100' : 'opacity-0',
              )}
            >
              <TrackedLink
                href={banner.linkUrl}
                target={newTab ? '_blank' : undefined}
                rel={newTab ? 'noopener noreferrer' : undefined}
                className="block h-full w-full"
                events={[
                  {
                    event: 'banner_click',
                    params: {
                      banner_id: banner.id,
                      banner_placement: placement,
                      banner_position: index + 1,
                      link_url: banner.linkUrl,
                    },
                  },
                ]}
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.name}
                  // 맨 위 자리의 첫 배너만 바로 받는다. 나머지는 화면 아래이거나 넘겨야 보인다.
                  loading={placement === 'HOME_TOP' && index === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full object-cover"
                />
                {banner.adLabel ? (
                  <span className="absolute top-2 right-2 rounded bg-gray-900/60 px-1.5 py-0.5 text-[11px] leading-none font-medium text-white md:top-3 md:right-3">
                    광고
                  </span>
                ) : null}
              </TrackedLink>
            </div>
          );
        })}
      </div>

      {count > 1 ? (
        // 점은 배너 아래에 둔다. 이미지 위에 얹으면 소재의 글자를 가린다(모바일 750×200 은 아래쪽까지 글자가 찬다).
        <div className="mt-1 flex justify-center">
          {banners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`${index + 1}번째 배너 보기`}
              aria-current={index === current ? 'true' : undefined}
              onClick={() => setCurrent(index)}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  index === current ? 'w-4 bg-blue-500' : 'w-1.5 bg-gray-300',
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
