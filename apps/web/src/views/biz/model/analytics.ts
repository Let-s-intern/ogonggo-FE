import { track } from '@/shared/analytics/dataLayer';

/**
 * `/biz` 분석 이벤트(PRD `분석`). GTM(`dataLayer`)과 PostHog 에 같은 이름으로 보낸다(`track`).
 *
 * 이름은 기존 이벤트(`job_card_click`, `filter_apply`)처럼 `snake_case` 이고 `biz_` 로 시작한다. 모든 이벤트에
 * `site: 'biz'` 를 붙여 보고서에서 경로와 함께 나눈다.
 *
 * **모든 이벤트가 아래 키를 빠짐없이 싣는다.** dataLayer 는 앞선 push 의 값을 기억해, 키를 빼면 앞 이벤트의
 * `biz_channel` 이 다음 이벤트에 그대로 붙는다(`dataLayer.ts` 머리 주석). 값이 없으면 `''` 이다.
 *
 * GTM 컨테이너에 트리거·태그를 더하는 일은 코드 밖이다. 이 목록을 PR 설명에 적어 넘긴다.
 */
export type BizEvent =
  /** 페이지 조회. 마운트에서 한 번. */
  | 'biz_page_view'
  /** 신청 버튼 클릭. `biz_placement` 가 `hero`·`floating`. */
  | 'biz_apply_click'
  /** 히어로 화면 이름 탭 클릭. `biz_screen` 이 화면 키(`jobs-list` 등). */
  | 'biz_hero_screen_click'
  /** 홍보 채널 선택. `biz_channel` 이 `INSTAGRAM`·`OPEN_CHAT`·`RECOMMENDATION`·방 값(`OPEN_CHAT_SALES` 등). */
  | 'biz_channel_select'
  /** 신청서 입력 시작. 한 페이지에서 한 번. */
  | 'biz_form_start'
  /** 신청 접수 성공. `biz_channel` 이 보낸 홍보 채널 값. */
  | 'biz_apply_submit'
  /** 완료 화면의 기업회원 가입 버튼 클릭. */
  | 'biz_signup_click';

export interface BizEventParams {
  biz_placement?: '' | 'hero' | 'floating' | 'done';
  biz_screen?: string;
  biz_channel?: string;
}

export function trackBiz(event: BizEvent, params: BizEventParams = {}): void {
  track(event, {
    site: 'biz',
    biz_placement: params.biz_placement ?? '',
    biz_screen: params.biz_screen ?? '',
    biz_channel: params.biz_channel ?? '',
  });
}
