import type { DataLayerEvent } from '@/shared/analytics/dataLayer';

/**
 * `/community` 의 밖으로 나가는 버튼(`참여하기`·`팔로우`) 클릭. GTM(`dataLayer`)과 PostHog 에 같은 이름으로
 * 보낸다(`track`). 이름은 기존 이벤트처럼 `snake_case` 다.
 *
 * 두 버튼 모두 같은 키를 빠짐없이 싣는다 — dataLayer 는 앞선 push 의 값을 기억해, 키를 빼면 앞 이벤트의 값이
 * 다음 이벤트에 그대로 붙는다(`dataLayer.ts` 머리 주석).
 *
 * GTM 컨테이너에 트리거·태그를 더하는 일은 코드 밖이다. 이 이름을 PR 설명에 적어 넘긴다.
 */
export function communityLinkClick(
  channel: 'open_chat' | 'instagram',
  name: string,
  url: string,
): DataLayerEvent {
  return {
    event: 'community_link_click',
    params: { community_channel: channel, community_name: name, outbound_url: url },
  };
}
