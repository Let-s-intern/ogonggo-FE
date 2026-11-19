import type { DataLayerEvent, DataLayerParams } from '@/shared/analytics/dataLayer';
import { recordAdvertisementEvent } from './advertisementEvents';
import { adPostingClickData, adReportPosthogParams } from './adPostingContract';

/**
 * 광고 공고 카드에 연결된 공개 exposure metadata. 카드는 일반 카드와 같은 컴포넌트이고, 이 값이 있으면
 * `광고` 표시를 붙이고 누를 때 `ad_posting_click` 을 더 보낸다.
 *
 * 백엔드는 position enum이 없는 JOB_POSTING feed에서 이를 공급한다. 리스트에서는 이미 조회된 공고/부트캠프 중
 * target ID가 일치하는 카드만 표시 광고로 표시한다. productPosition은 현재 null이다.
 */
export interface AdSlot {
  /** 광고 id. 공고 id 가 아니다. */
  adId: number;
  placement: string;
  /** 표시 순서, 어드민이 정한 값. */
  position: number;
  category: 'JOB_POSTING';
  /** JOB_POSTING에는 현재 공개 position enum이 없어 null이다. */
  productPosition: string | null;
  adLabel: boolean;
}

/**
 * 광고 카드의 광고 값 3개. 공고·프로그램 이벤트(`job_card_click`, `program_card_click`, `program_impression`)가 모두
 * 싣는 값이라 일반 카드의 `NO_AD_PARAMS` 를 이것으로 덮는다. 이 값은 GTM dataLayer에는 유지하고, PostHog의 일반
 * 카드 클릭 이벤트에는 `is_promoted`만 남긴다. `ad_product` 의 허용값은 명세에 아직 없어 `ad_posting` 으로 보낸다.
 */
export function adParams(slot: AdSlot): DataLayerParams {
  return { is_promoted: 'Y', ad_product: 'ad_posting', ad_campaign_id: String(slot.adId) };
}

export function adPostingPosthogParams(slot: AdSlot): Record<string, unknown> {
  return adReportPosthogParams({
    exposureId: slot.adId,
    category: slot.category,
    position: slot.productPosition,
  });
}

/**
 * 광고 카드를 누를 때 일반 클릭 이벤트와 함께 보내는 것. 마케팅 명세(`shared/analytics/dataLayer.ts`)에 없는 이벤트라
 * GTM 트리거·태그는 마케팅팀이 더해야 한다(배너의 `banner_click` 과 같다).
 */
export function adPostingClickEvent(
  slot: AdSlot,
  contentType: 'job' | 'bootcamp',
  contentId: number,
): DataLayerEvent {
  const data = adPostingClickData(
    {
      exposureId: slot.adId,
      category: slot.category,
      position: slot.productPosition,
      displayOrder: slot.position,
      placement: slot.placement,
    },
    contentType,
    contentId,
  );
  return {
    ...data,
    posthogParams: data.posthogParams,
    onTrack: () => recordAdvertisementEvent(slot.adId, 'CLICK'),
  };
}
