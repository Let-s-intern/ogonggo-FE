import type { ComponentProps } from 'react';

/**
 * `#apply` 로 내려가는 신청 버튼. web 은 누를 때 `biz_apply_click` 을 보내지만 이 앱에는 분석 도구가 없어
 * 보내지 않는다.
 */
export function BizApplyLink(props: Omit<ComponentProps<'a'>, 'href'>) {
  return <a {...props} href="#apply" />;
}
