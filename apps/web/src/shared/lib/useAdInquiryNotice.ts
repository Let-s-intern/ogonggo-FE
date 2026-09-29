'use client';

import { useToast } from '@ogonggo/ui';
import { SUPPORT_EMAIL } from '@/shared/ui/ErrorState';

/**
 * `광고 상품 문의하기` 를 눌렀을 때 문의할 이메일을 알려 준다. 홈 하단 배너(`ForBusinessBanner`)와
 * 모바일 메뉴(`MobileSiteHeader`)의 같은 버튼이 쓴다.
 *
 * 문의 양식이나 전용 화면이 아직 없어 이메일로 받는다. 주소는 오류 화면의 문의처와 같다
 * (`SUPPORT_EMAIL`). `mailto:` 로 바로 여는 대신 문구를 띄우는 것은, 메일 앱이 연결되지 않은
 * 브라우저에서는 눌러도 아무 일도 일어나지 않기 때문이다. 옆의 `이메일 복사` 로 주소를 가져간다.
 */
export function useAdInquiryNotice(): () => void {
  const toast = useToast();

  return () =>
    toast.show({
      message: `광고 상품 문의는 ${SUPPORT_EMAIL} 로 메일 주세요.`,
      action: {
        label: '이메일 복사',
        onClick: () => {
          void navigator.clipboard
            .writeText(SUPPORT_EMAIL)
            .then(() => toast.show({ message: '이메일 주소를 복사했어요.' }))
            .catch(() => toast.show({ message: `${SUPPORT_EMAIL} 를 직접 적어 주세요.` }));
        },
      },
    });
}
