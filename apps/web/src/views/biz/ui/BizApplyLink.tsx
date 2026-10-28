'use client';

import type { ComponentProps } from 'react';
import { trackBiz } from '../model/analytics';

/** `#apply` 로 내려가는 신청 버튼. 누르면 자리(`hero`·`floating`)와 함께 `biz_apply_click` 을 보낸다. */
export function BizApplyLink({
  placement,
  onClick,
  ...props
}: Omit<ComponentProps<'a'>, 'href'> & { placement: 'hero' | 'floating' }) {
  return (
    <a
      {...props}
      href="#apply"
      onClick={(event) => {
        trackBiz('biz_apply_click', { biz_placement: placement });
        onClick?.(event);
      }}
    />
  );
}
