import { track } from './dataLayer';

/**
 * 비즈 앱의 퍼널 이벤트. GTM(`dataLayer`)에만 보낸다. 앞의 일곱 개는 웹 `/biz` 의 무료 홍보 이벤트
 * (`apps/web/src/views/biz/model/analytics.ts`)와 이름·값 모양이 같다 — 이 앱의 `/free-promotion` 이 그 화면의
 * 복사본이라 같은 이벤트를 같은 속성에 보낸다. 뒤의 셋은 이 앱에만 있는 화면의 것이다. 모든 이벤트에
 * `site: 'biz'` 를 붙여 보고서에서 나눈다.
 *
 * 기업 회원 가입·로그인은 웹과 같은 `sign_up`·`login`(`method: 'email'`)을 쓴다(`trackCompanyAuth`).
 *
 * **모든 이벤트가 아래 키를 빠짐없이 싣는다.** dataLayer 는 앞선 push 의 값을 기억해, 키를 빼면 앞 이벤트의
 * 값이 다음 이벤트에 그대로 붙는다(`dataLayer.ts` 머리 주석). 값이 없으면 `''` 이다.
 *
 * GTM 컨테이너에 트리거·태그·변수를 더하는 일은 코드 밖이다. 이 목록을 PR 설명에 적어 넘긴다.
 */
export type BizEvent =
  /** 무료 홍보 페이지 조회. 마운트에서 한 번. */
  | 'biz_page_view'
  /** 무료 홍보 신청 버튼 클릭. `biz_placement` 가 `hero`·`floating`. */
  | 'biz_apply_click'
  /** 히어로 화면 이름 탭 클릭. `biz_screen` 이 화면 키(`jobs-list` 등). */
  | 'biz_hero_screen_click'
  /** 홍보 채널 선택. `biz_channel` 이 `INSTAGRAM`·`OPEN_CHAT`·`RECOMMENDATION`·방 값. */
  | 'biz_channel_select'
  /** 무료 홍보 신청서 입력 시작. 한 페이지에서 한 번. */
  | 'biz_form_start'
  /** 무료 홍보 신청 접수 성공. `biz_channel` 이 보낸 홍보 채널 값. */
  | 'biz_apply_submit'
  /** 완료 화면의 기업회원 가입 버튼 클릭. */
  | 'biz_signup_click'
  /** 소개 화면(`/`)의 행동 유도 링크 클릭. `biz_cta` 가 가는 곳. */
  | 'biz_landing_cta_click'
  /** 광고 신청 접수 성공(`/apply/ad` 의 마지막 단계). */
  | 'biz_ad_apply_submit'
  /** 공고 등록 성공. 임시저장은 세지 않는다. `biz_post_type` 이 `job`·`bootcamp`. */
  | 'biz_post_submit';

export interface BizEventParams {
  biz_placement?: '' | 'hero' | 'floating' | 'done';
  biz_screen?: string;
  biz_channel?: string;
  /** `biz_landing_cta_click` 의 목적지: `apply`(광고 안내·문의), `apply_ad`(광고 신청), `brochure`(소개서). */
  biz_cta?: string;
  biz_post_type?: 'job' | 'bootcamp';
}

export function trackBiz(event: BizEvent, params: BizEventParams = {}): void {
  track(event, {
    site: 'biz',
    biz_placement: params.biz_placement ?? '',
    biz_screen: params.biz_screen ?? '',
    biz_channel: params.biz_channel ?? '',
    biz_cta: params.biz_cta ?? '',
    biz_post_type: params.biz_post_type ?? '',
  });
}

/**
 * 기업 회원 가입(`sign_up`)·로그인(`login`). 웹의 기업 회원 가입·로그인(`CompanySignUpForm`, `CompanySignInPanel`)과
 * 같은 이름과 `method` 다. 기업 가입은 로그인 API 를 부르지 않고 토큰까지 받으므로 `sign_up` 만 나간다.
 */
export function trackCompanyAuth(event: 'sign_up' | 'login'): void {
  track(event, { method: 'email' });
}
