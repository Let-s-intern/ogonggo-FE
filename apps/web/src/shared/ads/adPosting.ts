import type { DataLayerEvent, DataLayerParams } from '@/shared/analytics/dataLayer';

/**
 * 광고 공고 카드 한 장이 어느 광고의 몇 번째 칸인지(이슈 #573). 카드는 일반 카드와 같은 컴포넌트이고, 이 값이 있으면
 * `adLabel` 에 따라 `AD` 표시를 붙이고 누를 때 `ad_posting_click` 을 더 보낸다. 값은 광고 공고 공개 조회
 * (`./fetchAdPostings.ts`)에서 온다. 자리 이름은 그 응답의 `position` 문자열이다.
 */
export interface AdSlot {
  /** 광고 노출 id(`exposureId`). 공고 id 가 아니다. 광고 리포트 이벤트의 `exposureId` 로도 나간다. */
  adId: number;
  placement: string;
  /** 자리 안 순서, 1부터. 어드민이 정한 순서이고 목록의 칸 번호와 같다. */
  position: number;
  /** 카드에 `AD` 표시를 붙일지. 광고 공고 응답의 `adLabel` 그대로다. 꺼져 있어도 광고 이벤트는 그대로 나간다. */
  adLabel: boolean;
}

/**
 * 광고 카드의 광고 값 3개. 공고·프로그램 이벤트(`job_card_click`, `program_card_click`, `program_impression`)가 모두
 * 싣는 값이라 일반 카드의 `NO_AD_PARAMS` 를 이것으로 덮는다. `ad_product` 의 허용값은 명세에 아직 없어
 * `ad_posting` 으로 보낸다 — 마케팅팀과 맞춰야 한다.
 */
export function adParams(slot: AdSlot): DataLayerParams {
  return { is_promoted: 'Y', ad_product: 'ad_posting', ad_campaign_id: String(slot.adId) };
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
  return {
    event: 'ad_posting_click',
    params: {
      ad_id: slot.adId,
      ad_placement: slot.placement,
      ad_position: slot.position,
      content_type: contentType,
      content_id: String(contentId),
    },
  };
}
